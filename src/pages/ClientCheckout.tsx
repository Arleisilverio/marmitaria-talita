import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatBRL } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { api } from '../lib/api';
import {
  ArrowLeft, Minus, Plus, QrCode, CreditCard, Banknote, ShoppingBag, X, ShieldCheck, Bike, Store
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { items, total, updateQuantity, clearCart } = useCart();
  
  const [menuConfig, setMenuConfig] = useState<any>(null);
  const [deliveryType, setDeliveryType] = useState<'entrega' | 'retirada'>('entrega');

  const [formData, setFormData] = useState({
    nome: '', telefone: '', endereco: '', pagamento: 'pix', trocoPara: ''
  });
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.getMenu().then(data => {
      setMenuConfig(data);
      if (!data.isDeliveryOpen) {
        setDeliveryType('retirada');
      }
      setLoading(false);
    });

    // Auto-preencher dados se o usuário já tiver perfil salvo
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              nome: data.full_name || prev.nome,
              telefone: data.phone || prev.telefone,
              endereco: data.address || prev.endereco
            }));
          }
        });
      }
    });
  }, []);

  // AGORA BUSCAMOS O VALOR CONFIGURADO PELO ADMIN (DEFAULT: 5)
  const deliveryFeeAmount = menuConfig?.deliveryFee !== undefined ? Number(menuConfig.deliveryFee) : 5.00;
  const deliveryFee = deliveryType === 'entrega' ? deliveryFeeAmount : 0;
  const finalTotal = total + (items.length > 0 ? deliveryFee : 0);

  const handlePreSubmit = async () => {
    if (!formData.nome || !formData.telefone || (deliveryType === 'entrega' && !formData.endereco)) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      processOrder(data.session.user.id);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthAndOrder = async () => {
    if (!authForm.email || !authForm.password || authForm.password.length < 6) {
      toast.error("Insira um email válido e senha (mínimo 6 caracteres).");
      return;
    }
    setProcessing(true);
    try {
      let authData;
      if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
        if (error) throw new Error("Email ou senha incorretos.");
        authData = data;
        toast.success("Login realizado com sucesso!");
      } else {
        const { data, error } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password });
        if (error) throw new Error("Erro ao criar conta. Email já existe ou inválido.");
        authData = data;
        toast.success("Conta criada com sucesso! 🎉");
      }
      
      setShowAuthModal(false);
      if (authData?.user?.id) {
        await processOrder(authData.user.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação.");
      setProcessing(false);
    }
  };

  const processOrder = async (userId: string) => {
    setProcessing(true);
    setShowAuthModal(false);
    
    const finalAddress = deliveryType === 'retirada' ? '📍 RETIRADA NO BALCÃO' : formData.endereco;

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          customer_name: formData.nome,
          customer_phone: formData.telefone,
          delivery_address: finalAddress,
          payment_method: formData.pagamento,
          change_for: formData.trocoPara || null,
          total_amount: finalTotal,
          status: 'pendente',
          items_json: items
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Dispara robô do Telegram
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...order, items_json: items })
      });

      clearCart();
      toast.success("Pedido enviado com sucesso! 🍲");
      navigate('/', { state: { tab: 'orders' } });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar pedido.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (items.length === 0 && !processing) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-heading mb-4 text-white">Seu carrinho está vazio</h2>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-container text-white rounded-full font-bold">Voltar ao Cardápio</button>
        </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 relative">
      {/* MODAL DE AUTENTICAÇÃO */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container border border-orange-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20"><ShieldCheck className="text-white w-8 h-8" /></div>
            <h3 className="font-heading text-2xl font-bold text-white mb-2">Identificação Necessária</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Para sua segurança, precisamos que você se identifique antes de enviar o pedido.</p>
            <div className="space-y-3 mb-6">
              <input type="email" placeholder="Seu e-mail" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-colors"/>
              <input type="password" placeholder="Senha (mín. 6 caracteres)" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-colors"/>
            </div>
            <div className="space-y-3">
              <button onClick={handleAuthAndOrder} disabled={processing} className="w-full bg-gradient-to-r from-red-600 to-orange-500 py-4 rounded-xl font-bold text-white shadow-lg disabled:opacity-50">
                {processing ? 'Aguarde...' : (isLoginMode ? 'ENTRAR E FINALIZAR' : 'CADASTRAR E FINALIZAR')}
              </button>
              <button onClick={() => setIsLoginMode(!isLoginMode)} disabled={processing} className="w-full py-4 rounded-xl font-bold text-zinc-400 hover:text-white transition-colors text-sm">
                {isLoginMode ? 'Não tem conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-between items-center px-4 py-3 w-full">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-orange-600 active:scale-95 duration-200"><ArrowLeft /></button>
          <h1 className="font-heading text-sm font-bold uppercase tracking-widest text-orange-600">FINALIZAR PEDIDO</h1>
        </div>
      </header>

      {processing ? (
        <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          <p className="font-heading text-xl text-orange-500 font-bold animate-pulse">Processando pedido...</p>
        </div>
      ) : (
        <main className="max-w-2xl mx-auto px-container pt-6 space-y-6">
          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Seu Carrinho</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={`${item.id}-${item.size}-${idx}`} className="glass-card rounded-xl p-4 flex items-center gap-4 border border-white/5">
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
            <h2 className="font-heading text-2xl text-primary font-bold">Forma de Recebimento</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeliveryType('entrega')}
                disabled={!menuConfig?.isDeliveryOpen}
                className={`flex-1 py-4 px-2 rounded-xl flex flex-col items-center gap-2 font-bold transition-all border ${deliveryType === 'entrega' ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.2)]' : 'bg-zinc-900 border-white/5 text-zinc-500'} ${!menuConfig?.isDeliveryOpen ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <Bike className="w-6 h-6" />
                <span className="text-xs uppercase tracking-wider">Receber em Casa</span>
                {!menuConfig?.isDeliveryOpen && <span className="text-[9px] text-red-500 font-black bg-red-500/20 px-2 rounded">INDISPONÍVEL HOJE</span>}
              </button>

              <button 
                onClick={() => setDeliveryType('retirada')}
                className={`flex-1 py-4 px-2 rounded-xl flex flex-col items-center gap-2 font-bold transition-all border ${deliveryType === 'retirada' ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.2)]' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
              >
                <Store className="w-6 h-6" />
                <span className="text-xs uppercase tracking-wider">Retirar no Balcão</span>
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Seus Dados</h2>
            <div className="glass-card rounded-xl p-4 space-y-4 border border-white/5">
              <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-zinc-900 border border-transparent rounded-lg p-4 text-white focus:border-orange-500/50 outline-none transition-all" placeholder="Seu Nome Completo" />
              <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-zinc-900 border border-transparent rounded-lg p-4 text-white focus:border-orange-500/50 outline-none transition-all" placeholder="Seu WhatsApp (com DDD)" />
              
              {deliveryType === 'entrega' && (
                <textarea value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-zinc-900 border border-transparent rounded-lg p-4 text-white focus:border-orange-500/50 outline-none resize-none transition-all" placeholder="Endereço Completo de Entrega (Rua, Nº, Bairro e Referência)" rows={3} />
              )}
              {deliveryType === 'retirada' && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-blue-400 text-sm flex items-center gap-3">
                  <Store className="w-5 h-5 flex-shrink-0" />
                  <p>Você escolheu <b>Retirar no Balcão</b>. Não precisa preencher o endereço. Lembre-se de verificar o status do pedido antes de vir buscar!</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Pagamento na {deliveryType === 'entrega' ? 'Entrega' : 'Retirada'}</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['pix', 'cartao', 'dinheiro'] as const).map(method => (
                <button key={method} onClick={() => setFormData({...formData, pagamento: method})} className={`glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.pagamento === method ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500' : 'border border-white/5'}`}>
                  {method === 'pix' && <QrCode className={formData.pagamento === 'pix' ? 'text-orange-500' : 'text-zinc-500'} />}
                  {method === 'cartao' && <CreditCard className={formData.pagamento === 'cartao' ? 'text-orange-500' : 'text-zinc-500'} />}
                  {method === 'dinheiro' && <Banknote className={formData.pagamento === 'dinheiro' ? 'text-orange-500' : 'text-zinc-500'} />}
                  <span className={`font-mono text-xs uppercase font-bold ${formData.pagamento === method ? 'text-white' : 'text-zinc-500'}`}>{method}</span>
                </button>
              ))}
            </div>
            {formData.pagamento === 'dinheiro' && (
              <input type="text" value={formData.trocoPara} onChange={e => setFormData({...formData, trocoPara: e.target.value})} className="w-full bg-zinc-900 border border-white/5 focus:border-orange-500/50 rounded-lg p-4 text-white outline-none" placeholder="Precisa de troco para quanto? (Ex: 50 reais)" />
            )}
          </section>

          <section className="glass-card rounded-xl p-6 space-y-3 mb-8 border border-white/5">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-sm">Subtotal</span>
              <span className="font-heading">{formatBRL(total)}</span>
            </div>
            {deliveryType === 'entrega' ? (
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm">Taxa de Entrega</span>
                <span className="font-heading text-secondary">{formatBRL(deliveryFee)}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-green-500">
                <span className="text-sm font-bold">Taxa de Entrega</span>
                <span className="font-heading font-bold uppercase text-xs">Grátis (Retirada)</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-4"></div>
            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-lg text-white">Total a pagar</span>
              <span className="font-heading text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">{formatBRL(finalTotal)}</span>
            </div>
          </section>
        </main>
      )}

      {!processing && !showAuthModal && (
        <div className="fixed bottom-0 left-0 right-0 p-container bg-zinc-950/90 backdrop-blur-2xl border-t border-white/5 z-50">
          <button onClick={handlePreSubmit} className="w-full bg-gradient-to-r from-red-600 to-orange-500 p-4 rounded-xl font-heading text-xl font-black text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2">
            FINALIZAR PEDIDO
          </button>
        </div>
      )}
    </div>
  );
}