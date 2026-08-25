import React, { useEffect, useState } from 'react';
// Build version: 1.0.2 - Premium UI & Database Sync
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { Leaf, Store, ArrowRight, Clock, ArrowLeft, LogOut, User, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';

export default function Marketplace() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      toast.success("Você saiu da conta com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao encerrar sessão.");
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await api.getAllStores();
        setStores(data);
      } catch (err: any) {
        console.error("Erro ao carregar lojas:", err);
        setError("Não foi possível carregar as lojas. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-white">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
            borderColor: ['#e2725b', '#f97316', '#e2725b']
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full mb-6"
        />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 animate-pulse">Sincronizando Vitrine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-white">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[32px] text-center max-w-sm backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
          <p className="text-zinc-500 text-sm mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Top Bar com Status de Autenticação e Botão de Logout */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex items-center justify-between pointer-events-none">
        {/* Esquerda: Logo / Identidade */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto flex items-center gap-3 bg-zinc-950/60 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl"
        >
          <img 
            src="/da-quebrada-hero.jpg" 
            alt="Da Quebrada" 
            className="w-8 h-8 rounded-xl object-cover border border-amber-500/30"
          />
          <div className="hidden sm:block">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block leading-tight">Da Quebrada</span>
            <span className="text-[8px] text-zinc-500 font-mono block">Delivery Comunitário</span>
          </div>
        </motion.div>

        {/* Direita: Usuário Logado / Botão de Logout ou Login */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto flex items-center gap-2"
        >
          {currentUser ? (
            <div className="flex items-center gap-2 bg-zinc-950/70 border border-white/10 backdrop-blur-xl p-1.5 pl-3 rounded-2xl shadow-xl">
              <div className="hidden md:flex flex-col text-right mr-1">
                <span className="text-[10px] font-bold text-white leading-tight max-w-[140px] truncate">
                  {currentUser.email}
                </span>
                <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase">● Conectado</span>
              </div>

              {/* Botão Painel Admin (se admin ou lojista) */}
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                title="Painel de Controle"
              >
                Painel
              </button>

              {/* Botão Sair / Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>Entrar / Login</span>
            </button>
          )}
        </motion.div>
      </header>

      {/* Hero Section com a Arte Da Quebrada no Fundo */}
      <div className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden py-24 px-4">
        {/* Background Image com Overlays Artísticos */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transform hover:scale-100 transition-transform duration-1000"
          style={{ backgroundImage: `url('/da-quebrada-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)]" />
        
        <div className="relative z-10 text-center px-4 w-full max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-amber-400 font-mono text-[11px] font-black tracking-[0.3em] uppercase">Delivery & Comércio Local</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-9xl font-heading font-black text-white mb-6 tracking-tighter leading-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
          >
            DA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 italic">QUEBRADA</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-300 max-w-xl mx-auto mb-10 text-lg md:text-xl font-medium leading-relaxed drop-shadow-md"
          >
            Comida caseira, doces, picolés e comércios da vila. O melhor sabor e praticidade direto pra sua mesa.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => {
                const element = document.getElementById('vitrine-lojas');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-heading font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              Explorar Lojas
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-white font-heading font-black text-xs uppercase tracking-[0.2em] rounded-2xl backdrop-blur-xl hover:scale-105 active:scale-95 transition-all"
            >
              Área do Lojista
            </button>
          </motion.div>
        </div>
      </div>

      {/* Stores Grid */}
      <main id="vitrine-lojas" className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Store className="text-amber-500 w-7 h-7" />
              <h2 className="text-white font-heading text-3xl md:text-4xl font-black uppercase tracking-tight">Vitrine de Lojas</h2>
            </div>
            <p className="text-zinc-400 font-medium">Os melhores comércios locais da comunidade em um só lugar</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 uppercase tracking-widest bg-white/5 border border-white/10 px-5 py-2.5 rounded-full">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            {stores.length} Lojas Ativas
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {stores.length > 0 ? (
            stores.map((store) => (
              <motion.div
                key={store.slug}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                onClick={() => navigate(`/${store.slug}`)}
                className="group relative h-full cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
                
                <div className="glass-card rounded-[40px] overflow-hidden border border-white/5 bg-zinc-900/40 backdrop-blur-2xl h-full flex flex-col transition-all group-hover:border-amber-500/30 group-hover:bg-zinc-900/60 shadow-2xl">
                  {/* Store Image */}
                  <div className="h-56 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
                    {store.image ? (
                      <img 
                        src={store.image} 
                        alt={store.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                        <Store className="w-16 h-16 text-zinc-800 group-hover:text-amber-500/30 transition-colors" />
                      </div>
                    )}
                    
                    <div className="absolute top-6 right-6 z-20">
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest border backdrop-blur-xl shadow-2xl",
                        store.isOpen 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {store.isOpen ? '● ABERTO AGORA' : '○ FECHADO'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-white font-heading text-3xl font-black mb-3 group-hover:text-amber-400 transition-colors tracking-tight">
                      {store.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-8 font-medium">
                      {store.description || "Produtos selecionados com qualidade e carinho para você."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock size={14} className="text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Entrega Rápida</span>
                        </div>
                        <span className="text-white text-xs font-bold">30 - 45 min</span>
                      </div>
                      
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">Ver Loja</span>
                        <ArrowRight size={16} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Store className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2 uppercase tracking-tighter">Nenhuma loja ativa</h3>
              <p className="text-zinc-500 font-medium max-w-xs mx-auto">Estamos cadastrando novos comércios da quebrada para você. Volte em breve!</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer Premium */}
      <footer className="py-16 border-t border-white/5 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3.5">
             <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/40 shadow-lg shadow-amber-500/20 bg-zinc-900 flex-shrink-0">
               <img 
                 src="/da-quebrada-hero.jpg" 
                 alt="Logo Da Quebrada" 
                 className="w-full h-full object-cover transform scale-105 hover:scale-110 transition-transform duration-300"
               />
             </div>
             <div className="flex flex-col">
               <span className="text-white font-heading font-black text-2xl uppercase tracking-tighter leading-none">
                 DA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 italic">QUEBRADA</span>
               </span>
               <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">Delivery Comunitário</span>
             </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
             <a href="#" className="hover:text-amber-400 transition-colors">Início</a>
             <a href="#" className="hover:text-amber-400 transition-colors">Lojas</a>
             <a href="#" className="hover:text-amber-400 transition-colors">Parcerias</a>
             <a href="#" className="hover:text-amber-400 transition-colors">Ajuda</a>
          </div>

          <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-[0.2em]">
            &copy; 2026 DA QUEBRADA • Delivery Comunitário
          </p>
        </div>
      </footer>
    </div>
  );
}
