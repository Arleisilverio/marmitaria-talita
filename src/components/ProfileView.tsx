"use client";

import React from 'react';
import { motion } from 'motion/react';
import { User, MapPin, Phone, Settings, ChevronRight } from 'lucide-react';

export default function ProfileView() {
  return (
    <div className="px-container pt-8 space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-2xl">
          <User className="text-white w-10 h-10" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">Olá, Visitante!</h2>
          <p className="text-secondary font-mono text-xs uppercase tracking-tighter">Cliente Bronze</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest ml-1">Minhas Informações</p>
        
        <button className="w-full glass-card p-4 rounded-2xl flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Endereço de Entrega</p>
              <p className="text-xs text-on-surface-variant">Toque para configurar</p>
            </div>
          </div>
          <ChevronRight className="text-zinc-600 group-hover:text-primary transition-colors" />
        </button>

        <button className="w-full glass-card p-4 rounded-2xl flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Telefone / WhatsApp</p>
              <p className="text-xs text-on-surface-variant">Não cadastrado</p>
            </div>
          </div>
          <ChevronRight className="text-zinc-600 group-hover:text-primary transition-colors" />
        </button>
      </div>

      <button className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
        <Settings className="w-5 h-5" />
        <span className="text-sm font-bold">Configurações da Conta</span>
      </button>
    </div>
  );
}