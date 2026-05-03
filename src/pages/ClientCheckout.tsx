import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatBRL } from '../lib/utils';
import { api } from '../lib/api';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  QrCode, 
  CreditCard, 
  Banknote,
  ShoppingBag,
  RefreshCcw 
} from 'lucide-react';

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
      alert("Por favor, preencha todos os campos de entrega.");
      return;
    }
    setLoading(true);
    try {
      await api.createOrder({
        cliente_nome: formData.nome,
        telefone: formData.telefone,
        endereco: formData.endereco,
        pagamento: formData.pagamento,
        trocoPara: formData.trocoPara,
        itens: items,
        total: finalTotal
      });
      clearCart();
      alert("Pedido enviado com sucesso! Acompanhe pelo seu WhatsApp.");
      navigate('/');
    } catch (err) {
      alert("Erro ao enviar pedido.");
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
      {/* Header */}
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
          <p className="font-heading text-xl text-primary">Enviando seu pedido para a Talita...</p>
        </div>
      ) : (
        <main className="max-w-2xl mx-auto px-container pt-6 space-y-6">
          {/* Cart Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl text-primary font-bold">Seu Carrinho</h2>
              <span className="font-mono text-xs px-2 py-1 bg-primary/10 border border-primary/20 rounded text-primary uppercase">
                {items.length} itens
              </span>
            </div>
            
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

          {/* Delivery Info */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Dados de Entrega</h2>
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-xs text-on-surface-variant uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-surface-container border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all" 
                  placeholder="Como devemos te chamar?" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-xs text-on-surface-variant uppercase">Telefone (WhatsApp)</label>
                <input 
                  type="text" 
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="w-full bg-surface-container border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all" 
                  placeholder="(00) 00000-0000" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-xs text-on-surface-variant uppercase">Endereço de Entrega</label>
                <textarea 
                  value={formData.endereco}
                  onChange={e => setFormData({...formData, endereco: e.target.value})}
                  className="w-full bg-surface-container border-none rounded-lg p-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none resize-none transition-all" 
                  placeholder="Rua, número, complemento..." 
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-primary font-bold">Forma de Pagamento</h2>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setFormData({...formData, pagamento: 'pix'})}
                className={`glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.pagamento === 'pix' ? 'border-primary bg-primary/10 ring-1 ring-primary neon-glow-primary' : 'hover:border-primary/50'}`}
              >
                <QrCode className={formData.pagamento === 'pix' ? 'text-primary' : 'text-zinc-400'} />
                <span className="font-mono text-xs uppercase text-white">PIX</span>
              </button>
              <button 
                onClick={() => setFormData({...formData, pagamento: 'cartao'})}
                className={`glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.pagamento === 'cartao' ? 'border-primary bg-primary/10 ring-1 ring-primary neon-glow-primary' : 'hover:border-primary/50'}`}
              >
                <CreditCard className={formData.pagamento === 'cartao' ? 'text-primary' : 'text-zinc-400'} />
                <span className="font-mono text-xs uppercase text-white">CARTÃO</span>
              </button>
              <button 
                onClick={() => setFormData({...formData, pagamento: 'dinheiro'})}
                className={`glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.pagamento === 'dinheiro' ? 'border-primary bg-primary/10 ring-1 ring-primary neon-glow-primary' : 'hover:border-primary/50'}`}
              >
                <Banknote className={formData.pagamento === 'dinheiro' ? 'text-primary' : 'text-zinc-400'} />
                <span className="font-mono text-xs uppercase text-white">DINHEIRO</span>
              </button>
            </div>

            {formData.pagamento === 'dinheiro' && (
              <div className="glass-card rounded-xl p-4 mt-2 border-l-4 border-tertiary">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="text-tertiary w-5 h-5" />
                    <span className="text-sm font-bold text-white">Precisa de troco?</span>
                  </div>
                  <input 
                    type="text" 
                    value={formData.trocoPara}
                    onChange={e => setFormData({...formData, trocoPara: e.target.value})}
                    className="bg-surface-container border-none rounded-lg px-4 py-2 text-on-surface focus:ring-1 focus:ring-tertiary outline-none w-32 text-right" 
                    placeholder="Troco para..." 
                  />
                </div>
              </div>
            )}
          </section>

          {/* Summary */}
          <section className="glass-card rounded-xl p-4 space-y-2 mb-8">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span className="text-sm">Subtotal</span>
              <span className="font-heading font-bold text-white">{formatBRL(total)}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span className="text-sm">Taxa de Entrega</span>
              <span className="font-heading font-bold text-secondary">{formatBRL(deliveryFee)}</span>
            </div>
            <div className="h-px bg-white/10 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-lg text-white">Total do Pedido</span>
              <span className="font-heading text-2xl font-bold text-tertiary drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                {formatBRL(finalTotal)}
              </span>
            </div>
          </section>
        </main>
      )}

      {/* Bottom Action Bar */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 p-container bg-zinc-950/90 backdrop-blur-2xl border-t border-white/5 z-50">
          <button 
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 p-4 rounded-xl font-heading text-xl font-bold text-white neon-glow-btn active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            <ShoppingBag className="w-6 h-6" />
            FINALIZAR PEDIDO
          </button>
          <div className="text-center mt-2 pb-2">
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
               Pedido será enviado via WhatsApp & Telegram
             </p>
             <p className="text-[9px] text-zinc-600 mt-1 uppercase">Aviso de Privacidade: Seus dados serão usados apenas para entrega local (LGPD).</p>
          </div>
        </div>
      )}
    </div>
  );
}
