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
  }
};
