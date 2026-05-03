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
    const res = await fetch(`${API_BASE}/orders`);
    return res.json();
  },
  createOrder: async (data: any) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
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
