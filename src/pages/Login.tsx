import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  LogIn, Mail, Lock, Sparkles, 
  ChevronRight, ArrowLeft, ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) checkRedirect(user.email!);
    });
  }, []);

  const checkRedirect = async (email: string) => {
    if (email === 'arleisilverio41@gmail.com') {
      navigate('/super-admin');
      return;
    }
    const adminData = await api.checkAdminAccess(email);
    if (adminData) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) checkRedirect(data.user.email!);
      
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      
      if (data.session && data.user) {
        checkRedirect(data.user.email!);
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      
      {/* LADO ESQUERDO: VISUAL (APENAS DESKTOP) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1500" 
            className="w-full h-full object-cover opacity-20 blur-sm scale-110" 
            alt="Fundo"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/80 to-primary/20" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
           <div className="w-20 h-20 bg-primary rounded-[32px] flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-primary/30 transform -rotate-12">
             <Sparkles className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-6xl font-black text-white leading-tight uppercase tracking-tighter mb-6">
             O sabor da comida <span className="text-primary italic">Caseira</span> no seu dia a dia.
           </h1>
           <p className="text-zinc-500 text-lg font-medium leading-relaxed">
             Acesse sua conta para gerenciar seus pedidos e ganhar pontos de fidelidade exclusivos.
           </p>
        </div>

        {/* FLOATING CARDS */}
        <div className="absolute top-20 right-20 bg-zinc-950/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl animate-bounce-slow">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
               <ShieldCheck className="w-5 h-5 text-green-500" />
             </div>
             <div className="text-left">
               <p className="text-white text-xs font-black uppercase">Entrega Garantida</p>
               <p className="text-zinc-500 text-[10px]">100% dos pedidos entregues</p>
             </div>
           </div>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO */}
      <div className="flex-grow flex items-center justify-center p-8 lg:p-24 relative">
        
        {/* BOTÃO VOLTAR */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 lg:top-12 lg:left-12 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
        >
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm space-y-10"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Bem-vindo de volta</h2>
            <p className="text-zinc-500 text-sm font-medium">Informe suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  required
                  type="email" 
                  placeholder="Seu email"
                  className="w-full bg-zinc-900 border border-white/5 p-5 pl-12 rounded-2xl text-white outline-none focus:border-primary focus:bg-zinc-800 transition-all placeholder:text-zinc-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  required
                  type="password" 
                  placeholder="Sua senha"
                  className="w-full bg-zinc-900 border border-white/5 p-5 pl-12 rounded-2xl text-white outline-none focus:border-primary focus:bg-zinc-800 transition-all placeholder:text-zinc-700"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary py-5 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Acessar Conta <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              <button 
                type="button"
                onClick={handleSignUp}
                className="w-full bg-white/5 py-5 rounded-2xl font-black text-zinc-400 text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all"
              >
                Criar Nova Conta
              </button>
            </div>
          </form>

          <div className="pt-6 flex flex-col items-center gap-6">
             <div className="flex items-center gap-4 w-full">
               <div className="h-[1px] bg-white/5 flex-grow" />
               <span className="text-[10px] text-zinc-700 font-black uppercase">Segurança</span>
               <div className="h-[1px] bg-white/5 flex-grow" />
             </div>
             <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                <AlertCircle className="w-3 h-3 text-zinc-700" />
                Seus dados estão protegidos por criptografia ponta-a-ponta.
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
