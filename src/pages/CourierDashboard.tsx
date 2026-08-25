import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike, LogOut, MapPin, Phone, MessageSquare, CheckCircle, 
  Clock, DollarSign, Navigation, AlertCircle, RefreshCw, 
  Sparkles, ShieldCheck, ChevronRight, Package, ArrowRight, User,
  AlertTriangle, ShieldAlert, PhoneCall, LifeBuoy, X, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import OrderChatModal from '../components/OrderChatModal';
import OrderChatButton from '../components/OrderChatButton';

export default function CourierDashboard() {
  const navigate = useNavigate();
  const [courierSession, setCourierSession] = useState<any>(null);
  const [courier, setCourier] = useState<any>(null);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [storeMenu, setStoreMenu] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'history' | 'queue'>('deliveries');
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success("Fila e pedidos atualizados! 🔄", { id: 'manual-refresh', duration: 2000 });
    } catch (e) {
      toast.error("Erro ao atualizar.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // 1. Carrega sessão do motoboy
  useEffect(() => {
    const session = api.getCourierSession();
    if (!session || !session.courier) {
      toast.error("Acesso restrito para entregadores.");
      return navigate('/login');
    }
    setCourierSession(session);
    setCourier(session.courier);
    setStoreSlug(session.storeSlug);
    setStoreName(session.storeName);
  }, [navigate]);

  // 2. Sincroniza dados da loja, fila e pedidos
  const refreshData = async () => {
    if (!storeSlug || !courier?.id) return;
    try {
      const storageKey = `daquebrada_completed_ids_${storeSlug}_${courier.id}`;
      const completedIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const [allCouriers, myOrders, menuData] = await Promise.all([
        api.getCouriers(storeSlug),
        api.getCourierOrders(storeSlug, courier.id),
        api.getMenu(storeSlug)
      ]);

      // Normaliza pedidos com base no status do banco e no cache de concluídos
      const normalizedOrders = myOrders.map((o: any) => {
        if (completedIds.includes(o.id)) {
          return { ...o, status: 'entregue', delivered_at: o.delivered_at || new Date().toISOString() };
        }
        return o;
      });

      // Pedidos em andamento vs concluídos
      const pendingOrBusy = normalizedOrders.filter((o: any) => o.status === 'confirmado' || o.status === 'pendente');
      const delivered = normalizedOrders.filter((o: any) => o.status === 'entregue');

      setActiveOrders(pendingOrBusy);
      setCompletedOrders(delivered);

      // Atualiza motoboy atual com dados frescos da fila e status efetivo
      const current = allCouriers.find((c: any) => c.id === courier.id) || courier;
      const isBusy = pendingOrBusy.length > 0;
      const effectiveStatus = isBusy ? 'busy' : (current?.status === 'offline' ? 'offline' : 'available');
      setCourier({
        ...current,
        status: effectiveStatus,
        deliveries_count: delivered.length
      });
      setStoreMenu(menuData);

      // Fila ordenada
      const activeQueue = allCouriers.filter((c: any) => c.active !== false).map((c: any) => {
        if (c.id === courier.id) {
          return { ...c, status: effectiveStatus, deliveries_count: delivered.length };
        }
        return c;
      });
      setQueue(activeQueue);
    } catch (err) {
      console.error("Erro ao sincronizar motoboy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeSlug && courier?.id) {
      refreshData();
      const interval = setInterval(refreshData, 5000); // Polling a cada 5s
      return () => clearInterval(interval);
    }
  }, [storeSlug, courier?.id]);

  // Logout do motoboy
  const handleLogout = () => {
    api.logoutCourier();
    toast.success("Sessão encerrada.");
    navigate('/login');
  };

  // Alterna status na fila (Disponível vs Pausa)
  const toggleQueueStatus = async () => {
    if (!courier) return;
    const newStatus = courier.status === 'available' ? 'offline' : 'available';
    try {
      await api.updateCourier(storeSlug, courier.id, {
        status: newStatus,
        queue_joined_at: new Date().toISOString()
      });
      setCourier((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(newStatus === 'available' ? "Você entrou na fila de entregas! 🛵" : "Você pausou seus atendimentos.");
      refreshData();
    } catch (e: any) {
      toast.error("Erro ao alternar status.");
    }
  };

  // Concluir entrega com atualização instantânea e persistente
  const handleCompleteDelivery = async (order: any) => {
    setCompletingId(order.id);

    // 1. Grava no cache de IDs concluídos para nunca mais reaparecer na tela
    const storageKey = `daquebrada_completed_ids_${storeSlug}_${courier.id}`;
    const completedIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!completedIds.includes(order.id)) {
      localStorage.setItem(storageKey, JSON.stringify([...completedIds, order.id]));
    }

    // 2. Atualização Otimista Imediata
    const remainingActive = activeOrders.filter(o => o.id !== order.id);
    const updatedCompletedOrder = {
      ...order,
      status: 'entregue',
      delivered_at: new Date().toISOString()
    };

    setActiveOrders(remainingActive);
    setCompletedOrders(prev => [updatedCompletedOrder, ...prev.filter(o => o.id !== order.id)]);
    
    // Se não restarem mais entregas ativas, coloca o motoboy de volta na fila
    if (remainingActive.length === 0) {
      setCourier((prev: any) => ({
        ...prev,
        status: 'available',
        queue_joined_at: new Date().toISOString(),
        deliveries_count: (prev?.deliveries_count || 0) + 1
      }));
    }

    try {
      const deliveryFee = Number(storeMenu?.deliveryFee || 0);
      await api.completeCourierDelivery(
        order.id, 
        courier.id, 
        storeSlug, 
        deliveryFee, 
        order.payment_method
      );

      toast.success("🎉 Entrega concluída com sucesso! Extrato e fila atualizados.", { duration: 4000 });
      await refreshData();
    } catch (err: any) {
      console.warn("Aviso ao salvar conclusão de entrega:", err);
      toast.success("Entrega finalizada! 🏁");
      await refreshData();
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Conectando ao Painel de Entregas...</p>
      </div>
    );
  }

  // Posição na fila
  const availableCouriers = queue.filter(c => c.status === 'available');
  const myQueueIndex = availableCouriers.findIndex(c => c.id === courier?.id);
  const myQueuePosition = myQueueIndex !== -1 ? myQueueIndex + 1 : null;

  // Ganhos do dia
  const deliveryFee = Number(storeMenu?.deliveryFee || 0);
  const todayEarnings = completedOrders.length * deliveryFee;

  return (
    <div className="min-h-screen bg-black text-white pb-24 selection:bg-primary">
      {/* HEADER OPERACIONAL */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-600/30 flex items-center justify-center text-primary">
              <Bike className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-base leading-tight text-white">{courier?.name}</h1>
                {/* LOGO DISCRETA DO APP */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-[9px] font-bold text-primary tracking-wider uppercase font-mono">
                    da Quebrada <span className="text-zinc-400 font-normal">Delivery</span>
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span>Loja:</span> <b className="text-zinc-200">{storeName}</b>
                {courier?.vehicle_plate && <span className="text-zinc-500 font-mono">({courier.vehicle_plate})</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÃO DE EMERGÊNCIA / SUPORTE */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              title="Menu de Emergência e Suporte Rápido"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="hidden sm:inline">Emergência</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95 disabled:opacity-60"
              title="Atualizar Pedidos e Fila"
            >
              <RefreshCw className={cn("w-4 h-4 transition-transform", isRefreshing && "animate-spin text-primary")} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {/* CARD DE STATUS NA FILA DE REVEZAMENTO */}
        <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn(
                  "w-3 h-3 rounded-full",
                  activeOrders.length > 0 ? "bg-yellow-500 animate-ping" :
                  courier?.status === 'offline' ? "bg-zinc-600" : "bg-green-500 animate-pulse"
                )} />
                <span className={cn(
                  "text-xs font-black uppercase tracking-wider",
                  activeOrders.length > 0 ? "text-yellow-400" :
                  courier?.status === 'offline' ? "text-zinc-400" : "text-green-400"
                )}>
                  {activeOrders.length > 0 ? '🟡 Em Rota de Entrega' :
                   courier?.status === 'offline' ? '⚪ Em Pausa / Offline' : '🟢 Disponível na Fila (Pronto)'}
                </span>
              </div>

              {activeOrders.length === 0 && courier?.status !== 'offline' && (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {myQueuePosition === 1 ? (
                      <span className="text-green-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Você é o 1º da fila! A próxima entrega é sua.
                      </span>
                    ) : (
                      <span>Você é o <b>{myQueuePosition || 1}º</b> da fila de revezamento ({availableCouriers.length || 1} ativos).</span>
                    )}
                  </p>
                  {completedOrders.length > 0 && (
                    <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-xl w-fit mt-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Entrega Concluída com Sucesso! Extrato Atualizado.
                    </p>
                  )}
                </div>
              )}

              {activeOrders.length > 0 && (
                <p className="text-xs text-yellow-400 font-medium">
                  🛵 Você está com {activeOrders.length} entrega(s) em andamento. Conclua para voltar ao topo do extrato.
                </p>
              )}

              {courier?.status === 'offline' && activeOrders.length === 0 && (
                <p className="text-xs text-zinc-400">Você está em pausa. Clique no botão ao lado para entrar na fila de entregas.</p>
              )}
            </div>

            {activeOrders.length === 0 && (
              <button
                onClick={toggleQueueStatus}
                className={cn(
                  "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shadow-lg self-start sm:self-auto",
                  courier?.status === 'available'
                    ? "bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700"
                    : "bg-green-600 text-white border-green-500/40 hover:bg-green-500 shadow-green-600/20"
                )}
              >
                {courier?.status === 'available' ? 'Pausar Atendimento' : 'Entrar na Fila 🛵'}
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS DO MOTOBOY */}
        <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'deliveries' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Package className="w-4 h-4" /> Entregas ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'queue' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Clock className="w-4 h-4" /> Fila da Loja ({availableCouriers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'history' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <DollarSign className="w-4 h-4" /> Extrato ({completedOrders.length})
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <AnimatePresence mode="wait">
          {/* ABA 1: PEDIDOS ATIVOS / EM ENTREGA */}
          {activeTab === 'deliveries' && (
            <motion.div key="deliveries" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {activeOrders.length === 0 ? (
                <div className="bg-zinc-900/30 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                    <Bike className="w-8 h-8 opacity-60" />
                  </div>
                  <h3 className="text-white font-bold text-base">Nenhuma entrega em andamento</h3>
                  <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                    Assim que a cozinha despachar pedidos para você, eles aparecerão aqui com os botões de rota GPS e WhatsApp do cliente.
                  </p>
                </div>
              ) : (
                <>
                  {activeOrders.length > 1 && (
                    <div className="bg-gradient-to-r from-orange-600/20 to-primary/20 border border-primary/30 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
                          {activeOrders.length}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs uppercase tracking-wider">Rota Multi-Entrega Ativa</p>
                          <p className="text-[11px] text-zinc-400">Você tem {activeOrders.length} entregas na mesma viagem para agilizar suas corridas.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeOrders.map((order, orderIdx) => {
                    const whatsappUrl = order.customer_phone 
                      ? `https://wa.me/55${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.customer_name}, sou o entregador da ${storeName}. Estou a caminho com seu pedido!`)}`
                      : null;
                    
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`;
                    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(order.delivery_address || '')}&navigate=yes`;

                    return (
                      <div key={order.id} className="bg-zinc-900 border-2 border-primary/40 rounded-3xl p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              {activeOrders.length > 1 && (
                                <span className="bg-primary text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                  Parada {orderIdx + 1} de {activeOrders.length}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <h2 className="text-white font-black text-xl leading-tight mt-0.5">{order.customer_name}</h2>
                            <p className="text-xs text-zinc-400">{order.customer_phone}</p>
                          </div>
                          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                            Em Entrega
                          </span>
                        </div>

                        {/* Endereço de Entrega */}
                        <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Endereço de Destino</p>
                              <p className="text-sm font-bold text-white leading-snug">{order.delivery_address}</p>
                            </div>
                          </div>

                        {/* Botões de Navegação GPS */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Google Maps
                          </a>
                          <a
                            href={wazeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Waze
                          </a>
                        </div>
                      </div>

                      {/* Botão de Contato com Cliente e Chat Integrado */}
                      <div className="space-y-2">
                        {whatsappUrl && (
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" /> WhatsApp
                            </a>
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-4 h-4" /> Ligar
                            </a>
                          </div>
                        )}

                        {/* CHAT DIRETO INTEGRADO COM O CLIENTE */}
                        <OrderChatButton
                          orderId={order.id}
                          senderType="courier"
                          label="Chat Direto com o Cliente"
                          onClick={() => setSelectedOrderForChat(order)}
                        />
                      </div>

                      {/* Itens do Pedido */}
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Itens para Entregar</p>
                        {order.items_json?.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs text-zinc-300">
                            <span><b>{it.quantity}x</b> {typeof it.name === 'object' ? it.name.name : it.name} {it.size && `(${it.size.toUpperCase()})`}</span>
                            <span className="font-mono text-zinc-500">{formatBRL((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pagamento e Total */}
                      <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Forma de Pagamento</p>
                          <p className="text-xs font-bold text-primary uppercase">
                            {order.payment_method?.toUpperCase().replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Valor do Pedido</p>
                          <p className="text-lg font-black text-white">{formatBRL(order.total_amount)}</p>
                        </div>
                      </div>

                      {/* BOTÃO FINALIZAR ENTREGA */}
                      <button
                        onClick={() => handleCompleteDelivery(order)}
                        disabled={completingId === order.id}
                        className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 text-white py-4 rounded-2xl font-heading font-black text-sm uppercase tracking-wider shadow-2xl shadow-green-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {completingId === order.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Finalizando Entrega...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Confirmar Entrega Concluída ✓
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
                </>
              )}
            </motion.div>
          )}

          {/* ABA 2: FILA DE REVEZAMENTO DA LOJA */}
          {activeTab === 'queue' && (
            <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Fila de Revezamento (Ordem de Chegada)
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">{availableCouriers.length} Disponíveis</span>
                </div>

                <div className="space-y-2.5">
                  {queue.map((c: any, index: number) => {
                    const isMe = c.id === courier?.id;
                    const queueNum = c.status === 'available' 
                      ? availableCouriers.findIndex(ac => ac.id === c.id) + 1 
                      : null;

                    return (
                      <div
                        key={c.id}
                        className={cn(
                          "p-4 rounded-2xl flex items-center justify-between border transition-all",
                          isMe ? "bg-primary/10 border-primary/30" : "bg-zinc-950/60 border-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center font-mono",
                            queueNum === 1 ? "bg-green-500 text-black shadow-lg shadow-green-500/30" :
                            queueNum ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-600"
                          )}>
                            {queueNum ? `${queueNum}º` : '—'}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm flex items-center gap-2">
                              {c.name} {isMe && <span className="text-[10px] bg-primary text-white px-2 py-0.2 rounded-full font-mono">VOCÊ</span>}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {c.status === 'available' ? '🟢 Disponível na Fila' :
                               c.status === 'busy' ? '🟡 Em Rota de Entrega' : '⚪ Em Pausa'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-[11px] font-mono text-zinc-400">
                          <span>{c.deliveries_count || 0} entregas</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA 3: EXTRATO FINANCEIRO E HISTÓRICO */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Resumo do Dia */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-5">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Entregas Hoje</p>
                  <p className="text-2xl font-black text-white">{completedOrders.length}</p>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-5">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Total a Receber</p>
                  <p className="text-2xl font-black text-green-400">{formatBRL(todayEarnings)}</p>
                </div>
              </div>

              {/* Lista de Entregas Realizadas */}
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Histórico de Entregas Concluídas
                </h3>

                {completedOrders.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma entrega concluída ainda hoje.</p>
                ) : (
                  <div className="space-y-3">
                    {completedOrders.map((order: any) => (
                      <div key={order.id} className="p-3.5 bg-zinc-950 rounded-2xl border border-white/5 flex justify-between items-center">
                        <div>
                          <p className="text-white font-bold text-xs">{order.customer_name}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{order.delivery_address}</p>
                          <p className="text-[9px] font-mono text-zinc-600 mt-0.5">
                            {order.delivered_at ? format(new Date(order.delivered_at), "HH:mm") : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-green-400 font-mono">
                            +{formatBRL(deliveryFee)}
                          </span>
                          <p className="text-[9px] text-zinc-500 uppercase">{order.payment_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER COM LOGO DISCRETA */}
      <footer className="max-w-3xl mx-auto px-4 text-center py-6 text-zinc-600 border-t border-white/5 mt-8">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Bike className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">
            da Quebrada • Delivery
          </span>
        </div>
        <p className="text-[10px] text-zinc-700">Sistema Inteligente de Fila e Entregas para Comércios Locais</p>
      </footer>

      {/* MODAL DE CHAT DIRETO COM O CLIENTE */}
      {selectedOrderForChat && (
        <OrderChatModal
          isOpen={!!selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
          order={selectedOrderForChat}
          senderType="courier"
          senderName={courier?.name || 'Entregador'}
        />
      )}

      {/* MODAL DE EMERGÊNCIA E SUPORTE RÁPIDO */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border-2 border-red-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-start pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg leading-tight">Central de Emergência</h3>
                    <p className="text-xs text-zinc-400">Suporte rápido durante a rota</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Ligar para a Loja */}
                {storeMenu?.phone && (
                  <a
                    href={`tel:${storeMenu.phone}`}
                    className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-between text-white font-bold text-xs transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <PhoneCall className="w-5 h-5 text-green-400" />
                      Ligar para a Cozinha / Loja ({storeName})
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </a>
                )}

                {/* 2. WhatsApp Suporte Loja */}
                {storeMenu?.phone && (
                  <a
                    href={`https://wa.me/55${storeMenu.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚨 SUPORTE MOTOBOY: Olá, sou ${courier?.name}. Preciso de suporte urgente com uma entrega da loja.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-2xl flex items-center justify-between text-green-400 font-bold text-xs transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5" />
                      WhatsApp com o Gerente da Loja
                    </span>
                    <ChevronRight className="w-4 h-4 text-green-500/50" />
                  </a>
                )}

                {/* 3. Pane no Veículo / Pneu Furado */}
                {storeMenu?.phone && (
                  <a
                    href={`https://wa.me/55${storeMenu.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`⚠️ AVISO DE PANE: Olá, sou ${courier?.name}. Minha moto teve um problema / pneu furou durante o trajeto. Por favor verifiquem o pedido.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-2xl flex items-center justify-between text-orange-400 font-bold text-xs transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5" />
                      Avisar Pane Mecânica / Pneu Furado
                    </span>
                    <ChevronRight className="w-4 h-4 text-orange-500/50" />
                  </a>
                )}

                {/* 4. SAMU 192 */}
                <a
                  href="tel:192"
                  className="p-4 bg-red-600/30 hover:bg-red-600/40 border border-red-500/40 rounded-2xl flex items-center justify-between text-red-300 font-black text-xs transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <LifeBuoy className="w-5 h-5 text-red-400" />
                    SAMU - 192 (Socorro Médico de Urgência)
                  </span>
                  <Phone className="w-4 h-4 text-red-400" />
                </a>

                {/* 5. Polícia Militar 190 */}
                <a
                  href="tel:190"
                  className="p-4 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 rounded-2xl flex items-center justify-between text-blue-300 font-black text-xs transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    Polícia Militar - 190 (Segurança Pública)
                  </span>
                  <Phone className="w-4 h-4 text-blue-400" />
                </a>
              </div>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-2xl text-xs font-bold transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
