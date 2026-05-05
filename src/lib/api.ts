import { supabase } from '../integrations/supabase/client';

export const api = {
  getMenu: async () => {
    // Agora busca direto do banco de dados seguro
    const { data, error } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('id', 1)
      .single();
      
    if (error || !data) {
      console.warn("Cardápio ainda não configurado no banco de dados.");
      // Retorna um fallback vazio enquanto a tabela não é criada
      return { 
        isOpen: false, isDeliveryOpen: false, prepTime: 40, deliveryFee: 5,
        title: "Atualizando Sistema...", description: "", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [] 
      };
    }
    return data.menu_data;
  },
  
  updateMenu: async (menuData: any) => {
    // Atualiza de forma segura. O Supabase (RLS) vai barrar automaticamente se não for o Admin!
    const { data, error } = await supabase
      .from('store_settings')
      .update({ menu_data: menuData, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
      
    if (error) {
      console.error("Erro do Supabase:", error);
      throw new Error("Não autorizado a alterar o cardápio. Você precisa ser administrador.");
    }
    return data.menu_data;
  },

  getOrders: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return [];
    }
    return data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao atualizar status:", error);
      throw error;
    }
    return data;
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