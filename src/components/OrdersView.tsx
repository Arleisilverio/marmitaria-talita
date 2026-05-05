"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Clock, Gift } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

export default function OrdersView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando...</div>;

  if (!user) {
    return (
      <div className="px-container pt-12 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-xl border border-orange-500/30"
        >
          <Gift className="text-orange-500 w-12 h-12" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold text-white mb-3">Histórico e Prêmios</h2>
        <p className="text-on-surface-variant text-sm max-w-[280px] mx-auto leading-relaxed mb-8">
          Crie uma conta para acompanhar seus pedidos e participar do nosso programa de fidelidade: <b>a cada 10 marmitas, a 11ª é por nossa conta!</b> 🎁
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full max-w-[280px] bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:scale-105 transition-transform"
        >
          FAZER LOGIN / CADASTRAR
        </button>
      </div>
    );
  }

  return (
    <div className="px-container pt-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6"
      >
        <Package className="text-secondary w-10 h-10" />
      </motion.div>
      <h2 className="font-heading text-2xl font-bold text-white mb-2">Meus Pedidos</h2>
      <p className="text-on-surface-variant text-sm max-w-[250px] mx-auto leading-relaxed">
        Você ainda não realizou pedidos hoje. Que tal escolher uma marmita quentinha?
      </p>
      
      <div className="mt-12 w-full space-y-4">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Status da Cozinha</p>
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 opacity-50 grayscale">
          <Clock className="text-zinc-500" />
          <div className="text-left">
            <p className="text-sm font-bold text-zinc-400">Nenhum pedido em preparo</p>
          </div>
        </div>
      </div>
    </div>
  );
}