import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { ShoppingBag, MapPin, Phone, CreditCard, ChevronLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
          if (data) {
            setFormData(prev => ({
              ...prev,
              nome: data.full_name || '',
              telefone: data.phone || '',
              endereco: data.address || ''
            }));
          }
        });
      }
    });
  }, [storeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Seu carrinho está vazio');
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user?.id,
        customer_name: formData.nome,
        customer_phone: formData.telefone,
        delivery_address: deliveryType === 'entrega' ? formData.endereco : 'Retirada no balcão',
        payment_method: formData.pagamento,
        total_amount: total + (deliveryType === 'entrega' ? 5 : 0),
        status: 'pendente',
        items_json: items,
        store_slug: storeSlug
      }).select().single();

      if (error) throw error;

      toast.success('Pedido realizado com sucesso!');
      clearCart();
      navigate(`/obrigado/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pedido');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Finalizar Pedido</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Itens do Pedido */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold">Seu Carrinho</h2>
            </div>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-100 font-bold text-orange-500"
                    >-</button>
                    <span className="w-4 text-center font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-100 font-bold text-orange-500"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Opções de Entrega */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold">Como quer receber?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryType('entrega')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  deliveryType === 'entrega' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500'
                }`}
              >
                <p className="font-bold">Entrega</p>
                <p className="text-xs">Receber em casa</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('retirada')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  deliveryType === 'retirada' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500'
                }`}
              >
                <p className="font-bold">Retirada</p>
                <p className="text-xs">Buscar no local</p>
              </button>
            </div>
          </section>

          {/* Dados Pessoais */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold">Dados para Contato</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
              <input
                required
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 focus:ring-0 transition-all"
                placeholder="Como quer ser chamado?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                required
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 focus:ring-0 transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>
            {deliveryType === 'entrega' && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de Entrega</label>
                <textarea
                  required
                  rows={3}
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 focus:ring-0 transition-all"
                  placeholder="Rua, número, bairro e ponto de referência"
                />
              </div>
            )}
          </section>

          {/* Pagamento */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold">Pagamento</h2>
            </div>
            <div className="space-y-3">
              {['pix', 'cartao_entrega', 'dinheiro'].map((method) => (
                <label key={method} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.pagamento === method ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pagamento"
                      value={method}
                      checked={formData.pagamento === method}
                      onChange={(e) => setFormData({ ...formData, pagamento: e.target.value })}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                    />
                    <span className="font-medium capitalize text-gray-700">
                      {method.replace('_', ' ')}
                    </span>
                  </div>
                </label>
              ))}
              {formData.pagamento === 'dinheiro' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Troco para quanto?</label>
                  <input
                    type="text"
                    value={formData.trocoPara}
                    onChange={(e) => setFormData({ ...formData, trocoPara: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white border-gray-200 focus:border-orange-500 focus:ring-0 transition-all"
                    placeholder="Ex: 50"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Resumo e Botão */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              {deliveryType === 'entrega' && (
                <div className="flex justify-between text-orange-600">
                  <span>Taxa de Entrega</span>
                  <span>R$ 5,00</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>R$ {(total + (deliveryType === 'entrega' ? 5 : 0)).toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={processing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Finalizar e Pedir'
              )}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}
