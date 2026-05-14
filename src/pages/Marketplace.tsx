import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { Leaf, Store, ArrowRight, Clock, ArrowLeft, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';

export default function Marketplace() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Verifica se há usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Carrega lojas
        const data = await api.getAllStores();
        setStores(data);
      } catch (err: any) {
        console.error("Erro ao carregar lojas:", err);
        setError("Não foi possível carregar as lojas. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Você saiu da conta.");
    navigate('/');
  };

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
      {/* Header com Login/Logout */}
      <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-xs font-mono hidden md:block">{user.email}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group"
            >
              <div className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">Sair</span>
            </button>
          </div>
        ) : (
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group"
          >
            <div className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(226,114,91,0.4)] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">Login</span>
          </motion.button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[50vh] flex items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(226,114,91,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative z-10 text-center px-4 w-full max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <Leaf className="text-primary w-6 h-6 animate-bounce-slow" />
            <span className="text-primary font-mono text-[10px] font-bold tracking-[0.4em] uppercase">Marmitaria Premium</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl font-heading font-black text-white mb-6 tracking-tighter leading-none"
          >
            O SABOR DA <br />
            <span className="text-primary italic relative">
              QUEBRADA
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute -bottom-2 left-0 h-2 bg-primary/20 -z-10"
              />
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-lg mx-auto mb-10 text-lg font-medium leading-relaxed"
          >
            Comida caseira de verdade, preparada com carinho e entregue com rapidez. Escolha sua favorita agora.
          </motion.p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="group relative px-10 py-5 bg-white/5 border border-white/10 rounded-full overflow-hidden transition-all hover:border-primary/50"
          >
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative text-xs font-black uppercase tracking-[0.3em] text-white group-hover:text-primary transition-colors">
              Área do Lojista
            </span>
          </motion.button>
        </div>
      </div>

      {/* Stores Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Store className="text-primary w-6 h-6" />
              <h2 className="text-white font-heading text-3xl font-black uppercase tracking-tight">Vitrine de Lojas</h2>
            </div>
            <p className="text-zinc-500 font-medium">As melhores marmitarias da região em um só lugar</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {stores.length} Lojas Online
          </div>
        </motion.div>

        {/* SEM LOJAS CADASTRADAS */}
        {stores.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center"
          >
            <div className="max-w-md mx-auto bg-zinc-900/50 border border-white/5 rounded-3xl p-10 backdrop-blur-xl">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Store className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3 uppercase tracking-tighter">Nenhuma loja cadastrada</h3>
              <p className="text-zinc-500 font-medium max-w-xs mx-auto mb-8">
                Ainda não temos marmitarias disponíveis. Se você é lojista, entre em contato com o administrador para criar sua loja.
              </p>
              {user && (
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 border border-red-500/20 py-4 rounded-2xl text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {stores.map((store) => (
              <motion.div
                key={store.slug}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                onClick={() => navigate(`/${store.slug}`)}
                className="group relative h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
                
                <div className="glass-card rounded-[40px] overflow-hidden border border-white/5 bg-zinc-900/40 backdrop-blur-2xl h-full flex flex-col transition-all group-hover:border-primary/20 group-hover:bg-zinc-900/60 shadow-2xl">
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
                        <Store className="w-16 h-16 text-zinc-800 group-hover:text-primary/20 transition-colors" />
                      </div>
                    )}
                    
                    <div className="absolute top-6 right-6 z-20">
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest border backdrop-blur-xl shadow-2xl",
                        store.isOpen 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {store.isOpen ? '● ABERTO AGORA' : '○ FECHADO'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-white font-heading text-3xl font-black mb-3 group-hover:text-primary transition-colors tracking-tight">
                      {store.title}
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-8 font-medium">
                      {store.description || "O melhor tempero da região, preparado com ingredientes frescos e selecionados."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock size={14} className="text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Tempo de Entrega</span>
                        </div>
                        <span className="text-white text-xs font-bold">35 - 50 min</span>
                      </div>
                      
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">Cardápio</span>
                        <ArrowRight size={16} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer Premium */}
      <footer className="py-20 border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
               <Leaf className="text-white w-6 h-6" />
             </div>
             <span className="text-white font-heading font-black text-xl uppercase tracking-tighter">Marmitaria <span className="text-primary">Talita</span></span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
             <a href="#" className="hover:text-primary transition-colors">Início</a>
             <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
             <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
             <a href="#" className="hover:text-primary transition-colors">Ajuda</a>
          </div>

          <p className="text-zinc-700 text-[10px] uppercase font-mono tracking-[0.2em]">
            &copy; 2024 Platform • Powered by Antigravity
          </p>
        </div>
      </footer>
    </div>
  );
}