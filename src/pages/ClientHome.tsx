import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useMenu } from '../lib/hooks';
import { formatBRL, cn } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { 
  ShoppingBag, Star, Clock, MapPin, 
  ChevronRight, Utensils, Coffee, Beef,
  Info, Sparkles, MessageSquare, Menu,
  User, Receipt, LogIn
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AIChat from '../components/AIChat';
import OrdersView from '../components/OrdersView';
import ProfileView from '../components/ProfileView';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientHome() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const storeSlug = slug || 'marmitaria-talita';
  const { addItem, items, total } = useCart();
  
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: menu, isLoading: loading } = useMenu(storeSlug);

  useEffect(() => {
    checkAuth();
  }, [storeSlug]);

  useEffect(() => {
    if (menu?.meats?.length > 0 && !selectedMeat) {
      const firstMeat = typeof menu.meats[0] === 'object' ? menu.meats[0].name : menu.meats[0];
      setSelectedMeat(firstMeat);
    }
  }, [menu, selectedMeat]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const handleAddToCart = (size: 'p' | 'm' | 'g', price: string) => {
    if (!selectedMeat) return toast.error("Selecione uma carne primeiro!");
    addItem({
      id: `marmita-${size}-${Date.now()}`,
      name: `Marmitex ${size.toUpperCase()}`,
      price: Number(price),
      quantity: 1,
      size: size.toUpperCase(),
      meat: selectedMeat
    });
    toast.success("Adicionado ao carrinho!");
  };

  const handleAddDrink = (drink: any) => {
    addItem({
      id: drink.id,
      name: drink.name,
      price: Number(drink.price),
      quantity: 1
    });
    toast.success(`${drink.name} adicionado!`);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Carregando Sabores...</p>
    </div>
  );

  if (!menu) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
      <div>
        <h2 className="text-white font-black text-2xl mb-4">RESTAURANTE NÃO ENCONTRADO</h2>
        <p className="text-zinc-500 mb-8">O link que você acessou parece estar incorreto.</p>
        <button onClick={() => navigate('/')} className="bg-primary px-8 py-4 rounded-2xl text-white font-bold">Voltar ao Início</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER PREMIUM */}
      <header className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=1000" 
          className="w-full h-full object-cover scale-110 blur-[2px] opacity-40" 
          alt="Capa"
        />
        
        <div className="absolute bottom-0 left-0 w-full p-6 z-20">
          <div className="max-w-4xl mx-auto flex items-end justify-between gap-6">
            <div className="flex-grow">
               <div className="flex items-center gap-2 mb-3">
                 <span className={cn(
                   "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                   menu.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
                 )}>
                   {menu.isOpen ? 'Aberto Agora' : 'Fechado'}
                 </span>
                 <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                   <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                   <span className="text-white text-[10px] font-black">4.9 (120+)</span>
                 </div>
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-white leading-none uppercase tracking-tighter mb-2">{menu.title}</h1>
               <p className="text-zinc-400 text-sm max-w-xl font-medium leading-relaxed">{menu.description}</p>
            </div>
            {!isLoggedIn && (
              <button onClick={() => navigate('/login')} className="bg-white text-black p-4 rounded-2xl shadow-xl hover:scale-105 transition-all">
                <LogIn className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* INFO BAR */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 bg-zinc-900/50 p-2 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center py-4 gap-1 border-r border-white/5">
             <Clock className="w-4 h-4 text-primary" />
             <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Entrega</span>
             <span className="text-white text-xs font-bold">{menu.prepTime || '40-60'} min</span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 gap-1 border-r border-white/5">
             <MapPin className="w-4 h-4 text-primary" />
             <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Taxa</span>
             <span className="text-white text-xs font-bold">{formatBRL(menu.deliveryFee || 0)}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 gap-1">
             <Info className="w-4 h-4 text-primary" />
             <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Pedido</span>
             <span className="text-white text-xs font-bold">Mín. R$ 15</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-6 space-y-12">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* SELEÇÃO DE CARNES */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <Beef className="w-4 h-4 text-primary" /> Escolha sua Proteína
                  </h3>
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Obrigatório</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {menu.meats?.map((meat: any, idx: number) => {
                    // FIX: Handle object or string
                    const meatName = typeof meat === 'object' ? meat.name : meat;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setSelectedMeat(meatName)}
                        className={cn(
                          "px-4 py-5 rounded-2xl border text-xs font-bold transition-all text-center uppercase tracking-tight",
                          selectedMeat === meatName 
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-95" 
                            : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        {meatName}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* TAMANHOS */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" /> Tamanhos Disponíveis
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'p', label: 'Marmita P', desc: 'Ideal para uma pessoa (350g)', price: menu.prices.p },
                    { id: 'm', label: 'Marmita M', desc: 'Tamanho padrão (500g)', price: menu.prices.m },
                    { id: 'g', label: 'Marmita G', desc: 'Para quem tem fome (750g)', price: menu.prices.g },
                  ].map(item => (
                    <div key={item.id} className="bg-zinc-900/40 rounded-[32px] p-8 border border-white/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                      <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                        <Utensils className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="text-white font-black text-lg uppercase tracking-tight mb-2">{item.label}</h4>
                      <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-6">{item.desc}</p>
                      <div className="text-2xl font-black text-white mb-8 font-mono">{formatBRL(item.price)}</div>
                      <button 
                        onClick={() => handleAddToCart(item.id as any, item.price)}
                        className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-primary hover:text-white"
                      >
                        Selecionar <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* BEBIDAS */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-primary" /> Bebidas e Gelados
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menu.drinks?.map((drink: any) => (
                    <div key={drink.id} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:bg-zinc-900 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/5">
                          <Coffee className="w-6 h-6 text-zinc-700" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm uppercase">{drink.name}</p>
                          <p className="text-primary font-mono text-sm font-black">{formatBRL(drink.price)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddDrink(drink)}
                        className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-primary hover:text-white transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'orders' && <OrdersView key="orders" />}
          {activeTab === 'profile' && <ProfileView key="profile" />}
        </AnimatePresence>
      </main>

      {/* NAVIGATION BAR - MOBILE STYLE */}
      <nav className="fixed bottom-0 left-0 w-full p-4 z-50">
        <div className="max-w-xl mx-auto bg-black/80 backdrop-blur-2xl rounded-[32px] border border-white/10 p-2 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-1 p-1">
            <button 
              onClick={() => setActiveTab('menu')}
              className={cn(
                "w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'menu' ? "bg-primary text-white" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">Cardápio</span>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'orders' ? "bg-primary text-white" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              <Receipt className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">Pedidos</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'profile' ? "bg-primary text-white" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              <User className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">Perfil</span>
            </button>
          </div>

          <button 
            onClick={() => navigate('/checkout')}
            disabled={items.length === 0}
            className={cn(
              "flex-grow ml-4 mr-1 h-14 rounded-2xl flex items-center justify-between px-6 font-black text-[10px] uppercase tracking-widest transition-all",
              items.length > 0 ? "bg-white text-black active:scale-95" : "bg-zinc-900 text-zinc-700 opacity-50 cursor-not-allowed"
            )}
          >
            <span>Finalizar Compra</span>
            <div className="flex items-center gap-3">
               <span className="text-zinc-400 font-mono">|</span>
               <span>{formatBRL(total)}</span>
            </div>
          </button>
        </div>
      </nav>

      {/* AI CHAT FLOATING */}
      <AIChat storeSlug={storeSlug} menuData={menu} />
    </div>
  );
}
