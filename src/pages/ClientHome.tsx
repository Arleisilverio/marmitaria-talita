"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { useMenu } from '../lib/hooks';
import { Utensils, Receipt, User, ShoppingCart, Plus, Leaf, ShieldAlert, ArrowLeft, ArrowRight, ShieldOff, Beef, Coffee, Pizza, Flame, Star, Package, Send, X, Copy } from 'lucide-react';
import OrdersView from '../components/OrdersView';
import ProfileView from '../components/ProfileView';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };
const itemVariants = { hidden: { opacity: 0, y: 20, filter: 'blur(10px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 100, damping: 15 } } };

const AVAILABLE_ICONS = { Utensils, Beef, Coffee, Pizza, Flame, Leaf, Star, Package };
type IconKey = keyof typeof AVAILABLE_ICONS;

// BOT GLOBAL DA PLATAFORMA (Deve ser criado no BotFather por você, SuperAdmin)
const GLOBAL_BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'PracaDaQuebradaBot';

export default function ClientHome() {
  const { slug } = useParams();
  const { addItem, total, items, setStoreSlug } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (slug) setStoreSlug(slug);
  }, [slug]);
  
  const { data: menu, isLoading: loading } = useMenu(slug || '');
  const [selectedSize, setSelectedSize] = useState<'p' | 'm' | 'g'>('m');
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [isStoreAdmin, setIsStoreAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramPayload, setTelegramPayload] = useState('');

  useEffect(() => { 
    if (location.state?.tab) setActiveTab(location.state.tab); 
  }, [location]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user?.email) {
        setCheckingProfile(false);
        return;
      }
      setCurrentUser(user);

      let isAdmin = false;
      let isSuper = false;

      if (user.email === 'arleisilverio41@gmail.com') {
        isAdmin = true;
        isSuper = true;
        setIsStoreAdmin(true);
        setIsSuperAdmin(true);
      } else {
        const adminData = await api.checkAdminAccess(user.email);
        if (adminData) {
          isAdmin = true;
          setIsStoreAdmin(true);
        }
      }
      
      const profile = await api.getProfile(user.id);
      const complete = !!(profile?.full_name && profile?.phone && profile?.address);
      setIsProfileComplete(complete);
      setCheckingProfile(false);
      
      if (isSuper) return;

      if (!complete) {
        const msg = isAdmin 
          ? "Bem-vindo! Recomendamos completar seu perfil para garantir a melhor experiência."
          : "Lembre-se de completar seu cadastro para poder fazer pedidos.";
        toast.error(msg, { id: 'profile-warning', duration: 6000 });
      }
    });
  }, []);

  const refreshProfileStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await api.getProfile(user.id);
      const complete = !!(profile?.full_name && profile?.phone && profile?.address);
      setIsProfileComplete(complete);
      
      if (complete) {
        if (isStoreAdmin) {
          toast.success("Perfil completo! Seu painel administrativo agora está liberado.", { duration: 5000 });
        } else {
          toast.success("Perfil completo! Agora você pode fazer pedidos.");
        }
        setActiveTab('menu');
      }
    }
  };

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

  if (menu.storeBlocked) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-white">
      <div className="max-w-md w-full bg-zinc-900/80 border border-red-500/20 rounded-3xl p-10 text-center backdrop-blur-xl">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="font-heading text-2xl font-black text-white mb-3 tracking-tight">Loja Temporariamente Fechada</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">Esta loja está indisponível no momento.<br />Por favor, tente novamente mais tarde.</p>
        <button onClick={() => navigate('/')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"><ArrowLeft size={16} /> Ver Outras Lojas</button>
      </div>
    </div>
  );

  const activeSlides = menu.slides?.length > 0 ? menu.slides : [{ id: 'default', image: menu.image, title: menu.title, description: 'Sabor que você merece' }];

  // Filtra itens para só mostrar o que está DISPONÍVEL
  const availableMeats = menu.meats?.filter((m: any) => m.is_available !== false) || [];
  const availableDrinks = menu.drinks?.filter((d: any) => d.is_available !== false) || [];

  const handleAddDish = () => {
    if (!menu.isOpen) return toast.error("Loja fechada no momento!");
    addItem({ id: `marmita_diaria`, name: menu.title, size: selectedSize.toUpperCase() as any, price: menu.prices[selectedSize], quantity: 1, type: 'dish' });
    toast.success("Adicionado ao carrinho!");
  };

  const handleAddComplement = (meat: any) => {
    if (!menu.isOpen) return toast.error("Loja fechada no momento!");
    addItem({ id: meat.id, name: meat.name, price: meat.price || 0, quantity: 1, type: 'complement' });
    toast.success(`${meat.name} adicionado!`);
  };

  const handleAddDrink = (drink: any) => {
    if (!menu.isOpen) return toast.error("Loja fechada!");
    addItem({ id: drink.id, name: drink.name, price: drink.price, quantity: 1, type: 'drink' });
    toast.success(`${drink.name} adicionado!`);
  };

  const handleTelegramOrder = () => {
    if (!currentUser) {
      toast.error("Você precisa estar logado para falar com a IA.");
      navigate('/login');
      return;
    }
    if (!isProfileComplete) {
      toast.error("Complete seu perfil com nome, telefone e endereço para a IA poder tirar seu pedido!");
      setActiveTab('profile');
      return;
    }

    // Passa o slug da loja e o ID do usuário para o bot Global!
    const payload = `${slug}__${currentUser.id}`;
    setTelegramPayload(payload);
    setShowTelegramModal(true);
  };

  const MeatsIcon = AVAILABLE_ICONS[(menu.sectionMeatsIcon as IconKey)] || AVAILABLE_ICONS.Beef;
  const DrinksIcon = AVAILABLE_ICONS[(menu.sectionDrinksIcon as IconKey)] || AVAILABLE_ICONS.Coffee;

  return (
    <div className="min-h-screen pb-32 md:pb-12 bg-background">
      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 sticky top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"><ArrowLeft size={20} /></button>
            <div className="flex items-center gap-2">
              <Leaf className="text-secondary w-6 h-6 hidden md:block" />
              <h1 className="font-heading text-xl font-black text-white uppercase tracking-tighter truncate max-w-[150px] md:max-w-none">{menu.title}</h1>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('menu')} className={cn("text-xs font-bold uppercase transition-opacity", activeTab === 'menu' ? "text-primary" : "text-zinc-500")}>Cardápio</button>
            <button onClick={() => setActiveTab('orders')} className={cn("text-xs font-bold uppercase transition-opacity", activeTab === 'orders' ? "text-primary" : "text-zinc-500")}>Pedidos</button>
            <button onClick={() => setActiveTab('profile')} className={cn("text-xs font-bold uppercase", activeTab === 'profile' ? "text-primary" : "text-zinc-500")}>Perfil</button>
            {isStoreAdmin && (
              <button onClick={() => navigate(isSuperAdmin ? '/super-admin' : '/admin')} className="text-xs font-bold uppercase text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1"><ShieldAlert size={14}/> Painel</button>
            )}
          </nav>
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border shrink-0", menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
            {menu.isOpen ? 'ABERTO' : 'FECHADO'}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div key="menu-tab" variants={containerVariants} initial="hidden" animate="show">
              
              <section className="px-container mt-6">
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTelegramOrder}
                  className="w-full bg-[#2AABEE]/10 border border-[#2AABEE]/30 p-5 rounded-3xl flex items-center justify-between shadow-[0_0_30px_rgba(42,171,238,0.15)] group transition-all hover:bg-[#2AABEE]/20"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-[#2AABEE] flex items-center justify-center shadow-lg"><Send className="w-6 h-6 text-white ml-[-2px] mt-[2px]" /></div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight flex items-center gap-2">Pedir com {menu.aiName || 'o Garçom IA'}</h3>
                      <p className="text-[#2AABEE] text-xs font-medium">Faça seu pedido direto pelo Telegram de forma rápida!</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#2AABEE] opacity-50 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </section>

              <section className="px-container mt-6">
                <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl">
                   <AnimatePresence mode="wait">
                     <motion.div key={currentSlide} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                       <img className="w-full h-full object-cover opacity-60" src={activeSlides[currentSlide].image} alt="Destaque" />
                       <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                       <div className="absolute bottom-12 left-6 md:left-10 max-w-lg pr-6">
                          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">{activeSlides[currentSlide].title}</h2>
                          <p className="text-primary font-mono text-sm md:text-lg">{activeSlides[currentSlide].description}</p>
                       </div>
                     </motion.div>
                   </AnimatePresence>
                    {activeSlides.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {activeSlides.map((_: any, idx: number) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={cn("w-2 h-2 rounded-full transition-all duration-300", idx === currentSlide ? "w-6 bg-primary" : "bg-white/30 hover:bg-white/50")} />)}
                      </div>
                    )}
                </div>
              </section>

              <section className="px-container mt-12 grid md:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="glass-card rounded-3xl overflow-hidden relative shadow-2xl border border-white/5">
                  <img className="w-full h-full min-h-[300px] object-cover" src={menu.image} alt={menu.title} />
                  <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-wider backdrop-blur-md">Destaque</div>
                </motion.div>
                <motion.div variants={itemVariants} className="flex flex-col justify-center">
                  <h3 className="font-heading text-4xl font-bold text-white mb-4">{menu.title}</h3>
                  <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{menu.description}</p>
                  <div className="mb-8">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-3 tracking-widest">Escolha o Tamanho</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {(['p', 'm', 'g'] as const).map(size => (
                        <button key={size} onClick={() => setSelectedSize(size)} className={cn("py-4 px-6 rounded-2xl font-bold border whitespace-nowrap transition-all", selectedSize === size ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800")}>{size.toUpperCase()} • {formatBRL(menu.prices[size])}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleAddDish} disabled={!menu.isOpen} className={cn("w-full py-5 rounded-2xl font-heading font-black text-lg shadow-xl transition-transform active:scale-95", menu.isOpen ? "bg-primary text-white hover:brightness-110" : "bg-zinc-800 text-zinc-600 cursor-not-allowed")}>ADICIONAR AO PEDIDO</button>
                </motion.div>
              </section>

              {availableMeats.length > 0 && (
                <section className="px-container mt-16">
                  <h4 className="font-heading text-2xl font-bold text-white mb-6 flex items-center gap-3"><MeatsIcon className="text-primary w-7 h-7" />{menu.sectionMeatsTitle || 'Adicionais'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableMeats.map((meat: any) => (
                      <div key={meat.id} className="bg-zinc-900/50 p-5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-primary/30 transition-colors group">
                        <div>
                          <p className="font-bold text-white group-hover:text-primary transition-colors">{meat.name}</p>
                          {meat.price > 0 ? <p className="text-secondary font-bold text-sm">+ {formatBRL(meat.price)}</p> : <p className="text-zinc-500 text-xs font-mono">Sem custo</p>}
                        </div>
                        <button onClick={() => handleAddComplement(meat)} disabled={!menu.isOpen} className="w-12 h-12 rounded-xl bg-white/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90 shrink-0"><Plus /></button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {availableDrinks.length > 0 && (
                <section className="px-container mt-16 pb-20">
                  <h4 className="font-heading text-2xl font-bold text-white mb-6 flex items-center gap-3"><DrinksIcon className="text-primary w-7 h-7" />{menu.sectionDrinksTitle || 'Bebidas e Extras'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDrinks.map((drink: any) => (
                      <div key={drink.id} className="bg-zinc-900/50 p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:border-primary/30 transition-colors group">
                        <div className="flex items-center gap-4">
                          {drink.image ? <img src={drink.image} alt={drink.name} className="w-14 h-14 rounded-xl object-cover shadow-lg" /> : <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center"><DrinksIcon className="w-6 h-6 text-zinc-600" /></div>}
                          <div><p className="font-bold text-white group-hover:text-primary transition-colors">{drink.name}</p><p className="text-secondary font-bold text-sm">{formatBRL(drink.price)}</p></div>
                        </div>
                        <button onClick={() => handleAddDrink(drink)} disabled={!menu.isOpen} className="w-10 h-10 rounded-xl bg-white/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90 shrink-0"><Plus /></button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && <div className="mt-6"><OrdersView /></div>}
          {activeTab === 'profile' && <div className="mt-6"><ProfileView isMandatory={!isProfileComplete} onSaveSuccess={refreshProfileStatus} /></div>}
        </AnimatePresence>
      </main>

      {items.length > 0 && activeTab === 'menu' && (
        <div className="fixed bottom-24 md:bottom-8 left-0 right-0 px-container z-40 md:flex md:justify-center">
          <button onClick={() => { if (!isProfileComplete && !isSuperAdmin) { setActiveTab('profile'); return toast.error("Por favor, complete seu perfil para prosseguir."); } navigate('/checkout'); }} className="w-full md:max-w-md bg-primary text-white py-4 rounded-2xl font-heading font-black flex justify-between items-center px-8 shadow-2xl shadow-primary/30 hover:scale-105 transition-transform"><span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> CARRINHO ({items.length})</span><span className="text-xl">{formatBRL(total)}</span></button>
        </div>
      )}

      <nav className="md:hidden bg-zinc-950/90 backdrop-blur-xl fixed bottom-0 w-full h-20 border-t border-white/5 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? "text-primary" : "text-zinc-500"}><Utensils className="mx-auto mb-1 w-5 h-5"/><span className="text-[10px] block font-bold tracking-widest uppercase">Cardápio</span></button>
        <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? "text-primary" : "text-zinc-500"}><Receipt className="mx-auto mb-1 w-5 h-5"/><span className="text-[10px] block font-bold tracking-widest uppercase">Pedidos</span></button>
        <button onClick={() => setActiveTab('profile')} className={cn(activeTab === 'profile' ? "text-primary" : "text-zinc-500")}><User className="mx-auto mb-1 w-5 h-5"/><span className="text-[10px] block font-bold tracking-widest uppercase">Perfil</span></button>
      </nav>

      {isStoreAdmin && (
        <motion.button initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} onClick={() => navigate(isSuperAdmin ? '/super-admin' : '/admin')} className="fixed top-24 right-4 z-[60] bg-primary text-white p-3 md:p-4 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 hover:scale-105 active:scale-95 transition-all md:top-8 md:right-8"><ShieldAlert size={20}/><span className="font-bold text-[10px] md:text-xs uppercase tracking-widest hidden sm:block">Voltar ao Painel</span></motion.button>
      )}

      {/* Modal de Segurança do Telegram */}
      <AnimatePresence>
        {showTelegramModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowTelegramModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowTelegramModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white z-10"><X className="w-4 h-4" /></button>
              
              <div className="p-8 text-center pt-10">
                <div className="w-20 h-20 bg-[#2AABEE]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(42,171,238,0.2)] border border-[#2AABEE]/20">
                  <Send className="w-10 h-10 text-[#2AABEE] ml-[-2px] mt-[2px]" />
                </div>
                
                <h3 className="text-white font-bold text-2xl mb-3">Ir para o Telegram</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                  Vamos te redirecionar para o Telegram.<br/>Chegando lá, basta clicar no botão <b className="text-white bg-white/10 px-2 py-0.5 rounded-md">Iniciar</b> (ou Start) e o Garçom IA te atenderá!
                </p>
                
                <button 
                  onClick={() => window.open(`https://t.me/${GLOBAL_BOT_USERNAME}?start=${telegramPayload}`, '_blank')} 
                  className="w-full bg-[#2AABEE] hover:bg-[#2AABEE]/80 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#2AABEE]/20 mb-6 text-lg"
                >
                  <Send className="w-5 h-5" /> Abrir o Telegram
                </button>

                <button 
                  onClick={() => { 
                    navigator.clipboard.writeText(`/start ${telegramPayload}`); 
                    toast.success('Código copiado! Você pode colar lá no robô caso ele não te reconheça.', { duration: 5000 }); 
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors underline decoration-zinc-700 underline-offset-4"
                >
                  O robô não te reconheceu? Clique aqui.
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}