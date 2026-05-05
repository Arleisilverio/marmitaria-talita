"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, MapPin, Phone, LogOut, Camera, Save, Edit2, ShieldAlert } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';

export default function ProfileView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    avatar_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          avatar_url: data.avatar_url || ''
        });
      }
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, avatar_url: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Erro ao salvar perfil.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando perfil...</div>;

  if (!user) {
    return (
      <div className="px-container pt-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-xl">
          <User className="text-zinc-400 w-12 h-12" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold text-white mb-3">Seu Perfil</h2>
        <p className="text-on-surface-variant text-sm max-w-[320px] mx-auto leading-relaxed mb-8">
          Crie seu perfil para salvar seu endereço de entrega e personalizar sua conta!
        </p>
        <button onClick={() => navigate('/login')} className="w-full max-w-[320px] bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-transform">
          CRIAR MEU PERFIL / ENTRAR
        </button>
      </div>
    );
  }

  const isAdmin = user.email === 'arleisilverio41@gmail.com';

  return (
    <div className="px-container pt-8 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-2xl overflow-hidden border-4 border-surface">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="text-white w-12 h-12 md:w-16 md:h-16" />
          )}
          {isEditing && (
            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer hover:bg-black/40 transition-colors text-white">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-bold uppercase">Mudar Foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
        <div className="text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
            {profile.full_name || 'Usuário'}
            {isAdmin && <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-orange-500" title="Administrador" />}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">{user.email}</p>
        </div>
        
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2 hover:bg-white/10 transition-colors">
            <Edit2 className="w-3 h-3" /> Editar Perfil
          </button>
        ) : (
          <button onClick={handleSaveProfile} disabled={saving} className="bg-primary px-8 py-3 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-primary/30">
            {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Perfil</>}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5 md:p-8 rounded-2xl md:rounded-3xl space-y-4 md:space-y-6">
          <div>
            <label className="font-mono text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><User className="w-3 h-3 md:w-4 md:h-4"/> Nome Completo</label>
            {isEditing ? (
              <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-3 md:p-4 rounded-xl text-white outline-none" placeholder="Como devemos te chamar?" />
            ) : (
              <p className="text-white font-bold md:text-lg">{profile.full_name || <span className="text-zinc-600 italic font-normal">Não informado</span>}</p>
            )}
          </div>
          
          <div className="h-px bg-white/5 w-full"></div>

          <div>
            <label className="font-mono text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Phone className="w-3 h-3 md:w-4 md:h-4"/> Telefone / WhatsApp</label>
            {isEditing ? (
              <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-3 md:p-4 rounded-xl text-white outline-none" placeholder="(00) 00000-0000" />
            ) : (
              <p className="text-white font-bold md:text-lg">{profile.phone || <span className="text-zinc-600 italic font-normal">Não informado</span>}</p>
            )}
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          <div>
            <label className="font-mono text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin className="w-3 h-3 md:w-4 md:h-4"/> Endereço de Entrega</label>
            {isEditing ? (
              <textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-3 md:p-4 rounded-xl text-white outline-none resize-none" rows={3} placeholder="Rua, Número, Bairro, Referência" />
            ) : (
              <p className="text-white font-bold text-sm md:text-base leading-relaxed">{profile.address || <span className="text-zinc-600 italic font-normal">Não informado</span>}</p>
            )}
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/20 transition-colors mt-8">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-wider">Sair da Conta</span>
      </button>
    </div>
  );
}
