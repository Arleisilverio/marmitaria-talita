import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { api } from '../lib/api';
import { useMenu } from '../lib/hooks';
import { formatBRL } from '../lib/utils';
import { 
  ArrowLeft, ShoppingBag, MapPin, Phone, 
  CreditCard, Banknote, User, CheckCircle2,
  Lock, ShieldCheck, ChevronRight, AlertCircle,
  Truck
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [storeSlug] = useState<string>('marmitaria-talita');
  const { data: menu } = useMenu(storeSlug);
  const deliveryFee = Number(menu?.deliveryFee) || 0;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    complement: '',
    payment: 'pix'
  });

  useEffect(() => {
    if (items.length === 0 && !success) {
      navigate('/');
    }
    loadProfile();
  }, [items, success]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await api.getProfile(user.id);
      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.full_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const orderData = {
        store_slug: storeSlug,
        customer_id: user?.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        address: formData.address + (formData.complement ? `, ${formData.complement}` : ''),
        items_json: items,
        total_amount: total + deliveryFee,
        payment_method: formData.payment,
        status: 'pendente'
      };

      await api.createOrder(orderData);
      
      setSuccess(true);
      clearCart();
      toast.success("Pedido enviado com sucesso!");
    } catch (err) {
      toast.error("Erro ao finalizar pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-white/5 p-12 rounded-[40px] text-center max-w-md w-full shadow-2xl"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Pedido Realizado!</h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-10 px-4">
            Sua marmita está sendo preparada com muito carinho. Acompanhe o status no seu perfil.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-primary py-5 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
          >
            Voltar para a Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER MINIMALISTA */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-white font-black text-lg uppercase tracking-tight">Finalizar Pedido</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 rounded-full border border-white/5">
             <Lock className="w-3 h-3 text-primary" />
             <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Checkout Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLUNA ESQUERDA: DADOS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* SEÇÃO: IDENTIFICAÇÃO */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Identificação</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Como devemos te chamar?"
                    className="w-full bg-zinc-900 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-primary transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-zinc-900 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-primary transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* SEÇÃO: ENTREGA */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Endereço de Entrega</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Endereço Principal</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Rua, Número e Bairro"
                    className="w-full bg-zinc-900 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-primary transition-all"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Complemento / Referência</label>
                  <input 
                    type="text" 
                    placeholder="Apto, Bloco, Casa nos fundos..."
                    className="w-full bg-zinc-900 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-primary transition-all"
                    value={formData.complement}
                    onChange={e => setFormData({...formData, complement: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* SEÇÃO: PAGAMENTO */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Método de Pagamento</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'pix', label: 'PIX', icon: <ShieldCheck className="w-4 h-4"/> },
                  { id: 'card', label: 'Cartão', icon: <CreditCard className="w-4 h-4"/> },
                  { id: 'cash', label: 'Dinheiro', icon: <Banknote className="w-4 h-4"/> }
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({...formData, payment: method.id})}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border transition-all",
                      formData.payment === method.id 
                        ? "bg-primary/10 border-primary text-white" 
                        : "bg-zinc-900 border-white/5 text-zinc-500"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {method.icon}
                      <span className="font-bold text-xs uppercase tracking-widest">{method.label}</span>
                    </div>
                    {formData.payment === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* COLUNA DIREITA: RESUMO */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900 rounded-[32px] p-8 border border-white/5 sticky top-32 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-primary" /> Resumo do Pedido
              </h3>

              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 text-[10px] font-black text-primary">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">{item.size}</p>
                      </div>
                    </div>
                    <span className="text-white font-mono text-sm">{formatBRL(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex justify-between text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white font-mono">{formatBRL(total)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Truck className="w-3 h-3"/> Taxa de Entrega</span>
                  <span className="text-white font-mono">{formatBRL(deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-white font-black text-sm uppercase tracking-widest">Total</span>
                  <span className="text-primary font-black text-2xl font-mono">{formatBRL(total + deliveryFee)}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary mt-10 py-5 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Confirmar e Pedir <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-zinc-600 font-black uppercase tracking-widest">
                <AlertCircle className="w-3 h-3" />
                Pague apenas no recebimento
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
