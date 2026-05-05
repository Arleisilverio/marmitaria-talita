import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { 
  Utensils, Receipt, CheckCircle, Clock, Bike, 
  Plus, Trash2, LogOut, ArrowLeft, Ban, 
  Settings, Save, Coffee, Beef, X, DollarSign,
  ChevronRight, AlertCircle, Camera, ImageIcon, Calendar
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useOrders, useMenu, useUpdateOrderStatus, useSaveMenu } from '../lib/hooks';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings' | 'reports'>('orders');
  const [reportDate, setReportDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [menu, setMenu] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modals state
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkPrice, setNewDrinkPrice] = useState('');
  const [showMeatModal, setShowMeatModal] = useState(false);
  const [newMeatName, setNewMeatName] = useState('');

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
      setLoadingAuth(false);
      return;
    }

    const slug = adminData?.slug || 'marmitaria-talita';
    setStoreSlug(slug);
    setLoadingAuth(false);
  };

  const { data: menuData, isLoading: loadingMenu } = useMenu(storeSlug);
  const { data: orders = [], isLoading: loadingOrders } = useOrders(storeSlug);
  const { mutateAsync: updateStatus } = useUpdateOrderStatus(storeSlug);
  const { mutateAsync: saveMenuApi } = useSaveMenu(storeSlug);

  useEffect(() => {
    if (menuData && !menu) {
      setMenu(menuData);
    }
  }, [menuData]);

  const loading = loadingAuth || (!isBlocked && (loadingMenu || loadingOrders));

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ id: orderId, status: newStatus });
      toast.success(`Pedido ${newStatus}!`);
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      await saveMenuApi(menu);
      toast.success("Cardápio salvo com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const updatePrice = (size: 'p' | 'm' | 'g', value: string) => {
    setMenu({ ...menu, prices: { ...menu.prices, [size]: value.replace(',', '.') } });
  };

  const addDrink = () => {
    setShowDrinkModal(true);
  };

  const handleAddDrinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDrinkName && newDrinkPrice) {
      const newDrink = { id: Date.now().toString(), name: newDrinkName, price: newDrinkPrice.replace(',', '.') };
      setMenu({ ...menu, drinks: [...(menu.drinks || []), newDrink] });
      setShowDrinkModal(false);
      setNewDrinkName('');
      setNewDrinkPrice('');
    }
  };

  const addMeat = () => {
    setShowMeatModal(true);
  };

  const handleAddMeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMeatName) {
      setMenu({ ...menu, meats: [...(menu.meats || []), newMeatName] });
      setShowMeatModal(false);
      setNewMeatName('');
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success("Foto principal enviada. Lembre-se de salvar!");
    const reader = new FileReader();
    reader.onloadend = () => setMenu({ ...menu, image: reader.result });
    reader.readAsDataURL(file);
  };

  const addSlide = () => {
    const newSlide = { id: Date.now().toString(), image: '', title: '', description: '' };
    setMenu({ ...menu, slides: [...(menu.slides || []), newSlide] });
  };

  const removeSlide = (id: string) => {
    setMenu({ ...menu, slides: menu.slides.filter((s: any) => s.id !== id) });
  };

  const updateSlide = (id: string, field: string, value: string) => {
    setMenu({ ...menu, slides: menu.slides.map((s: any) => s.id === id ? { ...s, [field]: value } : s) });
  };

  const handleSlideImageUpload = async (id: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success("Foto do slide enviada. Lembre-se de salvar!");
    const reader = new FileReader();
    reader.onloadend = () => updateSlide(id, 'image', reader.result as string);
    reader.readAsDataURL(file);
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
  
  // Reports Logic
  const reportOrders = orders.filter(o => {
    try {
      return isSameDay(new Date(o.created_at), new Date(reportDate + 'T12:00:00'));
    } catch {
      return false;
    }
  });
  const deliveredOrders = reportOrders.filter(o => o.status === 'entregue');
  const totalRevenue = deliveredOrders.reduce((acc, order) => acc + order.total_amount, 0);
  const ticketMedio = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

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
              saveMenuApi(updated);
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
        <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'orders' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Receipt className="w-4 h-4" /> Pedidos ({todayOrders.length})
          </button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'menu' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Utensils className="w-4 h-4" /> Cardápio
          </button>
          <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Settings className="w-4 h-4" /> Configs
          </button>
          <button onClick={() => setActiveTab('reports')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'reports' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Calendar className="w-4 h-4" /> Relatórios
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

              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Carrossel de Destaques (Topo)</h3>
                    <p className="text-zinc-500 text-sm mt-1">Adicione o cardápio da semana ou promoções que ficarão rodando no topo.</p>
                  </div>
                  <button onClick={addSlide} className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> ADICIONAR SLIDE
                  </button>
                </div>

                <div className="space-y-6">
                  {!menu.slides || menu.slides.length === 0 ? <p className="text-zinc-500 text-center py-4">Nenhum slide configurado. A imagem do Prato Principal será mostrada por padrão.</p> : null}
                  
                  {menu.slides?.map((slide: any) => (
                    <div key={slide.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-6">
                      {/* Upload Foto do Slide */}
                      <div className="relative w-full md:w-48 h-32 bg-zinc-800 rounded-xl overflow-hidden group flex-shrink-0 border border-white/5">
                        {slide.image ? <img src={slide.image} alt="Slide" className="w-full h-full object-cover opacity-80" /> : <ImageIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-zinc-600" />}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold gap-1">
                          <Camera className="w-4 h-4" /> Trocar
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSlideImageUpload(slide.id, e)} />
                        </label>
                      </div>

                      {/* Textos do Slide */}
                      <div className="flex-grow space-y-4">
                        <div className="flex justify-between gap-4">
                          <div className="flex-grow">
                            <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Título Principal (Ex: Segunda-Feira)</label>
                            <input type="text" value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-white outline-none focus:border-orange-500 text-sm font-bold" />
                          </div>
                          <button onClick={() => removeSlide(slide.id)} className="text-red-500 hover:bg-red-500/10 p-3 rounded-lg h-fit transition-colors mt-5">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Subtítulo / Prato (Ex: Feijoada Completa)</label>
                          <input type="text" value={slide.description} onChange={e => updateSlide(slide.id, 'description', e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-white outline-none focus:border-orange-500 text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FOTO E DADOS DO PRATO PRINCIPAL DO DIA */}
              <div className="space-y-6 mt-8">
                <h3 className="font-heading text-xl font-bold text-white border-b border-white/10 pb-2">Marmita do Dia (Para Venda Hoje)</h3>
                
                <div className="relative h-64 md:h-80 bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 group flex items-center justify-center">
                  {menu.image ? <img src={menu.image} alt="Menu" className="w-full h-full object-cover opacity-60" /> : <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-zinc-700" />}
                  <div className="absolute bottom-6 left-0 w-full flex justify-center">
                    <label className="bg-white/90 hover:bg-white backdrop-blur-md text-black px-6 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 cursor-pointer shadow-xl transition-colors">
                      <Camera className="w-4 h-4 md:w-5 md:h-5" /> ALTERAR FOTO DO PRATO
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <div><label className="text-zinc-500 text-xs md:text-sm font-mono uppercase mb-2 block">Nome do Prato (Hoje)</label><input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 md:p-5 rounded-xl text-white outline-none focus:border-orange-500 text-lg md:text-xl" /></div>
                  <div><label className="text-zinc-500 text-xs md:text-sm font-mono uppercase mb-2 block">Descrição Completa</label><textarea value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 md:p-5 rounded-xl text-white outline-none resize-none focus:border-orange-500 text-base md:text-lg" rows={3} /></div>
                </div>
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
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Delivery via Motoboy</label>
                    <button 
                      onClick={() => setMenu({...menu, hasDelivery: !menu.hasDelivery})} 
                      className={cn(
                        "w-full p-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all border",
                        menu.hasDelivery ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {menu.hasDelivery ? 'ATIVADO' : 'DESATIVADO'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Taxa de Entrega (R$)</label>
                    <input type="text" value={menu.deliveryFee} onChange={e => setMenu({...menu, deliveryFee: e.target.value.replace(',', '.')})} disabled={!menu.hasDelivery} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary disabled:opacity-50"/>
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

          {/* ABA CONTABILIDADE / RELATÓRIOS */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 font-bold uppercase">Escolha a data do relatório</p>
                    <input 
                      type="date" 
                      value={reportDate} 
                      onChange={(e) => setReportDate(e.target.value)}
                      className="bg-transparent text-xl font-heading font-bold text-white outline-none mt-1 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Faturamento Dia</p>
                  <p className="text-3xl font-heading font-black text-green-400">{formatBRL(totalRevenue)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Ticket Médio</p>
                  <p className="text-3xl font-heading font-black text-white">{formatBRL(ticketMedio)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Marmitas Entregues</p>
                  <p className="text-3xl font-heading font-black text-white">{deliveredOrders.length}</p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden mt-8 shadow-xl">
                <div className="p-4 border-b border-white/5 bg-zinc-950 flex justify-between items-center">
                  <h3 className="font-bold text-white font-heading">Histórico Detalhado</h3>
                  <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2 py-1 rounded">{reportDate ? format(parseISO(reportDate), 'dd/MM/yyyy') : '-'}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {reportOrders.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                      <Receipt className="w-8 h-8 mx-auto mb-3 opacity-20"/>
                      <p>Nenhum registro encontrado para esta data.</p>
                    </div>
                  ) : (
                    reportOrders.map(order => (
                      <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-bold text-white">{order.customer_name}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-1">
                            {format(new Date(order.created_at), "HH:mm")} • {order.payment_method?.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-primary text-lg">{formatBRL(order.total_amount)}</p>
                          <p className={`text-[10px] uppercase font-bold mt-1 inline-block px-2 py-0.5 rounded ${order.status === 'entregue' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {order.status}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL DE BEBIDA */}
      <AnimatePresence>
        {showDrinkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><Coffee className="w-5 h-5 text-primary"/> Nova Bebida/Extra</h3>
                <button onClick={() => setShowDrinkModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddDrinkSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Nome do Item</label>
                  <input autoFocus type="text" value={newDrinkName} onChange={e => setNewDrinkName(e.target.value)} placeholder="Ex: Coca-Cola 2L" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Preço (R$)</label>
                  <input type="text" value={newDrinkPrice} onChange={e => setNewDrinkPrice(e.target.value)} placeholder="Ex: 12.00" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary" required />
                </div>
                <button type="submit" className="w-full bg-primary py-4 rounded-xl font-black text-white uppercase text-sm shadow-lg shadow-primary/20 mt-2">Adicionar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CARNE */}
      <AnimatePresence>
        {showMeatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><Beef className="w-5 h-5 text-primary"/> Nova Opção de Carne</h3>
                <button onClick={() => setShowMeatModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddMeatSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Nome da Carne</label>
                  <input autoFocus type="text" value={newMeatName} onChange={e => setNewMeatName(e.target.value)} placeholder="Ex: Bife a Cavalo" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary" required />
                </div>
                <button type="submit" className="w-full bg-primary py-4 rounded-xl font-black text-white uppercase text-sm shadow-lg shadow-primary/20 mt-2">Adicionar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}