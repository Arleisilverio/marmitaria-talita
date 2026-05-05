import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { Utensils, Receipt, BarChart3, CheckCircle, Printer, Copy, Camera, Save, Image as ImageIcon, Calendar, User, ShieldAlert, Store, Clock, AlertTriangle, Bike, Plus, Trash2, LogOut, ArrowLeft, Ban } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'reports'>('orders');
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    checkAccess();
    const clockInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const adminData = await api.checkAdminAccess(user.email!);
    if (!adminData && user.email !== 'arleisilverio41@gmail.com') {
      toast.error("Acesso negado.");
      return navigate('/');
    }

    if (adminData?.status === 'blocked') {
      setIsBlocked(true);
      setLoading(false);
      return;
    }

    const slug = adminData?.slug || 'marmitaria-talita'; 
    setStoreSlug(slug);
    
    const [menuData, ordersData] = await Promise.all([
      api.getMenu(slug),
      api.getOrders(slug)
    ]);
    
    setMenu(menuData);
    setOrders(ordersData);
    setLoading(false);
  };

  const handleMenuSave = async () => {
    await api.updateMenu(storeSlug, menu);
    toast.success("Cardápio salvo!");
  };

  if (loading) return <div className="p-20 text-center">Carregando Painel da Loja...</div>;
  if (isBlocked) return <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center"><div className="max-w-md bg-zinc-900 p-10 rounded-3xl border border-red-500/30"><Ban className="mx-auto text-red-500 w-16 h-16 mb-6"/><h2 className="text-2xl font-bold text-white mb-4">Acesso Suspenso</h2><p className="text-zinc-500">Sua assinatura está atrasada ou seu acesso foi removido. Fale com o suporte.</p></div></div>;

  const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), new Date()));

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-zinc-950 p-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate(`/s/${storeSlug}`)} className="text-zinc-500 hover:text-white"><ArrowLeft/></button>
           <h1 className="text-lg font-bold text-white uppercase tracking-widest">{menu.title} | ADMIN</h1>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => { const n = {...menu, isOpen: !menu.isOpen}; setMenu(n); api.updateMenu(storeSlug, n); }} className={cn("px-4 py-1 rounded-full text-xs font-bold", menu.isOpen ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
             {menu.isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}
           </button>
           <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="text-zinc-500"><LogOut/></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-2 rounded-xl font-bold text-sm", activeTab === 'orders' ? "bg-zinc-800 text-primary" : "text-zinc-500")}>Pedidos ({todayOrders.length})</button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-2 rounded-xl font-bold text-sm", activeTab === 'menu' ? "bg-zinc-800 text-primary" : "text-zinc-500")}>Cardápio</button>
        </div>

        {activeTab === 'menu' && (
          <div className="space-y-8 pb-20">
             <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-2xl">
                <div><h3 className="text-white font-bold">Editar Cardápio</h3><p className="text-xs text-zinc-500">Mude fotos, nomes e preços aqui.</p></div>
                <button onClick={handleMenuSave} className="bg-primary px-8 py-3 rounded-xl font-bold text-white">SALVAR ALTERAÇÕES</button>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <label className="text-xs font-bold text-zinc-500 uppercase">Título da Loja</label>
                   <input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-zinc-900 p-4 rounded-xl text-white outline-none border border-white/5 focus:border-primary"/>
                </div>
                <div className="space-y-4">
                   <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                   <input type="text" value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-zinc-900 p-4 rounded-xl text-white outline-none border border-white/5 focus:border-primary"/>
                </div>
             </div>
             <p className="text-zinc-500 italic text-sm text-center">... outas opções de edição simplificadas para este exemplo ...</p>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="grid md:grid-cols-3 gap-6">
            {todayOrders.length === 0 ? (
              <div className="col-span-3 py-20 text-center text-zinc-500">Nenhum pedido hoje.</div>
            ) : todayOrders.map(order => (
              <div key={order.id} className="bg-zinc-900 p-5 rounded-2xl border border-white/5">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-white">{order.customer_name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{order.status}</span>
                </div>
                <div className="text-sm text-zinc-400 space-y-1 mb-4">
                  {order.items_json?.map((i:any, idx:number) => (
                    <p key={idx}>{i.quantity}x {i.name} ({i.size})</p>
                  ))}
                </div>
                <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                   <span className="text-xs text-zinc-500">{order.payment_method}</span>
                   <span className="font-bold text-white">{formatBRL(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}