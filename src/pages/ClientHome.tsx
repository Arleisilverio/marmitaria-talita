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

  useEffect(() => { if (location.state?.tab) setActiveTab(location.state.tab); }, [location]);

  useEffect(() => {
    if (!slug) return;
    
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user?.email === 'arleisilverio41@gmail.com') {
        setIsSuperAdmin(true);
        setIsStoreAdmin(true);
      } else if (data.user?.email) {
        const access = await api.checkAdminAccess(data.user.email);
        if (access && access.slug === slug && access.status === 'active') setIsStoreAdmin(true);
      }
    });

    api.getMenu(slug).then(data => {
      setMenu(data);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    const slideCount = menu?.slides?.length || 0;
    if (slideCount <= 1 || activeTab !== 'menu') return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideCount), 5000);
    return () => clearInterval(timer);
  }, [menu?.slides, activeTab]);

  if (loading || !menu) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8"><div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div></div>;

  const activeSlides = menu.slides?.length > 0 ? menu.slides : [{ id: 'default', image: menu.image, title: menu.title, description: menu.description }];

  const handleAddDish = () => {
    if (!menu.isOpen) return toast.error("Loja fechada!");
    addItem({ id: `${slug}_dish`, name: menu.title, size: selectedSize.toUpperCase() as any, price: menu.prices[selectedSize], quantity: 1, type: 'dish' });
    toast.success("Adicionado!");
  };

  return (
    <div className="min-h-screen pb-32 md:pb-12 bg-background">
      <header className="bg-surface/80 backdrop-blur-xl docked full-width top-0 sticky z-50 border-b border-white/5 px-4 md:px-8 py-3 w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="text-secondary w-6 h-6" />
            <h1 className="font-heading text-xl font-black text-white">{menu.title || 'Marmitaria'}</h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('menu')} className={cn("text-sm font-bold uppercase", activeTab === 'menu' ? "text-primary" : "text-zinc-500")}>Cardápio</button>
            <button onClick={() => setActiveTab('orders')} className={cn("text-sm font-bold uppercase", activeTab === 'orders' ? "text-primary" : "text-zinc-500")}>Pedidos</button>
            
            {isSuperAdmin ? (
              <button onClick={() => navigate('/super-admin')} className="text-sm font-bold uppercase text-yellow-500 flex items-center gap-1"><Crown className="w-4 h-4"/> SaaS</button>
            ) : isStoreAdmin ? (
              <button onClick={() => navigate('/admin')} className="text-sm font-bold uppercase text-orange-500 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Painel Admin</button>
            ) : null}
          </nav>

          <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", menu.isOpen ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
            {menu.isOpen ? 'ABERTO' : 'FECHADO'}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <section className="px-container mt-4">
                <div className="relative h-56 md:h-80 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5">
                   <img className="w-full h-full object-cover opacity-60" src={activeSlides[currentSlide].image} />
                   <div className="absolute bottom-8 left-6">
                      <h2 className="font-heading text-3xl md:text-5xl font-bold text-white">{activeSlides[currentSlide].title}</h2>
                      <p className="text-secondary font-mono">{activeSlides[currentSlide].description}</p>
                   </div>
                </div>
              </section>

              <section className="px-container mt-8 grid md:grid-cols-2 gap-6">
                <div className="glass-card rounded-3xl overflow-hidden">
                  <img className="w-full h-64 object-cover" src={menu.image} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-heading text-3xl font-bold text-white mb-4">{menu.title}</h4>
                  <p className="text-on-surface-variant mb-8">{menu.description}</p>
                  <div className="flex gap-3 mb-8">
                    {['p', 'm', 'g'].map(size => (
                      <button key={size} onClick={() => setSelectedSize(size as any)} className={cn("py-2 px-4 rounded-xl", selectedSize === size ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400")}>
                        {size.toUpperCase()} ({formatBRL(menu.prices[size])})
                      </button>
                    ))}
                  </div>
                  <button onClick={handleAddDish} disabled={!menu.isOpen} className="bg-primary py-4 rounded-xl font-bold text-white">ADICIONAR AO PEDIDO</button>
                </div>
              </section>
            </motion.div>
          )}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'profile' && <ProfileView />}
        </AnimatePresence>
      </main>

      {items.length > 0 && (
        <button onClick={() => navigate(`/checkout/${slug}`)} className="fixed bottom-24 md:bottom-8 left-4 right-4 bg-primary p-4 rounded-2xl flex justify-between items-center text-white font-bold shadow-2xl">
          <span>VER CARRINHO</span>
          <span>{formatBRL(total)}</span>
        </button>
      )}

      <nav className="md:hidden bg-surface fixed bottom-0 w-full h-20 border-t border-white/5 flex justify-around items-center">
        <button onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? "text-primary" : "text-zinc-600"}><Utensils/></button>
        <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? "text-primary" : "text-zinc-600"}><Receipt/></button>
        {isStoreAdmin && <button onClick={() => navigate('/admin')} className="text-orange-500"><ShieldAlert/></button>}
      </nav>
      <AIChat menuContext={menu} />
    </div>
  );
}