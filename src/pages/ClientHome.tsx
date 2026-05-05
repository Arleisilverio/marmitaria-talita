import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { Utensils, Receipt, User, ShoppingCart, Plus, Leaf, Send, ArrowLeft, ShieldAlert, Store } from 'lucide-react';
import AIChat from '../components/AIChat';
import OrdersView from '../components/OrdersView';
import ProfileView from '../components/ProfileView';

// ... (Animações mantidas)
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };
const itemVariants = { hidden: { opacity: 0, y: 20, filter: 'blur(10px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function ClientHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, total, items } = useCart();
  const [menu, setMenu] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<'p' | 'm' | 'g'>('m');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { if (location.state?.tab) setActiveTab(location.state.tab); }, [location]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === 'arleisilverio41@gmail.com') setIsAdmin(true);
    });
    // Adiciona refresh contínuo pro cliente ver se a loja fechou
    const fetchMenu = () => api.getMenu().then(data => { setMenu(data); setLoading(false); });
    fetchMenu();
    const interval = setInterval(fetchMenu, 15000); // Atualiza a cada 15s
    return () => clearInterval(interval);
  }, []);

  if (loading || !menu) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  const handleAddDish = () => {
    if (!menu.isOpen) return toast.error("Loja fechada no momento!");
    addItem({ id: 'dish_day', name: menu.title, size: selectedSize.toUpperCase() as any, price: menu.prices[selectedSize], quantity: 1, type: 'dish' });
    toast.success(`${menu.title} (${selectedSize.toUpperCase()}) adicionado!`, { style: { background: '#1b1f18', color: '#f2f4f0', border: '1px solid rgba(138, 154, 91, 0.2)' } });
  };

  const handleAddDrink = (drink: any) => {
    if (!menu.isOpen) return toast.error("Loja fechada no momento!");
    addItem({ id: drink.id, name: drink.name, price: drink.price, quantity: 1, type: 'drink' });
    toast.success(`${drink.name} adicionado!`, { style: { background: '#1b1f18', color: '#f2f4f0', border: '1px solid rgba(138, 154, 91, 0.2)' } });
  };

  return (
    <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
      <header className="bg-surface/80 backdrop-blur-xl docked full-width top-0 sticky z-50 border-b border-white/5 flex justify-between items-center px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          {activeTab !== 'menu' ? (
            <button onClick={() => setActiveTab('menu')} className="text-secondary hover:text-white transition-colors p-1 -ml-1"><ArrowLeft className="w-6 h-6" /></button>
          ) : <Leaf className="text-secondary w-6 h-6" />}
          <h1 className="font-heading text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary">
            {activeTab === 'menu' ? 'MARMITARIA TALITA' : activeTab === 'orders' ? 'MEUS PEDIDOS' : 'MEU PERFIL'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {menu.isOpen ? (
            <div className="status-badge-glow bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-2 hidden sm:flex border border-secondary/20">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-[10px] text-secondary font-bold tracking-widest">ABERTO</span>
            </div>
          ) : (
            <div className="status-badge-glow bg-red-500/10 px-3 py-1 rounded-full flex items-center gap-2 hidden sm:flex border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="font-mono text-[10px] text-red-500 font-bold tracking-widest">FECHADO</span>
            </div>
          )}
        </div>
      </header>

      <main className="min-h-[80vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div key="menu" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: -20 }}>
              
              {!menu.isOpen && (
                <div className="px-container mt-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
                    <Store className="w-6 h-6" />
                    <div>
                      <p className="font-bold text-sm">Estamos fechados no momento</p>
                      <p className="text-xs">Não estamos aceitando novos pedidos agora.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className={cn("transition-all duration-1000", !menu.isOpen && "opacity-50 grayscale pointer-events-none")}>
                <motion.section variants={itemVariants} className="px-container mt-4">
                  <div className="relative h-56 w-full rounded-2xl overflow-hidden glass-card shadow-2xl">
                    <motion.img initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }} alt="Especial" className="w-full h-full object-cover opacity-60" src={menu.image} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                      <h2 className="font-heading text-3xl font-bold text-white mb-1 tracking-tight">Especial de Hoje</h2>
                      <p className="text-secondary font-mono text-sm">{menu.title}</p>
                    </div>
                  </div>
                </motion.section>

                <section className="px-container mt-8">
                  <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden mb-4 shadow-xl border border-white/5">
                    <div className="relative h-64">
                      <img alt="Main Dish" className="w-full h-full object-cover" src={menu.image} />
                      <div className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-xl border-white/10">
                        <span className="text-tertiary font-heading font-bold text-xl">{formatBRL(menu.prices.p)}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-heading text-2xl font-bold text-white mb-2">{menu.title}</h4>
                      <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">{menu.description}</p>
                      <div className="mb-8">
                        <p className="font-mono text-secondary/60 mb-3 text-[10px] font-bold uppercase tracking-widest">Escolha o tamanho</p>
                        <div className="flex flex-wrap gap-3">
                          {(['p', 'm', 'g'] as const).map(size => (
                            <button key={size} onClick={() => setSelectedSize(size)} className={cn("font-mono text-xs py-2.5 px-5 rounded-xl transition-all", selectedSize === size ? "bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 scale-105" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-white/5")}>
                              {size.toUpperCase()} ({formatBRL(menu.prices[size])})
                            </button>
                          ))}
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleAddDish} disabled={!menu.isOpen} className={cn("w-full font-heading font-black text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all", menu.isOpen ? "bg-primary text-on-primary shadow-xl shadow-primary/20" : "bg-zinc-800 text-zinc-500")}>
                        <ShoppingCart className="w-5 h-5" /> {menu.isOpen ? 'ADICIONAR AO PEDIDO' : 'LOJA FECHADA'}
                      </motion.button>
                    </div>
                  </motion.div>
                </section>

                <section className="px-container mt-8">
                  <motion.h3 variants={itemVariants} className="font-heading text-2xl font-bold text-on-surface mb-5">Bebidas & Extras</motion.h3>
                  <div className="grid grid-cols-1 gap-3">
                    {menu.drinks.map((drink: any) => (
                      <motion.div variants={itemVariants} key={drink.id} className="glass-card p-3 rounded-2xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-2xl">🍹</div>
                          <div>
                            <p className="font-sans font-bold text-on-surface text-base">{drink.name}</p>
                            <p className="text-secondary font-heading font-bold text-sm">{formatBRL(drink.price)}</p>
                          </div>
                        </div>
                        <button onClick={() => handleAddDrink(drink)} disabled={!menu.isOpen} className="w-12 h-12 rounded-xl bg-surface-container border border-white/10 text-primary flex items-center justify-center disabled:text-zinc-600">
                          <Plus className="w-6 h-6" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><OrdersView /></motion.div>}
          {activeTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><ProfileView /></motion.div>}
        </AnimatePresence>
      </main>

      <AIChat menuContext={menu} />

      <AnimatePresence>
        {items.length > 0 && activeTab === 'menu' && menu.isOpen && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-24 left-0 right-0 px-container z-40">
            <button onClick={() => navigate('/checkout')} className="w-full bg-primary text-on-primary py-4 rounded-2xl font-heading text-lg font-black flex justify-between items-center px-8 shadow-2xl shadow-primary/30 active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className="bg-on-primary/20 p-2 rounded-lg"><ShoppingCart className="w-6 h-6" /></div>
                <span>CARRINHO ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              </div>
              <span className="font-heading">{formatBRL(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="bg-surface/90 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-3xl border-t border-white/5 shadow-2xl flex justify-around items-center h-20 pb-safe">
        <button onClick={() => setActiveTab('menu')} className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'menu' ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/50")}><Utensils className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Cardápio</span></button>
        <button onClick={() => setActiveTab('orders')} className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'orders' ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/50")}><Receipt className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Pedidos</span></button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'profile' ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/50")}><User className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Perfil</span></button>
        {isAdmin && <button onClick={() => navigate('/admin')} className="flex flex-col items-center justify-center transition-all text-on-surface-variant/40 hover:text-orange-500"><ShieldAlert className="w-6 h-6 mb-1 text-orange-500/80" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest text-orange-500/80">Painel</span></button>}
      </nav>
    </div>
  );
}