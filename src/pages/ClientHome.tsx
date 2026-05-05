"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { useMenu } from '../lib/hooks';
import { Utensils, Receipt, User, ShoppingCart, Plus, Leaf, ShieldAlert } from 'lucide-react';
import AIChat from '../components/AIChat';
import OrdersView from '../components/OrdersView';
import ProfileView from '../components/ProfileView';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };
const itemVariants = { hidden: { opacity: 0, y: 20, filter: 'blur(10px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function ClientHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, total, items } = useCart();
  
  const SLUG_FIXO = 'marmitaria-talita';
  const { data: menu, isLoading: loading } = useMenu(SLUG_FIXO);
  const [selectedSize, setSelectedSize] = useState<'p' | 'm' | 'g'>('m');
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [isStoreAdmin, setIsStoreAdmin] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => { 
    if (location.state?.tab) setActiveTab(location.state.tab); 
  }, [location]);

  useEffect(() => {
    // Verifica se é admin
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user?.email === 'arleisilverio41@gmail.com') {
        setIsStoreAdmin(true);
      }
    });
  }, []);

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
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Preparando Marmitaria...</p>
    </div>
  );

  const activeSlides = menu.slides?.length > 0 
    ? menu.slides 
    : [{ id: 'default', image: menu.image, title: menu.title, description: 'Sabor caseiro todos os dias' }];

  const handleAddDish = () => {
    if (!menu.isOpen) return toast.error("Loja fechada no momento!");
    addItem({ 
      id: `marmita_diaria`, 
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
    <div className="min-h-screen pb-32 md:pb-12 bg-background">
      {/* HEADER */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 sticky top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="text-secondary w-6 h-6" />
            <h1 className="font-heading text-xl font-black text-white uppercase tracking-tighter">
              {menu.title}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('menu')} className={cn("text-xs font-bold uppercase", activeTab === 'menu' ? "text-primary" : "text-zinc-500")}>Cardápio</button>
            <button onClick={() => setActiveTab('orders')} className={cn("text-xs font-bold uppercase", activeTab === 'orders' ? "text-primary" : "text-zinc-500")}>Pedidos</button>
            <button onClick={() => setActiveTab('profile')} className={cn("text-xs font-bold uppercase", activeTab === 'profile' ? "text-primary" : "text-zinc-500")}>Perfil</button>
            {isStoreAdmin && (
              <button onClick={() => navigate('/admin')} className="text-xs font-bold uppercase text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldAlert size={14}/> ADMIN
              </button>
            )}
          </nav>

          <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
            {menu.isOpen ? 'ABERTO' : 'FECHADO'}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div key="menu-tab" variants={containerVariants} initial="hidden" animate="show">
              
              {/* CARROSSEL */}
              <section className="px-container mt-6">
                <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5">
                   <AnimatePresence mode="wait">
                     <motion.div key={currentSlide} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                       <img className="w-full h-full object-cover opacity-60" src={activeSlides[currentSlide].image} alt="Destaque" />
                       <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                       <div className="absolute bottom-12 left-10 max-w-lg">
                          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">{activeSlides[currentSlide].title}</h2>
                          <p className="text-secondary font-mono text-sm md:text-lg">{activeSlides[currentSlide].description}</p>
                       </div>
                     </motion.div>
                   </AnimatePresence>

                    {/* Navegação do Carrossel (Dots) */}
                    {activeSlides.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {activeSlides.map((_: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300",
                              idx === currentSlide ? "w-6 bg-orange-500" : "bg-white/30 hover:bg-white/50"
                            )}
                          />
                        ))}
                      </div>
                    )}
                </div>
              </section>

              {/* PRATO PRINCIPAL */}
              <section className="px-container mt-12 grid md:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="glass-card rounded-3xl overflow-hidden relative">
                  <img className="w-full h-full min-h-[300px] object-cover" src={menu.image} alt={menu.title} />
                  <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-wider">
                    Para Hoje
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex flex-col justify-center">
                  <h3 className="font-heading text-4xl font-bold text-white mb-4">{menu.title}</h3>
                  <p className="text-on-surface-variant text-lg mb-8">{menu.description}</p>
                  
                  <div className="mb-8">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Tamanho</p>
                    <div className="flex gap-3">
                      {(['p', 'm', 'g'] as const).map(size => (
                        <button key={size} onClick={() => setSelectedSize(size)} className={cn("py-3 px-6 rounded-2xl font-bold border", selectedSize === size ? "bg-primary text-white border-primary" : "bg-zinc-900 text-zinc-500 border-white/5")}>
                          {size.toUpperCase()} • {formatBRL(menu.prices[size])}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button onClick={handleAddDish} disabled={!menu.isOpen} className={cn("w-full py-5 rounded-2xl font-heading font-black text-lg shadow-xl", menu.isOpen ? "bg-primary text-white" : "bg-zinc-800 text-zinc-600")}>
                    ADICIONAR AO PEDIDO
                  </button>
                </motion.div>
              </section>

              {/* BEBIDAS */}
              <section className="px-container mt-16 pb-20">
                <h4 className="font-heading text-2xl font-bold text-white mb-6">Bebidas e Extras</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menu.drinks?.map((drink: any) => (
                    <div key={drink.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5">
                      <div>
                        <p className="font-bold text-white">{drink.name}</p>
                        <p className="text-secondary font-bold text-sm">{formatBRL(drink.price)}</p>
                      </div>
                      <button onClick={() => handleAddDrink(drink)} disabled={!menu.isOpen} className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center">
                        <Plus />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'orders' && <div className="mt-6"><OrdersView /></div>}
          {activeTab === 'profile' && <div className="mt-6"><ProfileView /></div>}
        </AnimatePresence>
      </main>

      {/* CARRINHO FLUTUANTE */}
      {items.length > 0 && activeTab === 'menu' && (
        <div className="fixed bottom-24 md:bottom-8 left-0 right-0 px-container z-40 md:flex md:justify-center">
          <button onClick={() => navigate('/checkout')} className="w-full md:max-w-md bg-primary text-white py-4 rounded-2xl font-heading font-black flex justify-between items-center px-8 shadow-2xl">
            <span>CARRINHO ({items.length})</span>
            <span className="text-xl">{formatBRL(total)}</span>
          </button>
        </div>
      )}

      {/* BARRA MOBILE */}
      <nav className="md:hidden bg-zinc-950 fixed bottom-0 w-full h-20 border-t border-white/5 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('menu')} className={cn(activeTab === 'menu' ? "text-primary" : "text-zinc-500")}>
          <Utensils/><span className="text-[10px] block font-bold">Cardápio</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={cn(activeTab === 'orders' ? "text-primary" : "text-zinc-500")}>
          <Receipt/><span className="text-[10px] block font-bold">Pedidos</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn(activeTab === 'profile' ? "text-primary" : "text-zinc-500")}>
          <User/><span className="text-[10px] block font-bold">Perfil</span>
        </button>
      </nav>

      <AIChat menuContext={menu} />
    </div>
  );
}