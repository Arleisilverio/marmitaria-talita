import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import {
  Utensils,
  Receipt,
  User,
  ShoppingCart,
  Plus,
  Leaf,
  Send,
  ArrowLeft
} from 'lucide-react';
import AIChat from '../components/AIChat';
import OrdersView from '../components/OrdersView';
import ProfileView from '../components/ProfileView';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function ClientHome() {
  const navigate = useNavigate();
  const { addItem, total, items } = useCart();
  const [menu, setMenu] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<'p' | 'm' | 'g'>('m');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');

  useEffect(() => {
    api.getMenu().then(data => {
      setMenu(data);
      setLoading(false);
    });
  }, []);

  if (loading || !menu) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-4"></div>
        <p className="text-secondary font-mono animate-pulse uppercase tracking-widest text-xs">Preparando cardápio artesanal...</p>
      </div>
    );
  }

  const handleAddDish = () => {
    addItem({
      id: 'dish_day',
      name: menu.title,
      size: selectedSize.toUpperCase() as any,
      price: menu.prices[selectedSize],
      quantity: 1,
      type: 'dish'
    });
    toast.success(`${menu.title} (${selectedSize.toUpperCase()}) adicionado!`, {
      icon: '🍲',
      style: {
        borderRadius: '12px',
        background: '#1b1f18',
        color: '#f2f4f0',
        border: '1px solid rgba(138, 154, 91, 0.2)'
      },
    });
  };

  const handleAddDrink = (drink: any) => {
    addItem({
      id: drink.id,
      name: drink.name,
      price: drink.price,
      quantity: 1,
      type: 'drink'
    });
    toast.success(`${drink.name} adicionado!`, {
      icon: '🍹',
      style: {
        borderRadius: '12px',
        background: '#1b1f18',
        color: '#f2f4f0',
        border: '1px solid rgba(138, 154, 91, 0.2)'
      },
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-xl docked full-width top-0 sticky z-50 border-b border-white/5 flex justify-between items-center px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          {activeTab !== 'menu' ? (
            <button onClick={() => setActiveTab('menu')} className="text-secondary hover:text-white transition-colors p-1 -ml-1">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <Leaf className="text-secondary w-6 h-6" />
          )}
          <h1 className="font-heading text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary">
            {activeTab === 'menu' ? 'MARMITARIA TALITA' : activeTab === 'orders' ? 'MEUS PEDIDOS' : 'MEU PERFIL'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://t.me/Marmitaria_talita_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 transition-colors p-1"
            title="Falar com o Bot no Telegram"
          >
            <Send className="w-5 h-5 rotate-[-45deg] translate-y-[-1px]" />
          </a>
          <div className="status-badge-glow bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono text-[10px] text-secondary font-bold tracking-widest">ABERTO</span>
          </div>
        </div>
      </header>

      <main className="min-h-[80vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Hero Section / Promo */}
              <motion.section variants={itemVariants} className="px-container mt-4">
                <div className="relative h-56 w-full rounded-2xl overflow-hidden glass-card shadow-2xl">
                  <motion.img 
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5 }}
                    alt="Especial" 
                    className="w-full h-full object-cover opacity-60" 
                    src={menu.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">Recomendado</span>
                    <h2 className="font-heading text-3xl font-bold text-white mb-1 tracking-tight">Especial de Hoje</h2>
                    <p className="text-secondary font-mono text-sm">{menu.title}</p>
                  </div>
                </div>
              </motion.section>

              {/* Cardápio Section */}
              <section className="px-container mt-8">
                <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                  <h3 className="font-heading text-2xl font-bold text-on-surface">Cardápio do Dia</h3>
                </motion.div>

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
                    <div className="mb-8">
                      <p className="font-mono text-secondary/60 mb-3 text-[10px] font-bold uppercase tracking-widest">Carnes do Dia</p>
                      <div className="flex flex-wrap gap-2">
                        {menu.meats.filter((m:any) => m.available).map((meat: any) => (
                          <span key={meat.id} className="text-[11px] bg-secondary/10 border border-secondary/10 px-3 py-1.5 rounded-lg text-secondary font-medium">{meat.name}</span>
                        ))}
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleAddDish} className="w-full bg-primary text-on-primary font-heading font-black text-lg py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all">
                      <ShoppingCart className="w-5 h-5" /> ADICIONAR AO PEDIDO
                    </motion.button>
                  </div>
                </motion.div>
              </section>

              {/* Beverages */}
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
                      <motion.button whileHover={{ scale: 1.1, backgroundColor: 'var(--color-primary)' }} whileTap={{ scale: 0.9 }} onClick={() => handleAddDrink(drink)} className="w-12 h-12 rounded-xl bg-surface-container border border-white/10 text-primary flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <OrdersView />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Assistant */}
      <AIChat menuContext={menu} />

      {/* Sticky Checkout Button (Só aparece na aba de menu) */}
      <AnimatePresence>
        {items.length > 0 && activeTab === 'menu' && (
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

      {/* Bottom Nav */}
      <nav className="bg-surface/90 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-3xl border-t border-white/5 shadow-2xl flex justify-around items-center h-20 pb-safe">
        <button 
          onClick={() => setActiveTab('menu')}
          className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'menu' ? "text-primary" : "text-on-surface-variant/40")}
        >
          <Utensils className="w-6 h-6 mb-1" />
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest">Cardápio</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'orders' ? "text-primary" : "text-on-surface-variant/40")}
        >
          <Receipt className="w-6 h-6 mb-1" />
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest">Pedidos</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn("flex flex-col items-center justify-center transition-all", activeTab === 'profile' ? "text-primary" : "text-on-surface-variant/40")}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
}