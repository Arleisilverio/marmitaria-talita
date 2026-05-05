"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  const { slug } = useParams();
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

  useEffect(() => { 
    if (location.state?.tab) setActiveTab(location.state.tab); 
  }, [location]);

  useEffect(() => {
    if (!slug) return;
    
    // Verifica permissões de Admin
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user?.email === 'arleisilverio41@gmail.com') {
        setIsSuperAdmin(true);
        setIsStoreAdmin(true);
      } else if (data.user?.email) {
        try {
          const access = await api.checkAdminAccess(data.user.email);
          if (access && access.slug === slug && access.status === 'active') setIsStoreAdmin(true);
        } catch(e) {}
      }
    });

    // Busca o cardápio da loja
    api.getMenu(slug).then(data => {
      setMenu(data);
      setLoading(false);
    });
  }, [slug]);

  // Timer do Carrossel
  useEffect(() => {
    const slideCount = menu?.slides?.length || 0;
    if (slideCount <= 1 || activeTab !== 'menu') return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideCount), 5000);
    return () => clearInterval(timer);
  }, [menu?.slides, activeTab]);

  if (loading || !menu) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-white">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Carregando Loja...</p>
    </div>
  );

  const activeSlides = menu.slides?.length > 0 
    ? menu.slides 
    : [{ id: 'default', image: menu.image, title: menu.title, description: 'Sabor de verdade todos os dias' }];

  const handleAddDish = () => {
    if (!menu.isOpen) return toast.error("Loja fechada no momento!");
    addItem({ 
      id: `${slug}_dish`, 
      name: menu.title, 
      size: selectedSize.toUpperCase() as any, 
      price: menu.prices[selectedSize], 
      quantity: 1, 
      type: 'dish' 
    });
    toast.success("Adicionado ao carrinho!");
  };

  const handleAddDrink = (drink: any) => {
    if (!menu.isOpen) return toast.error("Loja fechada!");
    addItem({ 
      id: drink.id, 
      name: drink.name, 
      price: drink.price, 
      quantity: 1, 
      type: 'drink' 
    });
    toast.success(`${drink.name} adicionado!`);
  };

  return (
    <div className="min-h-screen pb-32 md:pb-12 bg-background selection:bg-primary/30">
      {/* HEADER FIXO */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 sticky top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="text-secondary w-6 h-6" />
            <h1 className="font-heading text-xl font-black text-white uppercase tracking-tighter">
              {menu.title || 'Marmitaria'}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('menu')} className={cn("text-xs font-bold uppercase tracking-widest", activeTab === 'menu' ? "text-primary" : "text-zinc-500 hover:text-white transition-colors")}>Cardápio</button>
            <button onClick={() => setActiveTab('orders')} className={cn("text-xs font-bold uppercase tracking-widest", activeTab === 'orders' ? "text-primary" : "text-zinc-500 hover:text-white transition-colors")}>Meus Pedidos</button>
            <button onClick={() => setActiveTab('profile')} className={cn("text-xs font-bold uppercase tracking-widest", activeTab === 'profile' ? "text-primary" : "text-zinc-500 hover:text-white transition-colors")}>Perfil</button>
            
            {isSuperAdmin ? (
              <button onClick={() => navigate('/super-admin')} className="text-xs font-bold uppercase text-yellow-500 flex items-center gap-1 border border-yellow-500/20 px-3 py-1 rounded-full"><Crown className="w-3 h-3"/> SaaS MASTER</button>
            ) : isStoreAdmin ? (
              <button onClick={() => navigate('/admin')} className="text-xs font-bold uppercase text-orange-500 flex items-center gap-1 border border-orange-500/20 px-3 py-1 rounded-full"><ShieldAlert className="w-3 h-3"/> PAINEL ADMIN</button>
            ) : null}
          </nav>

          <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2", menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", menu.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500")}></div>
            {menu.isOpen ? 'ABERTO' : 'FECHADO'}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div key="menu-tab" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: -20 }}>
              
              {/* CARROSSEL */}
              <section className="px-container mt-6">
                <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl">
                   <AnimatePresence mode="wait">
                     <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                       <img className="w-full h-full object-cover opacity-60" src={activeSlides[currentSlide].image} alt="Destaque" />
                       <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                       <div className="absolute bottom-10 left-8 max-w-lg">
                          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2 leading-none">{activeSlides[currentSlide].title}</h2>
                          <p className="text-secondary font-mono text-sm md:text-lg">{activeSlides[currentSlide].description}</p>
                       </div>
                     </motion.div>
                   </AnimatePresence>
                </div>
              </section>

              {/* PRATO PRINCIPAL */}
              <section className="px-container mt-12 grid md:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="glass-card rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                  <img className="w-full h-full min-h-[300px] object-cover" src={menu.image} alt={menu.title} />
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex flex-col justify-center">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Especialidade do Dia</span>
                  <h3 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{menu.title}</h3>
                  <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">{menu.description}</p>
                  
                  <div className="mb-8">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Escolha o Tamanho</p>
                    <div className="flex flex-wrap gap-3">
                      {(['p', 'm', 'g'] as const).map(size => (
                        <button 
                          key={size} 
                          onClick={() => setSelectedSize(size)} 
                          className={cn(
                            "py-3 px-6 rounded-2xl font-bold transition-all border", 
                            selectedSize === size 
                              ? "bg-primary text-white border-primary shadow-lg scale-105" 
                              : "bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20"
                          )}
                        >
                          {size.toUpperCase()} • {formatBRL(menu.prices[size])}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleAddDish} 
                    disabled={!menu.isOpen} 
                    className={cn(
                      "w-full py-5 rounded-2xl font-heading font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3",
                      menu.isOpen ? "bg-primary text-white shadow-primary/20" : "bg-zinc-800 text-zinc-600 grayscale"
                    )}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {menu.isOpen ? 'ADICIONAR AO PEDIDO' : 'LOJA FECHADA AGORA'}
                  </button>
                </motion.div>
              </section>

              {/* BEBIDAS */}
              <section className="px-container mt-16 pb-20">
                <motion.h4 variants={itemVariants} className="font-heading text-2xl font-bold text-white mb-6">Bebidas e Complementos</motion.h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menu.drinks?.map((drink: any) => (
                    <motion.div key={drink.id} variants={itemVariants} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center text-2xl border border-white/5">🥤</div>
                        <div>
                          <p className="font-bold text-white text-sm md:text-base">{drink.name}</p>
                          <p className="text-secondary font-bold text-sm">{formatBRL(drink.price)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddDrink(drink)} 
                        disabled={!menu.isOpen}
                        className="w-12 h-12 rounded-xl bg-surface-container border border-white/10 text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-30"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'orders' && <div className="mt-6"><OrdersView /></div>}
          {activeTab === 'profile' && <div className="mt-6"><ProfileView /></div>}
        </AnimatePresence>
      </main>

      {/* BARRA DE CARRINHO FLUTUANTE */}
      <AnimatePresence>
        {items.length > 0 && activeTab === 'menu' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-8 left-0 right-0 px-container z-40 md:flex md:justify-center"
          >
            <button 
              onClick={() => navigate(`/checkout/${slug}`)} 
              className="w-full md:max-w-md bg-primary text-white py-4 md:py-5 rounded-2xl md:rounded-full font-heading text-lg font-black flex justify-between items-center px-8 shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6" />
                <span>CARRINHO ({items.length})</span>
              </div>
              <span className="font-heading text-xl">{formatBRL(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENU MOBILE */}
      <nav className="md:hidden bg-zinc-950/90 backdrop-blur-2xl fixed bottom-0 w-full h-20 border-t border-white/5 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('menu')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'menu' ? "text-primary" : "text-zinc-500")}>
          <Utensils className="w-6 h-6"/>
          <span className="text-[10px] font-bold uppercase">Cardápio</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'orders' ? "text-primary" : "text-zinc-500")}>
          <Receipt className="w-6 h-6"/>
          <span className="text-[10px] font-bold uppercase">Pedidos</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'profile' ? "text-primary" : "text-zinc-500")}>
          <User className="w-6 h-6"/>
          <span className="text-[10px] font-bold uppercase">Perfil</span>
        </button>
        {isStoreAdmin && (
          <button onClick={() => navigate('/admin')} className="flex flex-col items-center gap-1 text-orange-500">
            <ShieldAlert className="w-6 h-6"/>
            <span className="text-[10px] font-bold uppercase">Painel</span>
          </button>
        )}
      </nav>

      <AIChat menuContext={menu} />
    </div>
  );
}