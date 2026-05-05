import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { 
  Utensils, Receipt, CheckCircle, Clock, Bike, 
  Plus, Trash2, LogOut, ArrowLeft, Ban, 
  Settings, Save, Coffee, Beef, X, DollarSign,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAccess();
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Pedido ${newStatus}!`);
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      await api.updateMenu(storeSlug, menu);
      toast.success("Cardápio salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const updatePrice = (size: 'p' | 'm' | 'g', value: string) => {
    setMenu({ ...menu, prices: { ...menu.prices, [size]: value.replace(',', '.') } });
  };

  const addDrink = () => {
    const name = prompt("Nome da bebida?");
    const price = prompt("Preço?");
    if (name && price) {
      const newDrink = { id: Date.now().toString(), name, price: price.replace(',', '.') };
      setMenu({ ...menu, drinks: [...(menu.drinks || []), newDrink] });
    }
  };

  const addMeat = () => {
    const name = prompt("Nome da carne?");
    if (name) setMenu({ ...menu, meats: [...(menu.meats || []), name] });
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Sincronizando Loja...</p>
    </div>
  );

  if (isBlocked) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
      <div className="max-w-md bg-zinc-900 p-10 rounded-3xl border border-red-500/30 shadow-2xl">
        <Ban className="mx-auto text-red-500 w-16 h-16 mb-6"/>
        <h2 className="text-2xl font-bold text-white mb-4">Acesso Suspenso</h2>
        <p className="text-zinc-500">Sua conta de lojista está inativa. Fale com o suporte.</p>
        <button onClick={() => navigate('/')} className="mt-8 text-zinc-400 underline">Voltar</button>
      </div>
    </div>
  );

  const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), new Date()));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER PREMIUM */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/s/${storeSlug}`)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight uppercase">{menu.title}</h1>
            <div className="flex items-center gap-2">
               <span className="text-[10px] text-primary font-black uppercase tracking-widest">Painel Admin</span>
               <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
               <span className="text-[10px] text-zinc-500 font-mono uppercase">v2.0 Multi-Loja</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const updated = { ...menu, isOpen: !menu.isOpen };
              setMenu(updated);
              api.updateMenu(storeSlug, updated);
              toast.success(updated.isOpen ? "Loja Aberta!" : "Loja Fechada!");
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {menu.isOpen ? 'LOJA ABERTA' : 'FECHADA'}
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'orders' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Receipt className="w-4 h-4" /> Pedidos ({todayOrders.length})
          </button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'menu' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Utensils className="w-4 h-4" /> Cardápio
          </button>
          <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Settings className="w-4 h-4" /> Configs
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ABA PEDIDOS */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todayOrders.length === 0 ? (
                <div className="col-span-full py-24 text-center text-zinc-600 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                  <Receipt className="mx-auto w-12 h-12 mb-4 opacity-20" />
                  <p className="font-heading font-bold">Nenhum pedido hoje.</p>
                  <p className="text-xs">Os pedidos aparecerão aqui assim que chegarem.</p>
                </div>
              ) : (
                todayOrders.map(order => (
                  <div key={order.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{format(new Date(order.created_at), "HH:mm")}</p>
                        <h3 className="text-white font-bold text-lg leading-tight">{order.customer_name}</h3>
                        <p className="text-xs text-zinc-400">{order.customer_phone}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        order.status === 'pendente' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                        order.status === 'confirmado' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-green-500/10 text-green-500 border border-green-500/20"
                      )}>{order.status}</span>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 mb-6 space-y-2 flex-grow border border-white/5">
                      {order.items_json?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300">
                            <b className="text-primary mr-2">{item.quantity}x</b> 
                            {/* FIX: Check if name is object or string */}
                            {typeof item.name === 'object' ? item.name.name : item.name} 
                            {item.size && <span className="text-zinc-600 text-xs ml-1">({item.size})</span>}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-mono">
                        <span className="bg-white/5 px-2 py-0.5 rounded">{order.payment_method}</span>
                        <span className="text-white font-bold text-lg">{formatBRL(order.total_amount)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {order.status === 'pendente' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'confirmado')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20">Confirmar Recebimento</button>
                        )}
                        {order.status === 'confirmado' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'entregue')} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20">
                            <Bike className="w-4 h-4"/> Saiu para Entrega
                          </button>
                        )}
                        {order.status === 'entregue' && (
                          <div className="w-full bg-green-500/10 text-green-500 py-4 rounded-xl font-bold text-xs uppercase text-center border border-green-500/20">Pedido Concluído ✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ABA CARDÁPIO */}
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Utensils className="text-primary"/> Gerenciar Cardápio</h2>
                <button onClick={handleSaveMenu} disabled={saving} className="w-full md:w-auto bg-primary px-10 py-4 rounded-xl font-heading font-black text-white shadow-xl shadow-primary/20 active:scale-95 transition-all">
                  {saving ? 'SALVANDO...' : 'SALVAR TODAS AS ALTERAÇÕES'}
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* PREÇOS */}
                <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
                  <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary"/> Preços das Marmitas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['p', 'm', 'g'].map(size => (
                      <div key={size}>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Tamanho {size.toUpperCase()}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">R$</span>
                          <input 
                            type="text" 
                            value={menu.prices[size]} 
                            onChange={e => updatePrice(size as any, e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-4 pl-8 text-white outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARNES */}
                <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Beef className="w-4 h-4 text-primary"/> Carnes do Dia</h3>
                    <button onClick={addMeat} className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"><Plus/></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {menu.meats?.map((meat: any, idx: number) => {
                      // FIX: Handle object or string
                      const meatName = typeof meat === 'object' ? meat.name : meat;
                      return (
                        <span key={idx} className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 border border-white/5 group">
                          {meatName}
                          <button onClick={() => setMenu({ ...menu, meats: menu.meats.filter((_:any, i:number) => i !== idx) })} className="text-zinc-600 group-hover:text-red-500">
                            <X className="w-3 h-3"/>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* BEBIDAS */}
                <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Coffee className="w-4 h-4 text-primary"/> Bebidas e Extras</h3>
                    <button onClick={addDrink} className="bg-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-primary/20 flex items-center gap-2"><Plus className="w-4 h-4"/> Novo Item</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {menu.drinks?.map((drink: any) => (
                      <div key={drink.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-primary/20 transition-colors">
                        <div>
                          <p className="text-white font-bold text-sm">{drink.name}</p>
                          <p className="text-primary text-xs font-bold">{formatBRL(drink.price)}</p>
                        </div>
                        <button onClick={() => setMenu({ ...menu, drinks: menu.drinks.filter((d: any) => d.id !== drink.id) })} className="text-zinc-700 group-hover:text-red-500">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA CONFIGURAÇÕES */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto space-y-6">
              <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/5 shadow-2xl">
                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Settings className="text-primary"/> Configurações Gerais</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Nome Público da Loja</label>
                    <input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Slogan / Frase de Impacto</label>
                    <input type="text" value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Taxa de Entrega (R$)</label>
                    <input type="text" value={menu.deliveryFee} onChange={e => setMenu({...menu, deliveryFee: e.target.value.replace(',', '.')})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Tempo de Preparo (Min)</label>
                    <input type="number" value={menu.prepTime} onChange={e => setMenu({...menu, prepTime: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                   <button onClick={handleSaveMenu} disabled={saving} className="flex-grow bg-primary py-4 rounded-xl font-heading font-black text-white shadow-xl shadow-primary/20 active:scale-95 transition-all">
                    {saving ? 'PROCESSANDO...' : 'SALVAR CONFIGURAÇÕES'}
                   </button>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <h4 className="text-red-500 font-bold text-sm">Segurança da Conta</h4>
                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-tighter">Sair do painel administrativo imediatamente.</p>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20">LOGOUT</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}