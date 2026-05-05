"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Leaf, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Insira um email válido e senha de no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email ou senha incorretos.");
        toast.success("Bem-vindo de volta! 🍲");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error("Erro ao criar conta. Email já em uso ou inválido.");
        toast.success("Conta criada com sucesso! 🎉");
      }
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 text-zinc-500 hover:text-white p-2 bg-white/5 rounded-full backdrop-blur-md"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-tertiary rounded-3xl flex items-center justify-center text-white shadow-2xl">
            <Leaf size={40} />
          </div>
          <h1 className="font-heading text-3xl font-black text-white tracking-tighter mt-2">
            MARMITARIA TALITA
          </h1>
          <p className="text-on-surface-variant text-sm">Sabor & Tradição Caseira</p>
        </div>

        <form onSubmit={handleAuth} className="glass-card p-8 rounded-3xl border border-white/5 shadow-2xl text-left space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase text-zinc-500 tracking-widest mb-2 block">Seu E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@email.com" 
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-zinc-500 tracking-widest mb-2 block">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres" 
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 py-4 rounded-xl font-heading font-bold text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)] disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? 'Aguarde...' : (isLoginMode ? 'ENTRAR' : 'CRIAR MINHA CONTA')}
          </button>
          
          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-zinc-400 hover:text-white transition-colors text-sm"
            >
              {isLoginMode ? 'Não tem conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
            </button>
          </div>
        </form>
        
        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 uppercase font-mono tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          Conexão Segura
        </div>
      </motion.div>
    </div>
  );
}