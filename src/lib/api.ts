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
      .update({ menu_data: menuData, updated_at: new Date().toISOString() })
      .eq('store_slug', slug)
      .select()
      .single();
      
    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(error.message || "Erro ao salvar configurações da loja.");
    }
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

  getMyOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
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

  deleteAppAdmin: async (id: string) => {
    const { error } = await supabase
      .from('app_admins')
      .delete()
      .eq('id', id);
    if (error) throw new Error("Erro ao excluir lojista.");
  },

  processAI: async (message: string, context: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ message, context })
    });
    
    if (!res.ok) throw new Error(`Erro na IA: ${res.status} ${res.statusText}`);
    return res.json();
  }
};
