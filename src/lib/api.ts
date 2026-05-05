import { supabase } from '../integrations/supabase/client';

const API_BASE = '/api';

export const api = {
  getMenu: async () => {
    const res = await fetch(`${API_BASE}/menu`);
    return res.json();
  },
  updateMenu: async (data: any) => {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getOrders: async () => {
    // Agora busca PERMANENTEMENTE do banco de dados Supabase
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
    // Atualiza permanentemente no banco de dados
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