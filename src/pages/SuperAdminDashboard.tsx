import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../integrations/supabase/client';
import { formatBRL } from '../lib/utils';
import { Crown, Store, Users, Ban, CheckCircle, LogOut, Plus, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form add new admin
  const [newEmail, setNewEmail] = useState('');
  const [newStore, setNewStore] = useState('');
  const [adding, setAdding] = useState(false);

  // Mensalidade base do SaaS
  const PLAN_PRICE = 49.90;

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.getAppAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error("Você precisa executar o código SQL no Supabase primeiro!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newStore) return toast.error("Preencha todos os campos");
    setAdding(true);
    try {
      await api.addAppAdmin(newEmail.trim(), newStore.trim());
      toast.success("Lojista adicionado com sucesso!");
      setNewEmail('');
      setNewStore('');
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = await api.toggleAppAdminStatus(id, currentStatus);
      toast.success(`Loja ${newStatus === 'active' ? 'Ativada' : 'Bloqueada'}!`);
      
      // Se bloqueou, fecha a loja também para os clientes não pedirem
      if (newStatus === 'blocked') {
         const menu = await api.getMenu();
         await api.updateMenu({ ...menu, isOpen: false });
         toast("A loja foi fechada no app automaticamente.", { icon: '🔒' });
      }
      
      fetchAdmins();
    } catch (err) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast.success('Você saiu do Painel Master.');
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex justify-center items-center text-yellow-500">Carregando painel master...</div>;

  const activeAdmins = admins.filter(a => a.status === 'active').length;
  const mrr = activeAdmins * PLAN_PRICE;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 selection:bg-yellow-500/30">
      <header className="bg-zinc-900/50 backdrop-blur-md border-b border-yellow-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading font-black text-xl text-white tracking-widest uppercase">Creator Panel</h1>
              <p className="text-[10px] text-yellow-500/70 font-mono uppercase tracking-widest">Gestão de Lojistas SaaS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="text-xs font-bold text-zinc-400 hover:text-white uppercase transition-colors flex items-center gap-2">
              <Store className="w-4 h-4" /> Acessar App
            </button>
            <div className="h-6 w-px bg-white/10"></div>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-400 uppercase transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        
        {/* MÉTRICAS SAAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2 text-yellow-500"><Store className="w-5 h-5"/> <h3 className="font-bold uppercase text-xs tracking-widest">Lojas Ativas</h3></div>
            <p className="text-4xl font-black text-white">{activeAdmins}</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2 text-yellow-500"><DollarSign className="w-5 h-5"/> <h3 className="font-bold uppercase text-xs tracking-widest">Receita Mensal (MRR)</h3></div>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">{formatBRL(mrr)}</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2 text-zinc-500"><Users className="w-5 h-5"/> <h3 className="font-bold uppercase text-xs tracking-widest">Total de Cadastros</h3></div>
            <p className="text-4xl font-black text-white">{admins.length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* CADASTRAR NOVO LOJISTA */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-yellow-500/20 p-6 rounded-3xl sticky top-28 shadow-[0_0_30px_rgba(251,191,36,0.05)]">
              <h2 className="font-heading text-xl font-bold text-white mb-2">Novo Lojista</h2>
              <p className="text-sm text-zinc-400 mb-6">Autorize um e-mail para que o dono da loja tenha acesso ao painel de pedidos.</p>
              
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Nome do Comércio</label>
                  <input type="text" value={newStore} onChange={e => setNewStore(e.target.value)} required className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition-colors" placeholder="Ex: Marmitaria Dona Maria"/>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">E-mail do Dono</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition-colors" placeholder="email@cliente.com"/>
                </div>
                <button type="submit" disabled={adding} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  <Plus className="w-5 h-5" /> {adding ? 'CADASTRANDO...' : 'AUTORIZAR ACESSO'}
                </button>
              </form>
            </div>
          </div>

          {/* LISTA DE LOJISTAS */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-heading text-xl font-bold text-white mb-4">Lojistas Gerenciados</h2>
            
            {admins.length === 0 ? (
               <div className="text-center py-12 border border-white/5 rounded-3xl bg-zinc-900/30">
                 <p className="text-zinc-500">Nenhum lojista cadastrado ainda. Adicione o primeiro ao lado.</p>
               </div>
            ) : admins.map(admin => (
              <div key={admin.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all ${admin.status === 'active' ? 'bg-zinc-900/50 border-white/5' : 'bg-red-950/20 border-red-500/20'}`}>
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${admin.status === 'active' ? 'bg-zinc-800 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{admin.store_name}</h3>
                    <p className="text-sm text-zinc-400">{admin.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-zinc-600"/>
                      <span className="text-xs text-zinc-500">Cliente desde {format(new Date(admin.created_at), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${admin.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {admin.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}
                  </div>
                  
                  <button 
                    onClick={() => toggleStatus(admin.id, admin.status)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-2 ${admin.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                  >
                    {admin.status === 'active' ? <><Ban className="w-4 h-4"/> Bloquear App</> : <><CheckCircle className="w-4 h-4"/> Reativar App</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}