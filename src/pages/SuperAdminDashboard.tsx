import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../integrations/supabase/client';
import { Shield, Plus, Power, Users, ArrowRight, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Admin form
  const [newEmail, setNewEmail] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'arleisilverio41@gmail.com') {
      toast.error("Acesso restrito ao Super Admin.");
      return navigate('/');
    }
    loadAdmins();
  };

  const loadAdmins = async () => {
    try {
      const data = await api.getAppAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error("Erro ao carregar lojistas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addAppAdmin(newEmail, newStoreName, newSlug);
      toast.success("Lojista adicionado com sucesso!");
      setNewEmail('');
      setNewStoreName('');
      setNewSlug('');
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar lojista.");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await api.toggleAppAdminStatus(id, currentStatus);
      toast.success("Status alterado!");
      loadAdmins();
    } catch (err) {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDeleteAdmin = async (id: string, slug: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta loja? A ação não pode ser desfeita.")) return;
    try {
      // Deleta o admin E as configurações da loja
      await api.deleteAppAdminWithStore(id, slug);
      toast.success("Loja excluída com sucesso!");
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir loja.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
      <header className="bg-[#111] border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="text-primary w-6 h-6" />
          <div>
            <h1 className="font-bold uppercase tracking-widest text-sm">Super Admin</h1>
            <p className="text-[10px] text-zinc-500 font-mono">Gestão Multi-Lojas</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="text-red-500 hover:text-red-400">
          <Power className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8 mt-6">
        {/* ADD NOVO LOJISTA */}
        <section className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-primary"/> Novo Lojista</h2>
          <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Email do Dono</label>
              <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="arlei85@hotmail.com" className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm"/>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Nome da Loja</label>
              <input required type="text" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} placeholder="Sua Loja" className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm"/>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Slug (URL)</label>
              <input required type="text" value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="ex: lanches-da-maria" className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm font-mono"/>
            </div>
            <button type="submit" className="w-full bg-primary py-3 rounded-xl font-bold uppercase text-xs text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform h-[46px]">
              Cadastrar
            </button>
          </form>
        </section>

        {/* LISTA DE LOJAS */}
        <section>
          <h2 className="font-bold flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary"/> Lojas Cadastradas ({admins.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* O próprio super admin como lojista default pra acessar o dele */}
            <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">Marmitaria Talita (Oficial)</h3>
                  <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] px-2 py-1 rounded-full uppercase tracking-widest font-bold">Matriz</span>
                </div>
                <p className="text-zinc-500 text-xs font-mono mb-4">arleisilverio41@gmail.com</p>
              </div>
              <button onClick={() => navigate('/admin')} className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold uppercase flex justify-center items-center gap-2 transition-colors">
                Acessar Painel <ArrowRight className="w-4 h-4"/>
              </button>
            </div>

            {admins.map(admin => (
              <div key={admin.id} className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{admin.store_name}</h3>
                    <span className={`text-[9px] px-2 py-1 rounded-full uppercase tracking-widest font-bold border ${admin.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {admin.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs font-mono">Dono: {admin.email}</p>
                  <p className="text-zinc-500 text-xs font-mono mb-4">Slug: {admin.slug}</p>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button onClick={() => toggleStatus(admin.id, admin.status)} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase flex justify-center items-center gap-2 transition-colors ${admin.status === 'active' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
                    {admin.status === 'active' ? <><Ban className="w-4 h-4"/> Bloquear</> : <><CheckCircle className="w-4 h-4"/> Liberar</>}
                  </button>
                  <button onClick={() => handleDeleteAdmin(admin.id, admin.slug)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center" title="Excluir loja">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}