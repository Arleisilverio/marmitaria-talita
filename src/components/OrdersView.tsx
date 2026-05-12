"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Gift, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { formatBRL } from '../lib/utils';
import { format } from 'date-fns';
import { useMyOrders } from '../lib/hooks';

export default function OrdersView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingAuth(false);
    });
  }, []);

  const { data: orders = [], isLoading: loadingOrders } = useMyOrders(user?.id);
  const loading = loadingAuth || (user && loadingOrders);

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando...</div>;

  if (!user) {
    return (
      <div className="px-container pt-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-gradient-to-br from-primary/20 to-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-xl border border-primary/30"
        >
          <Gift className="text-primary w-12 h-12" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold text-white mb-3">Histórico e Prêmios</h2>
        <p className="text-on-surface-variant text-sm max-w-[320px] mx-auto leading-relaxed mb-8">
          Crie uma conta para acompanhar seus pedidos e participar do nosso programa de fidelidade: <b>a cada 10 marmitas, a 11ª é por nossa conta!</b> 🎁
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full max-w-[320px] bg-gradient-to-r from-red-600 to-primary text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:scale-105 transition-transform"
        >
          FAZER LOGIN / CADASTRAR
        </button>
      </div>
    );
  }

  return (
    <div className="px-container pt-6 space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
          <Package className="text-secondary w-8 h-8" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">Meus Pedidos</h2>
          <p className="text-sm text-zinc-500">Acompanhe seu histórico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl border border-white/5">
            <p className="text-zinc-500 text-sm">Você ainda não realizou pedidos.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-sans text-xs text-zinc-500 font-mono mb-1">
                    {format(new Date(order.created_at), "dd/MM/yyyy • HH:mm")}
                  </p>
                  <p className="font-bold text-white text-lg">{formatBRL(order.total_amount)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold flex items-center gap-1 ${
                  order.status === 'pendente' ? 'bg-primary/10 text-primary border border-primary/30' : 
                  order.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 
                  order.status === 'entregue' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 
                  'bg-red-500/10 text-red-500 border border-red-500/30'
                }`}>
                  {order.status === 'entregue' ? <CheckCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                  {order.status}
                </div>
              </div>
              
              <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                {order.items_json?.map((i:any, idx:number) => (
                  <p key={idx} className="text-sm text-zinc-300">
                    <span className="font-bold text-zinc-500 mr-2">{i.quantity}x</span>
                    {i.name} {i.size && <span className="text-orange-400 text-xs">({i.size})</span>}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
