"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Package, Clock, CheckCircle2 } from 'lucide-react';
import { formatBRL } from '../lib/utils';

export default function OrdersView() {
  // Por enquanto, como não temos login, mostramos um estado vazio elegante
  // No futuro, isso buscaria os pedidos vinculados ao Telefone/ID do usuário
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