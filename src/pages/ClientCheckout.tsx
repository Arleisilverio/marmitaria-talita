"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import {
  ArrowLeft,
  Minus,
  Plus,
  QrCode,
  CreditCard,
  Banknote,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    pagamento: 'pix',
    trocoPara: ''
  });
  const [loading, setLoading] = useState(false);

  const deliveryFee = 5.00;
  const finalTotal = total + (items.length > 0 ? deliveryFee : 0);

  const handleSubmit = async () => {
    if (!formData.nome || !formData.telefone || !formData.endereco) {
      toast.error("Preencha todos os campos!");
      return;
    }

    setLoading(true);
    try {
      // Pegar usuário atual de forma garantida
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.");
        navigate('/login');
        return;
      }

      // 1. Criar o pedido no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id, // Forçando o ID do usuário logado
          customer_name: formData.nome,
          customer_phone: formData.telefone,
          delivery_address: formData.endereco,
          payment_method: formData.pagamento,
          change_for: formData.trocoPara || null,
          total_amount: finalTotal,
          status: 'pendente'
        })
        .select()
        .single();

      if (orderError) {
        console.error("Erro RLS/Banco:", orderError);
        throw new Error(orderError.message);
      }

      // 2. Salvar os itens do pedido
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: null, 
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.observation || ''
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Notificar API Local (Telegram/Admin)
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...order,
          itens: items
        })
      });

      clearCart();
      toast.success("Pedido realizado com sucesso!");
      navigate('/');
    } catch (err: any) {
      console.error("Erro completo:", err);
      toast.error(`Erro: ${err.message || "Tente novamente"}`);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-heading mb-4 text-white">Seu carrinho está vazio</h2>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-container text-white rounded-full font-bold">Voltar ao Cardápio</button>
        </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-between items-center px-4 py-3 w-full">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-orange-600 active:scale-95 duration-200">
            <ArrowLeft />
          </button>
          <h1 className="font-heading text-sm font-bold uppercase tracking-widest text-orange-600">FINALIZAR PEDIDO</h1>
        </div>
        <div className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">
          TALITA
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full border-4 border-tertiary border-t-transparent animate-spin"></div>
          <p className="font-heading text-xl text-primary font-bold animate-pulse">Confirmando seu pedido...</p>
        </div>
      ) : (
        <main className="max-w-2xl mx-auto px-container pt-6 space-y-6">
          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Seu Carrinho</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={`${item.id}-${item.size}-${idx}`} className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-grow">
                    <h3 className="font-heading font-bold text-white">{item.name}</h3>
                    {item.size && <p className="text-on-surface-variant text-sm">Tamanho: {item.size}</p>}
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-heading text-xl text-tertiary font-bold">{formatBRL(item.price)}</span>
                      <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, item.size, -1)} className="text-primary"><Minus className="w-5 h-5"/></button>
                        <span className="font-bold w-4 text-center text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.size, 1)} className="text-primary"><Plus className="w-5 h-5"/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Dados de Entrega</h2>
            <div className="glass-card rounded-xl p-4 space-y-4">
              <input 
                type="text" 
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-surface-container border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all" 
                placeholder="Nome Completo" 
              />
              <input 
                type="text" 
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
                className="w-full bg-surface-container border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all" 
                placeholder="WhatsApp (com DDD)" 
              />
              <textarea 
                value={formData.endereco}
                onChange={e => setFormData({...formData, endereco: e.target.value})}
                className="w-full bg-surface-container border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none resize-none transition-all" 
                placeholder="Endereço Completo (Rua, Nº, Bairro)" 
                rows={3}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Pagamento</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['pix', 'cartao', 'dinheiro'] as const).map(method => (
                <button 
                  key={method}
                  onClick={() => setFormData({...formData, pagamento: method})}
                  className={`glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.pagamento === method ? 'border-primary bg-primary/10 ring-1 ring-primary' : ''}`}
                >
                  <span className="font-mono text-xs text-white uppercase">{method}</span>
                </button>
              ))}
            </div>
            {formData.pagamento === 'dinheiro' && (
              <input 
                type="text" 
                value={formData.trocoPara}
                onChange={e => setFormData({...formData, trocoPara: e.target.value})}
                className="w-full bg-surface-container border-none rounded-lg px-4 py-2 text-white" 
                placeholder="Troco para quanto?" 
              />
            )}
          </section>

          <section className="glass-card rounded-xl p-4 space-y-2 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-sm">Subtotal</span>
              <span className="font-heading font-bold text-white">{formatBRL(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Taxa de Entrega</span>
              <span className="font-heading font-bold text-secondary">{formatBRL(deliveryFee)}</span>
            </div>
            <div className="h-px bg-white/10 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-lg text-white">Total</span>
              <span className="font-heading text-2xl font-bold text-tertiary">{formatBRL(finalTotal)}</span>
            </div>
          </section>
        </main>
      )}

      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 p-container bg-zinc-950/90 backdrop-blur-2xl border-t border-white/5 z-50">
          <button 
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 p-4 rounded-xl font-heading text-xl font-bold text-white shadow-2xl active:scale-95 transition-all"
          >
            FINALIZAR PEDIDO
          </button>
        </div>
      )}
    </div>
  );
}