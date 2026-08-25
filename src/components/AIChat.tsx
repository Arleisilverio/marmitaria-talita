"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, X, Send, Bot, Sparkles, ShoppingBag, 
  ArrowRight, CheckCircle, MapPin, CreditCard, User, 
  AlertCircle, UtensilsCrossed, Loader2, Phone, ExternalLink, Receipt
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../integrations/supabase/client';
import { formatBRL, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  size?: 'p' | 'm' | 'g';
  notes?: string;
}

interface ParsedOrder {
  items: OrderItem[];
  payment_method: 'pix' | 'cartao_entrega' | 'dinheiro';
  delivery_type?: 'entrega' | 'retirada';
  change_for?: string;
}

// Limpa completamente qualquer resquício de tags de sistema ou blocos técnicos da IA
export function sanitizeAiText(text: string): string {
  if (!text) return '';
  let clean = text;

  // 1. Remove blocos delimitados exclusivos <<<PEDIDO_JSON ... PEDIDO_JSON>>>
  clean = clean.replace(/<<<PEDIDO_JSON[\s\S]*?PEDIDO_JSON>>>/gi, '');
  clean = clean.replace(/<<<PEDIDO_PRONTO[\s\S]*?PEDIDO_PRONTO>>>/gi, '');

  // 2. Remove blocos com a tag legada [PEDIDO_PRONTO: cortando tudo a partir dela
  clean = clean.replace(/\[PEDIDO_PRONTO:[\s\S]*/gi, '');

  // 3. Remove blocos de código markdown json
  clean = clean.replace(/```(?:json)?[\s\S]*?```/gi, '');

  // 4. Remove fragmentos soltos de JSON residual que possam ter sobrado
  clean = clean.replace(/,?\s*"payment_method"\s*:\s*"[^"]*"\s*,?\s*"delivery_type"\s*:\s*"[^"]*"\s*\}?\]?/gi, '');
  clean = clean.replace(/\{?\s*"items"\s*:\s*\[[\s\S]*?\]\s*,?\s*"payment_method"[\s\S]*?\}?\]?/gi, '');
  clean = clean.replace(/,?\s*"delivery_type"\s*:\s*"[^"]*"\s*\}?\]?/gi, '');

  return clean.trim();
}

// Extrai o objeto de pedido com máxima tolerância a formatação
export function extractOrderJson(text: string): ParsedOrder | null {
  if (!text) return null;
  
  // 1. Tenta extrair primeiro da tag exclusiva <<<PEDIDO_JSON ... PEDIDO_JSON>>>
  const exclusiveMatch = text.match(/<<<PEDIDO_JSON([\s\S]*?)PEDIDO_JSON>>>/i);
  if (exclusiveMatch) {
    try {
      const parsed = JSON.parse(exclusiveMatch[1].trim());
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Erro no parse de <<<PEDIDO_JSON>>>:", e);
    }
  }

  // 2. Tenta extrair de [PEDIDO_PRONTO: { ... }] pegando do primeiro { até o último }
  const legacyMatch = text.match(/\[PEDIDO_PRONTO:\s*(\{[\s\S]*\})\s*\]?/i);
  if (legacyMatch) {
    try {
      const parsed = JSON.parse(legacyMatch[1].trim());
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Erro no parse legado:", e);
    }
  }

  // 3. Fallback genérico para qualquer JSON com items e payment_method
  const genericMatch = text.match(/\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?"payment_method"[\s\S]*?\}/i);
  if (genericMatch) {
    try {
      const parsed = JSON.parse(genericMatch[0].trim());
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  return null;
}

export default function AIChat({ menuContext, storeName }: { menuContext: any; storeName?: string }) {
  const navigate = useNavigate();
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { items: cartItems, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const effectiveSlug = slug || menuContext?.store_slug || 'da-quebrada';
  const isEnabled = menuContext?.ai_config?.enabled !== false;
  const botName = menuContext?.ai_config?.botName?.trim() || 'Garçom Virtual';
  const effectiveStoreName = storeName || menuContext?.title || 'Loja';
  
  const defaultWelcome = menuContext?.ai_config?.welcomeMessage?.trim() || 
    `Olá! Sou o ${botName} da ${effectiveStoreName}. Posso te sugerir os melhores pratos ou ajudar a montar o seu pedido hoje? 🍲`;

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: defaultWelcome }
  ]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [createdOrders, setCreatedOrders] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carrega usuário autenticado e perfil cadastrado
  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const profile = await api.getProfile(user.id);
        setUserProfile(profile);
      }
    } catch (e) {
      console.warn("Erro ao carregar perfil:", e);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [isOpen]);

  // Se o cardápio mudar ou o nome do bot for alterado, atualiza a saudação inicial se for a única mensagem
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: defaultWelcome }]);
    }
  }, [defaultWelcome]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, createdOrders]);

  if (!isEnabled) {
    return null;
  }

  // Função para salvar o pedido automaticamente no banco e notificar lojista e cliente
  const autoCreateOrderInDatabase = async (parsedOrder: ParsedOrder) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let profile = userProfile;
      if (user && !profile) {
        profile = await api.getProfile(user.id);
        setUserProfile(profile);
      }

      const itemsTotal = parsedOrder.items.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 
        0
      );
      const deliveryFee = parsedOrder.delivery_type === 'retirada' ? 0 : Number(menuContext?.deliveryFee || 0);
      const finalTotal = itemsTotal + deliveryFee;

      const formattedItems = parsedOrder.items.map((it, idx) => ({
        id: it.id || `ai_${idx}_${Date.now()}`,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        size: it.size || undefined,
        notes: it.notes || ''
      }));

      const customerName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Cliente (Garçom IA)');
      const customerPhone = profile?.phone || '(Não informado)';
      const customerAddress = parsedOrder.delivery_type === 'retirada' 
        ? 'RETIRADA' 
        : (profile?.address || 'Endereço cadastrado no App');

      // 1. Grava diretamente na tabela orders do Supabase
      const { data: createdOrder, error } = await supabase.from('orders').insert({
        user_id: user?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: customerAddress,
        payment_method: parsedOrder.payment_method || 'cartao_entrega',
        total_amount: finalTotal,
        status: 'pendente',
        items_json: formattedItems,
        store_slug: effectiveSlug
      }).select().single();

      if (error) {
        console.error("Erro ao salvar pedido automático:", error);
        throw error;
      }

      // 2. Invalida cache para o lojista e o cliente verem na hora
      queryClient.invalidateQueries({ queryKey: ['orders', effectiveSlug] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['myOrders', user.id] });
      }

      setCreatedOrders(prev => [...prev, createdOrder]);
      clearCart();
      toast.success("Pedido enviado para a cozinha com sucesso! 🍲", { duration: 5000 });

      return createdOrder;
    } catch (err: any) {
      console.error("Erro no autoCreateOrder:", err);
      toast.error("Erro ao registrar pedido no lojista: " + (err.message || 'Tente novamente'));
      return null;
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || message).trim();
    if (!textToSend || loading) return;

    setMessage('');
    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Envia histórico completo da conversa (multi-turn) + contexto da loja
      const data = await api.processAI({
        messages: newMessages,
        context: menuContext,
        storeName: effectiveStoreName,
        aiConfig: menuContext?.ai_config
      });

      if (data?.reply) {
        const rawReply = data.reply;
        
        // 1. Extrai o pedido se houver
        const parsedOrder = extractOrderJson(rawReply);
        let createdOrder = null;

        // 2. Limpa completamente a mensagem visível (nunca mostra tags de sistema no chat)
        const cleanVisibleReply = sanitizeAiText(rawReply);

        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: cleanVisibleReply || 'Entendido! Seu pedido foi montado com sucesso.' 
          }
        ]);

        // 3. SE O PEDIDO ESTIVER COMPLETO, GRAVA AUTOMATICAMENTE NA TABELA ORDERS
        if (parsedOrder) {
          createdOrder = await autoCreateOrderInDatabase(parsedOrder);
          if (createdOrder) {
            const paymentLabel = parsedOrder.payment_method === 'pix' ? 'PIX' : 
                                 parsedOrder.payment_method === 'cartao_entrega' ? 'Cartão na Entrega' : 'Dinheiro';

            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: `✅ PEDIDO ENVIADO PARA A COZINHA!\n\n📋 Pedido #${createdOrder.id.slice(0, 8).toUpperCase()}\n💰 Total: ${formatBRL(createdOrder.total_amount)}\n💳 Pagamento: ${paymentLabel}\n📍 Entrega: ${createdOrder.delivery_address}\n\nO lojista já recebeu o pedido no painel e já está preparando. Você pode acompanhar o status na aba "Pedidos"!`
              }
            ]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um probleminha para processar. Pode repetir?' }]);
      }
    } catch (err: any) {
      console.error("Erro no chat IA:", err);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: 'Ops! Meu sistema de atendimento está descansando um pouco. Você pode pedir direto pelo cardápio!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    "O que você me sugere?",
    "Quais as opções de carnes?",
    "Quais bebidas vocês têm?",
    "Qual o valor da entrega?"
  ];

  return (
    <>
      {/* Botão Flutuante */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-orange-600 via-primary to-orange-500 text-white px-4 py-3 rounded-full shadow-2xl border border-white/20 hover:shadow-orange-500/30 transition-all group"
        aria-label="Abrir Garçom IA"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-zinc-950 rounded-full"></span>
        </div>
        <div className="text-left pr-1 hidden sm:block">
          <p className="text-[11px] font-black uppercase tracking-wider leading-none text-white">{botName}</p>
          <p className="text-[9px] text-white/80 font-medium">Garçom Virtual • Online</p>
        </div>
      </motion.button>

      {/* Janela de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 left-4 md:left-auto md:right-8 md:bottom-24 md:w-[420px] h-[580px] max-h-[85vh] bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Cabeçalho */}
            <div className="bg-zinc-900/90 p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-primary">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-white text-sm leading-tight">{botName}</h3>
                    <span className="bg-primary/20 text-primary text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                      GPT-4o Mini
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Garçom da loja {effectiveStoreName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-3.5 scroll-smooth">
              {messages.map((msg, i) => {
                const cleanContent = sanitizeAiText(msg.content);
                if (!cleanContent) return null;

                const isConfirmation = msg.content.includes("PEDIDO ENVIADO") || msg.content.includes("Pedido #");

                return (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-primary flex items-center justify-center mr-2 shrink-0 self-end mb-0.5 border border-orange-500/20">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[84%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-br-sm shadow-md' 
                        : isConfirmation
                        ? 'bg-green-950/70 border border-green-500/30 text-green-100 rounded-bl-sm shadow-xl'
                        : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-bl-sm shadow-md whitespace-pre-wrap'
                    }`}>
                      {cleanContent}
                    </div>
                  </div>
                );
              })}

              {/* CARD DE SUCESSO SE HOUVE PEDIDO CRIADO */}
              {createdOrders.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-2 text-center mt-2">
                  <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xs uppercase">
                    <CheckCircle className="w-4 h-4" />
                    <span>Pedido Confirmado com Sucesso</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    O restaurante já foi notificado e você pode acompanhar na aba Pedidos.
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/${effectiveSlug}`, { state: { tab: 'orders' } });
                    }}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                  >
                    <Receipt className="w-4 h-4" /> Ver em Meus Pedidos
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-primary">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <span className="font-mono text-[11px] animate-pulse">{botName} está digitando...</span>
                </div>
              )}
            </div>

            {/* Chips de Ação Rápida */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    disabled={loading}
                    className="whitespace-nowrap text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-3 py-1.5 rounded-full transition-colors active:scale-95 shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Atalho para o Carrinho se houver itens manuais no carrinho */}
            {cartItems.length > 0 && (
              <div className="px-4 py-2 bg-zinc-900/50 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>{cartItems.length} item(s) no carrinho</span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/checkout');
                  }}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Ir ao Checkout <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input de Mensagem */}
            <div className="p-3.5 bg-zinc-900 border-t border-white/10">
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-black/50 rounded-2xl px-4 py-2 border border-white/10 focus-within:border-primary/50 transition-colors"
              >
                <input 
                  type="text" 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Fale com o ${botName}...`}
                  className="flex-grow bg-transparent border-none text-white text-xs sm:text-sm outline-none placeholder:text-zinc-500"
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-primary text-white disabled:opacity-40 disabled:hover:bg-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
