/// <reference types="vite/client" />

import { supabase } from '../integrations/supabase/client';

export const api = {
  getMenu: async (slug: string) => {
    if (!slug) return null;

    const { data: adminData } = await supabase
      .from('app_admins')
      .select('status, store_name')
      .eq('slug', slug)
      .maybeSingle();

    if (adminData && adminData.status === 'blocked') {
      return {
        storeBlocked: true,
        isOpen: false, hasDelivery: false, prepTime: 0, deliveryFee: 0,
        title: adminData.store_name || "Loja Indisponível",
        description: "", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [], slides: []
      };
    }

    const { data, error } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('store_slug', slug)
      .maybeSingle();
      
    if (error || !data) {
      return { 
        isOpen: false, hasDelivery: false, prepTime: 40, deliveryFee: 5,
        title: "Marmitaria Talita", description: "Configure seu cardápio.", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [], slides: []
      };
    }
    return data.menu_data;
  },
  
  updateMenu: async (slug: string, menuData: any) => {
    const { data, error } = await supabase
      .from('store_settings')
      .upsert({ store_slug: slug.toLowerCase().trim(), menu_data: menuData, updated_at: new Date().toISOString() }, { onConflict: 'store_slug' })
      .select()
      .maybeSingle();
      
    if (error) throw new Error(error.message || "Erro ao salvar.");
    return data?.menu_data || menuData;
  },

  getOrders: async (slug: string) => {
    const { data } = await supabase.from('orders').select('*').eq('store_slug', slug).order('created_at', { ascending: false });
    return data || [];
  },

  getMyOrders: async (userId: string) => {
    const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  updateOrderStatus: async (id: string, status: string) => {
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  checkAdminAccess: async (email: string) => {
    if (!email) return null;
    const { data } = await supabase.from('app_admins').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    return data;
  },

  getAppAdmins: async () => {
    const { data } = await supabase.from('app_admins').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  addAppAdmin: async (email: string, storeName: string, slug: string) => {
    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const { error: adminError } = await supabase.from('app_admins').insert({ email: email.toLowerCase().trim(), store_name: storeName, slug: cleanSlug, status: 'active' });
    if (adminError) throw new Error("Erro ao cadastrar lojista.");
  },

  toggleAppAdminStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const { error } = await supabase.from('app_admins').update({ status: newStatus }).eq('id', id);
    if (error) throw new Error("Erro ao alterar status.");
    return newStatus;
  },

  deleteAppAdmin: async (id: string) => {
    const { error } = await supabase.from('app_admins').delete().eq('id', id);
    if (error) throw new Error("Erro ao excluir lojista.");
  },

  // Nova função: Deleta admin E store_settings
  deleteAppAdminWithStore: async (id: string, slug: string) => {
    // Primeiro deleta store_settings
    const { error: storeError } = await supabase
      .from('store_settings')
      .delete()
      .eq('store_slug', slug);
    
    if (storeError) {
      console.error("Erro ao deletar store_settings:", storeError);
      // Continua mesmo se store_settings não existir
    }
    
    // Depois deleta o admin
    const { error: adminError } = await supabase.from('app_admins').delete().eq('id', id);
    if (adminError) throw new Error("Erro ao excluir lojista.");
  },

  getAllStores: async () => {
    const { data: activeAdmins } = await supabase.from('app_admins').select('slug').eq('status', 'active');
    if (!activeAdmins || activeAdmins.length === 0) return [];
    const activeSlugs = activeAdmins.map(a => a.slug);
    const { data } = await supabase.from('store_settings').select('store_slug, menu_data').in('store_slug', activeSlugs);
    if (!data) return [];
    return data.map(item => ({
      slug: item.store_slug,
      title: item.menu_data?.title || "Nova Loja",
      description: item.menu_data?.description || "",
      image: item.menu_data?.image || "",
      isOpen: item.menu_data?.isOpen || false
    }));
  },

  getProfile: async (userId: string) => {
    if (!userId) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
  },

  processAI: async (message: string, context: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ message, context })
    });
    
    if (!res.ok) throw new Error(`Erro na IA: ${res.status}`);
    return res.json();
  }
};