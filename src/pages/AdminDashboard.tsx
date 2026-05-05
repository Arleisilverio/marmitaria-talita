import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { 
  Utensils, Receipt, CheckCircle, Clock, Bike, 
  Plus, Trash2, LogOut, ArrowLeft, Ban, 
  Settings, Image as ImageIcon, Save, Coffee, 
  Beef, X, Smartphone, DollarSign
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
      toast.success("Configurações salvas com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // Funções Auxiliares de Edição
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

  const removeDrink = (id: string) => {
    setMenu({ ...menu, drinks: menu.drinks.filter((d: any) => d.id !== id) });
  };

  const addMeat = () => {
    const name = prompt("Nome da carne?");
    if (name) setMenu({ ...menu, meats: [...(menu.meats || []), name] });
  };

  const removeMeat = (name: string) => {
    setMenu({ ...menu, meats: menu.meats.filter((m: string) => m !== name) });
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-mono text-xs uppercase">Carregando Gestão...</p>
    </div>
  );

  if (isBlocked) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
      <div className="max-w-md bg-zinc-900 p-10 rounded-3xl border border-red-500/30">
        <Ban className="mx-auto text-red-500 w-16 h-16 mb-6"/>
        <h2 className="text-2xl font-bold text-white mb-4">Acesso Suspenso</h2>
        <p className="text-zinc-500">Sua conta está inativa ou suspensa. Entre em contato com o suporte do sistema.</p>
        <button onClick={() => navigate('/')} className="mt-8 text-zinc-400 underline">Voltar ao Início</button>
      </div>
    </div>
  );

  const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), new Date()));

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* HEADER ADM */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/s/${storeSlug}`)} className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg uppercase tracking-tight leading-none">{menu.title}</h1>
            <span className="text-[10px] text-primary font-mono font-bold uppercase">Painel de Controle</span>
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
              "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              menu.isOpen ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}
          >
            {menu.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="bg-white/5 p-2 rounded-full text-zinc-500 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'orders' ? "bg-zinc-800 text-primary shadow-lg" : "text-zinc-500")}>
            <Receipt className="w-4 h-4" /> Pedidos ({todayOrders.length})
          </button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'menu' ? "bg-zinc-800 text-primary shadow-lg" : "text-zinc-500")}>
            <Utensils className="w-4 h-4" /> Cardápio
          </button>
          <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-zinc-800 text-primary shadow-lg" : "text-zinc-500")}>
            <Settings className="w-4 h-4" /> Loja
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ABA PEDIDOS */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todayOrders.length === 0 ? (
                <div className="col-span-full py-20 text-center text-zinc-600 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                  <Receipt className="mx-auto w-12 h-12 mb-4 opacity-20" />
                  <p>Nenhum pedido recebido hoje.</p>
                </div>
              ) : (
                todayOrders.map(order => (
                  <div key={order.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{format(new Date(order.created_at), "HH:mm '•' dd/MM")}</p>
                        <h3 className="text-white font-bold text-lg leading-tight">{order.customer_name}</h3>
                        <p className="text-xs text-zinc-400">{order.customer_phone}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        order.status === 'pendente' ? "bg-orange-500/10 text-orange-500" :
                        order.status === 'confirmado' ? "bg-blue-500/10 text-blue-400" :
                        "bg-green-500/10 text-green-500"
                      )}>{order.status}</span>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 mb-6 space-y-2 flex-grow border border-white/5">
                      {order.items_json?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300"><b className="text-primary mr-2">{item.quantity}x</b> {item.name} {item.size && `(${item.size})`}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-mono">
                        <span>{order.payment_method}</span>
                        <span className="text-white font-bold text-lg">{formatBRL(order.total_amount)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {order.status === 'pendente' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'confirmado')} className="col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-colors">Confirmar Pedido</button>
                        )}
                        {order.status === 'confirmado' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'entregue')} className="col-span-2 bg-orange-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-2">
                            <Bike className="w-4 h-4"/> Saiu para Entrega
                          </button>
                        )}
                        {order.status === 'entregue' && (
                          <button disabled className="col-span-2 bg-green-500/10 text-green-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-green-500/20">Pedido Finalizado</button>
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
              <div className="flex justify-between items-center">
                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Utensils className="text-primary"/> Gerenciar Cardápio</h2>
                <button onClick={handleSaveMenu} disabled={saving} className="bg-primary px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/30 active:scale-95 transition-all">
                  {saving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* PREÇOS */}
                <div className="glass-card p-6 rounded-3xl space-y-6">
                  <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-4 h-4"/> Preços das Marmitas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['p', 'm', 'g'].map(size => (
                      <div key={size}>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Tamanho {size.toUpperCase()}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">R$</span>
                          <input 
                            type="text" 
                            value={menu.prices[size]} 
                            onChange={e => updatePrice(size as any, e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pl-8 text-white outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARNES */}
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Beef className="w-4 h-4"/> Opções de Carnes</h3>
                    <button onClick={addMeat} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"><Plus/></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {menu.meats?.map((meat: string) => (
                      <span key={meat} className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 group">
                        {meat}
                        <X onClick={() => removeMeat(meat)} className="w-3 h-3 cursor-pointer text-zinc-600 group-hover:text-red-500"/>
                      </span>
                    ))}
                  </div>
                </div>

                {/* BEBIDAS */}
                <div className="glass-card p-6 rounded-3xl space-y-4 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Coffee className="w-4 h-4"/> Bebidas e Extras</h3>
                    <button onClick={addDrink} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4"/> Adicionar Item</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {menu.drinks?.map((drink: any) => (
                      <div key={drink.id} className="bg-black/30 border border-white/5 p-4 rounded-2xl flex justify-between items-center group">
                        <div>
                          <p className="text-white font-bold text-sm">{drink.name}</p>
                          <p className="text-primary text-xs font-bold">{formatBRL(drink.price)}</p>
                        </div>
                        <button onClick={() => removeDrink(drink.id)} className="text-zinc-700 group-hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA CONFIGURAÇÕES */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl space-y-6">
              <div className="glass-card p-8 rounded-3xl space-y-8">
                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Settings className="text-primary"/> Configurações da Loja</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2 block">Nome da Marmitaria</label>
                    <input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2 block">Slogan / Descrição</label>
                    <input type="text" value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2 block">Taxa de Entrega (R$)</label>
                      <input type="text" value={menu.deliveryFee} onChange={e => setMenu({...menu, deliveryFee: e.target.value.replace(',', '.')})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2 block">Tempo de Preparo (min)</label>
                      <input type="number" value={menu.prepTime} onChange={e => setMenu({...menu, prepTime: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <button onClick={handleSaveMenu} disabled={saving} className="w-full bg-primary py-4 rounded-xl font-heading font-black text-white shadow-xl shadow-primary/20">
                    {saving ? 'SALVANDO...' : 'ATUALIZAR DADOS DA LOJA'}
                  </button>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <h4 className="text-red-500 font-bold">Encerrar Sessão</h4>
                  <p className="text-zinc-500 text-xs">Sair do painel administrativo com segurança.</p>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest">SAIR</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}