"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, MapPin, Phone, Settings, ChevronRight, Gift, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

export default function ProfileView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando...</div>;

  if (!user) {
    return (
      <div className="px-container pt-12 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-xl"
        >
          <User className="text-zinc-400 w-12 h-12" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold text-white mb-3">Seu Perfil</h2>
        <p className="text-on-surface-variant text-sm max-w-[280px] mx-auto leading-relaxed mb-8">
          Crie seu perfil para salvar seu endereço de entrega, ter um avatar personalizado e interagir com a Talita!
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full max-w-[280px] bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-transform"
        >
          CRIAR MEU PERFIL / ENTRAR
        </button>
      </div>
    );
  }

  const isAdmin = user.email === 'arleisilverio41@gmail.com';

  return (
    <div className="px-container pt-8 space-y-8 pb-24">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-2xl relative overflow-hidden">
          <User className="text-white w-10 h-10 relative z-10" />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-white truncate max-w-[200px]">
            {user.email?.split('@')[0]}
          </h2>
          <div className="flex items-center gap-1 text-secondary mt-1">
            <Gift className="w-3 h-3" />
            <p className="font-mono text-xs uppercase tracking-tighter font-bold">Fidelidade: 0/10</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <button 
          onClick={() => navigate('/admin')}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-2xl flex items-center justify-between group shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white uppercase tracking-wider">Painel da Cozinha</p>
              <p className="text-xs text-white/80">Gerenciar cardápio e pedidos</p>
            </div>
          </div>
          <ChevronRight className="text-white group-hover:translate-x-1 transition-transform" />
        </button>
      )}

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

      <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/20 transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-wider">Sair da Conta</span>
      </button>
    </div>
  );
}