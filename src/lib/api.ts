import { supabase } from '../integrations/supabase/client';

export const api = {
  // Busca o cardápio de uma loja específica
  getMenu: async (slug: string) => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('store_slug', slug)
      .maybeSingle();
      
    if (error || !data) {
      return { 
        isOpen: false, hasDelivery: false, prepTime: 40, deliveryFee: 5,
        title: "Nova Loja", description: "Configure seu cardápio no painel admin.", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [], slides: []
      };
    }
    return data.menu_data;
  },
  
  updateMenu: async (slug: string, menuData: any) => {
    const { data, error } = await supabase
      .from('store_settings')
      .upsert(
        { 
          store_slug: slug.toLowerCase().trim(), 
          menu_data: menuData, 
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'store_slug' }
      )
      .select()
      .maybeSingle();
      
    if (error) {
      console.error("Supabase update error:", error);
      if (error.code === '42501') {
        throw new Error("Erro de permissão (RLS): Você não tem autorização para alterar as configurações desta loja.");
      }
      throw new Error(error.message || "Erro ao salvar configurações da loja.");
    }
    return data?.menu_data || menuData;
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
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // ---- FUNÇÕES DO SAAS (SUPER ADMIN) ---- //
  checkAdminAccess: async (email: string) => {
    if (!email) return null;
    const { data } = await supabase
      .from('app_admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
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
    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const cleanEmail = email.toLowerCase().trim();

    // 1. Adiciona na tabela de admins
    const { error: adminError } = await supabase
      .from('app_admins')
      .insert({ 
        email: cleanEmail, 
        store_name: storeName, 
        slug: cleanSlug,
        status: 'active' // Garante que comece ativo
      });
      
    if (adminError) {
      console.error("AddAdmin error:", adminError);
      throw new Error("Erro ao cadastrar lojista. E-mail ou Slug já podem estar em uso.");
    }

    // 2. Inicializa as configurações da loja para evitar erro de RLS no primeiro save
    // Usamos um objeto básico para o cardápio inicial
    const initialMenu = {
      isOpen: false,
      hasDelivery: false,
      prepTime: 40,
      deliveryFee: 5,
      title: storeName,
      description: "Bem-vindo à nossa loja! Cardápio em breve.",
      image: "",
      prices: { p: "0", m: "0", g: "0" },
      meats: [],
      drinks: [],
      slides: []
    };

    const { error: settingsError } = await supabase
      .from('store_settings')
      .insert({
        store_slug: cleanSlug,
        menu_data: initialMenu
      });

    if (settingsError) {
      console.error("Settings init error:", settingsError);
      // Não lançamos erro aqui para não travar o cadastro, 
      // mas o ideal é que o RLS do Super Admin permita isso.
    }
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

  // Busca todas as lojas ativas para a vitrine
  getAllStores: async () => {
    const { data, error } = await supabase
      .from('store_settings')
      .select(`
        store_slug,
        menu_data
      `);
      
    if (error) return [];
    
    // Filtra apenas as que têm dados básicos de menu
    return data.map(item => ({
      slug: item.store_slug,
      title: item.menu_data?.title || "Nova Loja",
      description: item.menu_data?.description || "",
      image: item.menu_data?.image || "",
      isOpen: item.menu_data?.isOpen || false
    }));
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
