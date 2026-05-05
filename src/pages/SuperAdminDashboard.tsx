import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../integrations/supabase/client';
import { formatBRL, cn } from '../lib/utils';
import { Crown, Store, Users, Ban, CheckCircle, LogOut, Plus, DollarSign, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const data = await api.getAppAdmins();
    setAdmins(data);
    setLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newStore || !newSlug) return toast.error("Preencha todos os campos");
    setAdding(true);
    try {
      await api.addAppAdmin(newEmail, newStore, newSlug);
      toast.success("Lojista cadastrado!");
      setNewEmail(''); setNewStore(''); setNewSlug('');
      fetchAdmins();
    } catch (err: any) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const status = await api.toggleAppAdminStatus(id, currentStatus);
    toast.success(`Status alterado para ${status}`);
    fetchAdmins();
  };

  if (loading) return <div className="p-20 text-yellow-500 text-center">Carregando Master...</div>;

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-6">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <Crown className="text-yellow-500 w-10 h-10" />
          <h1 className="text-2xl font-black text-white">SAAS MANAGER</h1>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="text-red-500 flex items-center gap-2 font-bold"><LogOut/> Sair</button>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-yellow-500/20 h-fit">
          <h2 className="text-xl font-bold text-white mb-6">Novo Cliente SaaS</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <input type="text" placeholder="Nome da Loja" value={newStore} onChange={e => setNewStore(e.target.value)} className="w-full bg-black p-4 rounded-xl outline-none border border-white/5 focus:border-yellow-500"/>
            <input type="text" placeholder="Slug (ex: pastelaria-da-vila)" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="w-full bg-black p-4 rounded-xl outline-none border border-white/5 focus:border-yellow-500"/>
            <input type="email" placeholder="E-mail do Lojista" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black p-4 rounded-xl outline-none border border-white/5 focus:border-yellow-500"/>
            <button className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl">AUTORIZAR LOJA</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Lojas Ativas</h2>
          {admins.map(admin => (
            <div key={admin.id} className="bg-zinc-900 p-6 rounded-2xl flex justify-between items-center border border-white/5">
              <div>
                <h3 className="text-white font-bold text-lg">{admin.store_name}</h3>
                <p className="text-sm text-zinc-500">{admin.email}</p>
                <a href={`/s/${admin.slug}`} target="_blank" className="text-xs text-yellow-500 flex items-center gap-1 mt-2"><ExternalLink size={12}/> {admin.slug}</a>
              </div>
              <button onClick={() => toggleStatus(admin.id, admin.status)} className={cn("px-4 py-2 rounded-lg font-bold", admin.status === 'active' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                {admin.status === 'active' ? 'Bloquear' : 'Ativar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}