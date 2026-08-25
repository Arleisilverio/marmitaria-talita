import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, AlertTriangle, CheckCircle, Clock, ShieldAlert, Ban } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface OrderMessage {
  id: string;
  order_id: string;
  sender_type: 'client' | 'store' | 'courier' | 'system';
  sender_name: string;
  message: string;
  created_at: string;
}

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  senderType: 'client' | 'store' | 'courier';
  senderName: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function OrderChatModal({
  isOpen,
  onClose,
  order,
  senderType,
  senderName,
  onStatusChange
}: OrderChatModalProps) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>(order?.status || 'pendente');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !order?.id) return;
    setOrderStatus(order.status);
    fetchMessages();

    // Polling a cada 3 segundos para novas mensagens
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, order?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!order?.id) return;
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      if (error) {
        // Se a tabela ainda não existir no Supabase, silencia o erro
        return;
      }
      if (data) setMessages(data);
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !order?.id || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { error } = await supabase.from('order_messages').insert({
        order_id: order.id,
        sender_type: senderType,
        sender_name: senderName || (senderType === 'store' ? 'Lojista' : 'Cliente'),
        message: text
      });

      if (error) throw error;
      fetchMessages();
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.id) return;
    const confirmCancel = window.confirm("Deseja realmente cancelar este pedido? Esta ação atualizará o status para CANCELADO.");
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      // 1. Atualizar status na tabela orders
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ status: 'cancelado' })
        .eq('id', order.id);

      if (updateErr) throw updateErr;

      // 2. Registrar mensagem de sistema no chat
      const cancelAuthor = senderType === 'store' ? 'Lojista' : 'Cliente';
      await supabase.from('order_messages').insert({
        order_id: order.id,
        sender_type: 'system',
        sender_name: 'Sistema',
        message: `🚫 Pedido cancelado pelo ${cancelAuthor}.`
      });

      setOrderStatus('cancelado');
      toast.success("Pedido cancelado com sucesso.");
      if (onStatusChange) onStatusChange('cancelado');
      fetchMessages();
    } catch (err: any) {
      toast.error("Erro ao cancelar pedido.");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen || !order) return null;

  const isCancelled = orderStatus === 'cancelado';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg h-[85vh] max-h-[680px] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* HEADER DO CHAT */}
          <div className="p-4 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-white text-base">
                    Chat do Pedido #{order.id.slice(0, 5).toUpperCase()}
                  </h3>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    orderStatus === 'cancelado' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    orderStatus === 'entregue' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {orderStatus}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {senderType === 'store' ? `Cliente: ${order.customer_name || 'Anônimo'}` : `Falando com o Lojista`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isCancelled && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  title="Cancelar Pedido"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ÁREA DE MENSAGENS */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-zinc-950/60">
            {/* Mensagem Inicial do Pedido */}
            <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl text-center max-w-xs mx-auto">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Este é o canal direto de comunicação deste pedido. Combine detalhes de entrega, alterações ou cancelamentos.
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-xs">
                Nenhuma mensagem enviada ainda. Inicie a conversa abaixo.
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender_type === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{msg.message}</span>
                      </div>
                    </div>
                  );
                }

                const isMe = msg.sender_type === senderType;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-zinc-500 mb-0.5 px-1 font-mono">
                      {isMe ? 'Você' : msg.sender_name} • {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-zinc-800 text-zinc-100 border border-white/5 rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* BARRA DE ENVIO DE MENSAGEM */}
          <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900/80 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isCancelled ? "Pedido cancelado." : "Digite uma mensagem sobre o pedido..."}
              disabled={isCancelled || sending}
              className="flex-grow bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs outline-none focus:border-primary disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isCancelled || sending}
              className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
