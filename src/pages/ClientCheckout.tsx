import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { cn, formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { api } from '../lib/api';
import { ArrowLeft, Minus, Plus, Bike, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, clearCart } = useCart();
  const [deliveryType, setDeliveryType] = useState<'entrega' | 'retirada'>('entrega');
  const [formData, setFormData] = useState({ nome: '', telefone: '', endereco: '', pagamento: 'pix', trocoPara: '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const SLUG = 'marmitaria-talita';

  useEffect(() => {
    api.getMenu(SLUG).then(() => setLoading(false));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) setFormData(prev => ({ ...prev, nome: data.full_name || '', telefone: data.phone || '', endereco: data.address || '' }));
        });
      }
    });
  }, []);

  const handleSubmit = async () => {
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
        store_slug: SLUG
      }).select().single();

      if (error) throw error;

      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
      
      clearCart();
      toast.success("Pedido enviado! 🍲");
      navigate('/', { state: { tab: 'orders' } });
    } catch (err) {
      toast.error("Erro ao enviar pedido.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen pb-32">
      <header className="p-4 border-b border-white/5 flex items-center gap-4 bg-background sticky top-0 z-50">
        <button onClick={() => navigate(-1)}><ArrowLeft/></button>
        <h1 className="font-bold text-white uppercase text-sm">Finalizar Pedido</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-8">
        <section className="space-y-4">
          <h2 className="text-primary font-bold text-xl">Seu Pedido</h2>
          {items.map((item, idx) => (
            <div key={idx} className="glass-card p-4 rounded-xl flex justify-between items-center border border-white/5">
              <div>
                <p className="text-white font-bold">{item.name} {item.size && `(${item.size})`}</p>
                <p className="text-secondary font-bold">{formatBRL(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, item.size, -1)} className="text-primary"><Minus size={16}/></button>
                <span className="text-white font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.size, 1)} className="text-primary"><Plus size={16}/></button>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-primary font-bold text-xl">Entrega ou Retirada</h2>
          <div className="flex gap-2">
            <button onClick={() => setDeliveryType('entrega')} className={cn("flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 font-bold", deliveryType === 'entrega' ? "border-primary bg-primary/10 text-primary" : "border-white/5 text-zinc-500")}>
              <Bike/> <span>Entrega</span>
            </button>
            <button onClick={() => setDeliveryType('retirada')} className={cn("flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 font-bold", deliveryType === 'retirada' ? "border-primary bg-primary/10 text-primary" : "border-white/5 text-zinc-500")}>
              <Store/> <span>Retirada</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-primary font-bold text-xl">Seus Dados</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-zinc-900 border border-white/5 p-4 rounded-xl text-white outline-none"/>
            <input type="text" placeholder="WhatsApp" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-zinc-900 border border-white/5 p-4 rounded-xl text-white outline-none"/>
            {deliveryType === 'entrega' && (
              <textarea placeholder="Endereço" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-zinc-900 border border-white/5 p-4 rounded-xl text-white outline-none"/>
            )}
          </div>
        </section>

        <div className="glass-card p-6 rounded-xl space-y-4 border border-white/5">
          <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{formatBRL(total)}</span></div>
          <div className="flex justify-between text-zinc-400"><span>Taxa</span><span>{deliveryType === 'entrega' ? formatBRL(5) : 'Grátis'}</span></div>
          <div className="h-px bg-white/5"></div>
          <div className="flex justify-between text-white font-bold text-xl"><span>Total</span><span>{formatBRL(total + (deliveryType === 'entrega' ? 5 : 0))}</span></div>
        </div>
      </main>

      <div className="fixed bottom-0 w-full p-4 bg-background border-t border-white/5">
        <button onClick={handleSubmit} disabled={processing} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-xl">
          {processing ? 'Enviando...' : 'FINALIZAR PEDIDO'}
        </button>
      </div>
    </div>
  );
}