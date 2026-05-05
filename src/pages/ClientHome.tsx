import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { Utensils, Receipt, User, ShoppingCart, Plus, Leaf, ArrowLeft, ShieldAlert, Store, Crown } from 'lucide-react';
import AIChat from '../components/AIChat';
import OrdersView from '../components/OrdersView';
import ProfileView from '../components/ProfileView';

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
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isStoreAdmin, setIsStoreAdmin] = useState(false);
  
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => { if (location.state?.tab) setActiveTab(location.state.tab); }, [location]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user?.email === 'arleisilverio41@gmail.com') {
        setIsSuperAdmin(true);
        setIsStoreAdmin(true);
      } else if (data.user?.email) {
        try {
          const access = await api.checkAdminAccess(data.user.email);
          if (access && access.status === 'active') setIsStoreAdmin(true);
        } catch(e) {}
      }
    });
    const fetchMenu = () => api.getMenu().then(data => { setMenu(data); setLoading(false); });
    fetchMenu();
    const interval = setInterval(fetchMenu, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const slideCount = menu?.slides?.length || 0;
    if (slideCount <= 1 || activeTab !== 'menu') return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [menu?.slides, activeTab]);

  if (loading || !menu) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  const activeSlides = menu.slides && menu.slides.length > 0 
    ? menu.slides 
    : [{ id: 'default', image: menu.image, title: 'Especial de Hoje', description: menu.title }];

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
    <div className="min-h-screen pb-32 md:pb-12 bg-background selection:bg-primary/20">
      <header className="bg-surface/80 backdrop-blur-xl docked full-width top-0 sticky z-50 border-b border-white/5 px-4 md:px-8 py-3 w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {activeTab !== 'menu' && (
              <button onClick={() => setActiveTab('menu')} className="text-secondary hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5">
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <Leaf className={`text-secondary w-6 h-6 ${activeTab !== 'menu' ? 'hidden sm:block' : ''}`} />
            <h1 className="font-heading text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary hidden sm:block">
              MARMITARIA TALITA
            </h1>
            <h1 className="font-heading text-lg font-black text-white sm:hidden block ml-1">
              {activeTab === 'orders' ? 'MEUS PEDIDOS' : activeTab === 'profile' ? 'MEU PERFIL' : 'MARMITARIA'}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('menu')} className={cn("text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary", activeTab === 'menu' ? "text-primary" : "text-zinc-500")}>Cardápio</button>
            <button onClick={() => setActiveTab('orders')} className={cn("text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary", activeTab === 'orders' ? "text-primary" : "text-zinc-500")}>Pedidos</button>
            <button onClick={() => setActiveTab('profile')} className={cn("text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary", activeTab === 'profile' ? "text-primary" : "text-zinc-500")}>Perfil</button>
            
            {isSuperAdmin ? (
              <button onClick={() => navigate('/super-admin')} className="text-sm font-bold uppercase tracking-widest text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"><Crown className="w-4 h-4"/> Painel SaaS</button>
            ) : isStoreAdmin ? (
              <button onClick={() => navigate('/admin')} className="text-sm font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Painel Loja</button>
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            {menu.isOpen ? (
              <div className="status-badge-glow bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-2 border border-secondary/20">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-mono text-[10px] text-secondary font-bold tracking-widest hidden sm:inline">ABERTO</span>
              </div>
            ) : (
              <div className="status-badge-glow bg-red-500/10 px-3 py-1 rounded-full flex items-center gap-2 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="font-mono text-[10px] text-red-500 font-bold tracking-widest hidden sm:inline">FECHADO</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[80vh] max-w-6xl mx-auto w-full">
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
                  <div className="relative h-56 md:h-80 w-full rounded-2xl md:rounded-3xl overflow-hidden glass-card shadow-2xl bg-zinc-900 border border-white/5">
                    <AnimatePresence mode="wait">
                      <motion.div key={currentSlide} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                        <img alt={activeSlides[currentSlide].title} className="w-full h-full object-cover opacity-60" src={activeSlides[currentSlide].image} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                        <div className="absolute bottom-8 left-6 md:bottom-12 md:left-10 max-w-lg">
                          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">{activeSlides[currentSlide].title}</h2>
                          <p className="text-secondary font-mono text-sm md:text-lg">{activeSlides[currentSlide].description}</p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    {activeSlides.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                        {activeSlides.map((_: any, idx: number) => (
                          <button key={idx} onClick={() => setCurrentSlide(idx)} className={cn("w-2 h-2 rounded-full transition-all duration-300", idx === currentSlide ? "w-6 bg-orange-500" : "bg-white/30 hover:bg-white/50")} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.section>

                <section className="px-container mt-8">
                  <motion.div variants={itemVariants} className="glass-card rounded-2xl md:rounded-3xl overflow-hidden mb-4 shadow-xl border border-white/5 md:grid md:grid-cols-2">
                    <div className="relative h-64 md:h-full min-h-[300px]">
                      <img alt="Main Dish" className="absolute inset-0 w-full h-full object-cover" src={menu.image} />
                      <div className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-xl border-white/10 shadow-lg">
                        <span className="text-tertiary font-heading font-bold text-xl">{formatBRL(menu.prices.p)}</span>
                      </div>
                      <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-wider">Para Hoje</div>
                    </div>
                    <div className="p-6 md:p-10 flex flex-col justify-center">
                      <h4 className="font-heading text-2xl md:text-4xl font-bold text-white mb-4">{menu.title}</h4>
                      <p className="text-on-surface-variant text-sm md:text-base mb-8 leading-relaxed">{menu.description}</p>
                      
                      <div className="mb-8">
                        <p className="font-mono text-secondary/60 mb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest">Escolha o tamanho</p>
                        <div className="flex flex-wrap gap-3">
                          {(['p', 'm', 'g'] as const).map(size => (
                            <button key={size} onClick={() => setSelectedSize(size)} className={cn("font-mono text-xs md:text-sm py-2.5 px-5 md:px-6 rounded-xl transition-all", selectedSize === size ? "bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 scale-105" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-white/5")}>
                              {size.toUpperCase()} ({formatBRL(menu.prices[size])})
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleAddDish} disabled={!menu.isOpen} className={cn("w-full font-heading font-black text-lg py-4 md:py-5 rounded-xl flex items-center justify-center gap-3 transition-all", menu.isOpen ? "bg-primary text-on-primary shadow-xl shadow-primary/20" : "bg-zinc-800 text-zinc-500")}>
                        <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" /> {menu.isOpen ? 'ADICIONAR AO PEDIDO' : 'LOJA FECHADA'}
                      </motion.button>
                    </div>
                  </motion.div>
                </section>

                <section className="px-container mt-12">
                  <motion.h3 variants={itemVariants} className="font-heading text-2xl md:text-3xl font-bold text-on-surface mb-6">Bebidas & Extras</motion.h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menu.drinks.map((drink: any) => (
                      <motion.div variants={itemVariants} key={drink.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-surface-container flex items-center justify-center text-2xl md:text-3xl">🍹</div>
                          <div>
                            <p className="font-sans font-bold text-on-surface text-base md:text-lg">{drink.name}</p>
                            <p className="text-secondary font-heading font-bold text-sm md:text-base">{formatBRL(drink.price)}</p>
                          </div>
                        </div>
                        <button onClick={() => handleAddDrink(drink)} disabled={!menu.isOpen} className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-surface-container border border-white/10 text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:text-zinc-600 disabled:hover:scale-100">
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
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-24 md:bottom-8 left-0 right-0 px-container z-40 md:flex md:justify-center">
            <button onClick={() => navigate('/checkout')} className="w-full md:max-w-md bg-primary text-on-primary py-4 md:py-5 rounded-2xl md:rounded-full font-heading text-lg font-black flex justify-between items-center px-8 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className="bg-on-primary/20 p-2 rounded-full"><ShoppingCart className="w-6 h-6" /></div>
                <span>CARRINHO ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              </div>
              <span className="font-heading text-xl">{formatBRL(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="md:hidden bg-surface/90 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-3xl border-t border-white/5 shadow-2xl flex justify-around items-center h-20 pb-safe">
        <button onClick={() => setActiveTab('menu')} className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'menu' ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/50")}><Utensils className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Cardápio</span></button>
        <button onClick={() => setActiveTab('orders')} className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'orders' ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/50")}><Receipt className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Pedidos</span></button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'profile' ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/50")}><User className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Perfil</span></button>
        
        {isSuperAdmin ? (
          <button onClick={() => navigate('/super-admin')} className="flex flex-col items-center justify-center transition-all text-on-surface-variant/40 hover:text-yellow-500"><Crown className="w-6 h-6 mb-1 text-yellow-500" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest text-yellow-500">SaaS</span></button>
        ) : isStoreAdmin ? (
          <button onClick={() => navigate('/admin')} className="flex flex-col items-center justify-center transition-all text-on-surface-variant/40 hover:text-orange-500"><ShieldAlert className="w-6 h-6 mb-1 text-orange-500/80" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest text-orange-500/80">Painel</span></button>
        ) : null}
      </nav>
    </div>
  );
}