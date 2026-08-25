import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface OrderChatButtonProps {
  orderId: string;
  senderType: 'client' | 'store' | 'courier';
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function OrderChatButton({
  orderId,
  senderType,
  onClick,
  label = 'Chat do Pedido',
  className = ''
}: OrderChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!orderId) return;

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 3000);

    return () => clearInterval(interval);
  }, [orderId, senderType]);

  const checkUnreadMessages = async () => {
    try {
      // Buscar mensagens que não foram enviadas pelo usuário atual
      const { data, error } = await supabase
        .from('order_messages')
        .select('id, created_at, sender_type')
        .eq('order_id', orderId);

      if (error || !data) return;

      const otherMessages = data.filter(m => m.sender_type !== senderType);
      if (otherMessages.length === 0) {
        setUnreadCount(0);
        return;
      }

      const storageKey = `chat_last_read_${senderType}_${orderId}`;
      const lastReadTime = localStorage.getItem(storageKey) || '1970-01-01T00:00:00.000Z';

      const unread = otherMessages.filter(m => new Date(m.created_at) > new Date(lastReadTime));
      setUnreadCount(unread.length);
    } catch (err) {
      // ignore
    }
  };

  const handleClick = () => {
    const storageKey = `chat_last_read_${senderType}_${orderId}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    setUnreadCount(0);
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 border ${
        unreadCount > 0
          ? 'bg-red-500/10 border-red-500/40 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:bg-red-500/20'
          : 'bg-zinc-800 hover:bg-zinc-700/80 border-white/10 text-white'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <MessageSquare className={`w-4 h-4 ${unreadCount > 0 ? 'text-red-400' : 'text-primary'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_#ef4444]" />
        )}
      </div>

      <span>{label}</span>

      {unreadCount > 0 && (
        <span className="ml-auto bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_#ef4444,0_0_4px_#ef4444] border border-red-400 tracking-wider">
          {unreadCount} {unreadCount === 1 ? 'NOVA' : 'NOVAS'}
        </span>
      )}
    </button>
  );
}
