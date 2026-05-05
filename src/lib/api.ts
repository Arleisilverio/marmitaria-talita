import { supabase } from '../integrations/supabase/client';

export const api = {
  // Busca o cardápio de uma loja específica
  getMenu: async (slug: string) => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('store_slug', slug)
      .single();
      
    if (error || !data) {
      return { 
        isOpen: false, isDeliveryOpen: false, prepTime: 40, deliveryFee: 5,
        title: "Nova Loja", description: "Configure seu cardápio no painel admin.", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [], slides: []
      };
    }
    return data.menu_data;
  },
  
  updateMenu: async (slug: string, menuData: any) => {
    const { data, error } = await supabase
      .from('store_settings')
      .upsert({ store_slug: slug, menu_data: menuData, updated_at: new Date().toISOString() })
      .select()
      .single();
      
    if (error) throw new Error("Erro ao salvar configurações da loja.");
    return data.menu_data;
  },

  getOrders: async (slug: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_slug', slug)
      .order('created_at', { ascending: false });
      
    return data || [];
  },

  updateOrderStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- FUNÇÕES DO SAAS (SUPER ADMIN) ---- //
  checkAdminAccess: async (email: string) => {
    const { data } = await supabase
      .from('app_admins')
      .select('*')
      .eq('email', email)
      .single();
    return data;
  },

  getAppAdmins: async () => {
    const { data } = await supabase
      .from('app_admins')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },

  addAppAdmin: async (email: string, storeName: string, slug: string) => {
    const { error } = await supabase
      .from('app_admins')
      .insert({ email, store_name: storeName, slug: slug.toLowerCase().replace(/\s+/g, '-') });
    if (error) throw new Error("Erro ao cadastrar lojista. E-mail ou Slug já podem estar em uso.");
  },

  toggleAppAdminStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const { error } = await supabase
      .from('app_admins')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) throw new Error("Erro ao alterar status.");
    return newStatus;
  },

  processAI: async (message: string, context: any) => {
    const res = await fetch(`https://kigindzghkbkwgzljrdz.supabase.co/functions/v1/ai-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ2luZHpnaGtia3dnemxqcmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjA4MzQsImV4cCI6MjA5MzMzNjgzNH0.aRPE1ez64r6UuivehA3rQJHPEdZrOmKdyLrTcAlL5J4`
      },
      body: JSON.stringify({ message, context })
    });
    return res.json();
  }
};