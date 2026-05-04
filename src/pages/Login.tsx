"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { Leaf } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary border border-secondary/20 shadow-2xl">
            <Leaf size={40} />
          </div>
          <h1 className="font-heading text-3xl font-black text-white tracking-tighter">
            MARMITARIA TALITA
          </h1>
          <p className="text-on-surface-variant text-sm">Entre para saborear a melhor comida caseira</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#e2725b',
                    brandAccent: '#bd5a44',
                    inputBackground: '#1b1f18',
                    inputText: 'white',
                    inputPlaceholder: '#b9c2b1',
                  },
                },
              },
              className: {
                button: 'font-heading font-bold rounded-xl py-3',
                input: 'rounded-xl border-white/10 focus:border-primary transition-all',
                label: 'font-mono text-[10px] uppercase text-zinc-500 tracking-widest mb-1'
              }
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'ENTRAR',
                  link_text: 'Já tem uma conta? Entre'
                },
                sign_up: {
                  email_label: 'E-mail',
                  password_label: 'Crie uma senha',
                  button_label: 'CADASTRAR',
                  link_text: 'Não tem conta? Cadastre-se'
                }
              }
            }}
            providers={[]}
            theme="dark"
          />
        </div>
        
        <p className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest">
          Sabor & Tradição desde sempre
        </p>
      </motion.div>
    </div>
  );
}