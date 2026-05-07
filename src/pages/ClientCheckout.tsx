import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { api } from '../lib/api';
import { ArrowLeft, Minus, Plus, Bike, Store, Loader2, ShoppingBag, MapPin, Phone, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, clearCart, storeSlug } = useCart();
  const [deliveryType, setDeliveryType] = useState<'entrega' | 'retirada'>('entrega');
  const [formData, setFormData] = useState({ nome: '', telefone: '', endereco: '', pagamento: 'pix', trocoPara: '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!storeSlug) return navigate('/');
    api.getMenu(storeSlug).then(() => setLoading(false));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) setFormData(prev => ({ ...prev, nome: data.full_name || '', telefone: data.phone || '', endereco: data.address || '' }));
        });
      }
    });
  }, [storeSlug]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (items.length === 0) return toast.error("Seu carrinho está vazio!");
    if (!formData.nome || !formData.telefone || (deliveryType === 'entrega' && !formData.endereco)) {
      return toast.error("Preencha todos os campos!");
    }

    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user?.id,
        customer_name: formData.nome,
        customer_phone: formData.telefone,
        delivery_address: deliveryType === 'retirada' ? 'RETIRADA' : formData.endereco,
        payment_method: formData.pagamento,
        total_amount: total + (deliveryType === 'entrega' ? 5 : 0),
        status: 'pendente',
        items_json: items,
        store_slug: storeSlug
      }).select().single();

      if (error) throw error;

      // Opcional: webhook ou log
      try {
        await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
      } catch (e) { /* ignore webhook error */ }
      
      clearCart();
      toast.success("Pedido enviado! 🍲");
      navigate(`/${storeSlug}`, { state: { tab: 'orders' } });
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar pedido.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-primary w-8 h-8"/>
    </div>
  );

  return (
    <div className="min-h-screen pb-32">
      <header className="p-4 border-b border-white/5 flex items-center gap-4 bg-background sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white"/>
        </button>
        <h1 className="font-bold text-white uppercase text-sm tracking-widest">Finalizar Pedido</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag size={20}/>
            <h2 className="font-bold text-xl uppercase tracking-tight">Seu Pedido</h2>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-2xl flex justify-between items-center border border-white/5 shadow-xl">
                <div>
                  <p className="text-white font-bold">{item.name} {item.size && `(${item.size})`}</p>
                  <p className="text-zinc-500 font-medium text-sm">{formatBRL(item.price)}</p>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                  <button onClick={() => updateQuantity(item.id, item.size, -1)} className="text-primary hover:scale-125 transition-transform"><Minus size={16}/></button>
                  <span className="text-white font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.size, 1)} className="text-primary hover:scale-125 transition-transform"><Plus size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Bike size={20}/>
            <h2 className="font-bold text-xl uppercase tracking-tight">Entrega ou Retirada</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeliveryType('entrega')} className={cn("flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-2 font-bold transition-all", deliveryType === 'entrega' ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" : "border-white/5 bg-zinc-900/30 text-zinc-500")}>
              <Bike size={24}/> <span className="text-xs uppercase tracking-widest">Entrega</span>
            </button>
            <button onClick={() => setDeliveryType('retirada')} className={cn("flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-2 font-bold transition-all", deliveryType === 'retirada' ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" : "border-white/5 bg-zinc-900/30 text-zinc-500")}>
              <Store size={24}/> <span className="text-xs uppercase tracking-widest">Retirada</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Phone size={20}/>
            <h2 className="font-bold text-xl uppercase tracking-tight">Seus Dados</h2>
          </div>
          <div className="space-y-4">
            <div className="group bg-zinc-900/50 border border-white/5 p-1 rounded-2xl focus-within:border-primary/50 transition-all">
              <input type="text" placeholder="Nome Completo" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-transparent p-4 text-white outline-none placeholder:text-zinc-600"/>
            </div>
            <div className="group bg-zinc-900/50 border border-white/5 p-1 rounded-2xl focus-within:border-primary/50 transition-all">
              <input type="text" placeholder="WhatsApp" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-transparent p-4 text-white outline-none placeholder:text-zinc-600"/>
            </div>
            {deliveryType === 'entrega' && (
              <div className="group bg-zinc-900/50 border border-white/5 p-1 rounded-2xl focus-within:border-primary/50 transition-all">
                <textarea placeholder="Endereço Completo (Rua, Nº, Bairro)" rows={3} value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-transparent p-4 text-white outline-none placeholder:text-zinc-600 resize-none"/>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CreditCard size={20}/>
            <h2 className="font-bold text-xl uppercase tracking-tight">Pagamento</h2>
          </div>
          <div className="space-y-2">
            {['pix', 'cartao_entrega', 'dinheiro'].map((method) => (
              <label key={method} className={cn("flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all", formData.pagamento === method ? "border-primary bg-primary/5" : "border-white/5 bg-zinc-900/30")}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="pagamento" value={method} checked={formData.pagamento === method} onChange={e => setFormData({...formData, pagamento: e.target.value})} className="accent-primary"/>
                  <span className="text-white font-bold uppercase text-xs tracking-widest">{method.replace('_', ' ')}</span>
                </div>
              </label>
            ))}
            {formData.pagamento === 'dinheiro' && (
              <div className="mt-2 p-1 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <input type="text" placeholder="Troco para quanto?" value={formData.trocoPara} onChange={e => setFormData({...formData, trocoPara: e.target.value})} className="w-full bg-transparent p-4 text-white outline-none text-sm"/>
              </div>
            )}
          </div>
        </section>

        <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl space-y-4 border border-white/10 shadow-2xl">
          <div className="flex justify-between text-zinc-500 text-sm font-medium"><span>Subtotal</span><span>{formatBRL(total)}</span></div>
          <div className="flex justify-between text-zinc-500 text-sm font-medium"><span>Taxa de Entrega</span><span>{deliveryType === 'entrega' ? formatBRL(5) : 'Grátis'}</span></div>
          <div className="h-px bg-white/5"></div>
          <div className="flex justify-between text-white font-black text-2xl uppercase tracking-tight"><span>Total</span><span className="text-primary">{formatBRL(total + (deliveryType === 'entrega' ? 5 : 0))}</span></div>
        </div>
      </main>

      <div className="fixed bottom-0 w-full p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 z-50">
        <button onClick={() => handleSubmit()} disabled={processing} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
          {processing ? <Loader2 className="animate-spin"/> : 'Finalizar Pedido'}
        </button>
      </div>
    </div>
  );
}
