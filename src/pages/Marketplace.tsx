import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { Leaf, Store, ArrowRight, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Marketplace() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getAllStores().then(data => {
      setStores(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-white">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Carregando Vitrine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Botão Voltar para o Login */}
      <button 
        onClick={() => navigate('/login')}
        className="fixed top-8 left-8 z-50 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Login</span>
      </button>

      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background z-0" />
        <div className="relative z-10 text-center px-4 w-full max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Leaf className="text-secondary w-8 h-8" />
            <span className="text-primary font-mono text-sm font-bold tracking-widest uppercase">Shopping da Quebrada</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-heading font-black text-white mb-4 tracking-tighter"
          >
            SHOPPING DA <span className="text-primary">QUEBRADA</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-lg mx-auto mb-8"
          >
            Escolha sua marmitaria favorita e receba comida caseira de verdade onde você estiver.
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/login')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-primary transition-colors border border-white/5 px-6 py-2 rounded-full"
          >
            Área do Lojista
          </motion.button>
        </div>
      </div>

      {/* Stores Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Store className="text-primary w-5 h-5" />
          <h2 className="text-white font-heading text-xl font-bold uppercase tracking-tight">Lojas em Destaque</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.length > 0 ? (
            stores.map((store, index) => (
              <motion.div
                key={store.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/${store.slug}`)}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative glass-card rounded-3xl overflow-hidden border border-white/5 bg-surface/50 backdrop-blur-xl h-full flex flex-col">
                  {/* Store Image */}
                  <div className="h-48 overflow-hidden relative">
                    {store.image ? (
                      <img src={store.image} alt={store.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <Store className="w-12 h-12 text-zinc-800" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md",
                        store.isOpen 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {store.isOpen ? 'ABERTO' : 'FECHADO'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-white font-heading text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {store.title}
                    </h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-1">
                      {store.description || "Nenhuma descrição disponível."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-mono uppercase tracking-widest">30-45 min</span>
                      </div>
                      <div className="text-primary font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        <span className="text-xs uppercase tracking-tighter">Ver Cardápio</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Nenhuma loja ativa no momento.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-[0.2em]">
          &copy; 2024 Marmitaria Talita Platform • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
