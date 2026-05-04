import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatBRL } from '../lib/utils';
import { 
  Utensils, 
  Receipt, 
  LogOut,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Printer,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('orders');
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (activeTab === 'orders') fetchOrders();
    }, 10000); // Polling a cada 10s
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      api.getMenu().then(setMenu),
      fetchOrders()
    ]);
    setLoading(false);
  };

  const fetchOrders = () => api.getOrders().then(setOrders);

  const handleMenuSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateMenu(menu);
    alert('Cardápio atualizado com sucesso!');
  };

  const handleOrderStatus = async (id: string, status: string) => {
    await api.updateOrderStatus(id, status);
    fetchOrders();
  };

  const copyToWhatsApp = (order: any) => {
    const items = order.itens?.map((i:any) => `${i.quantity}x ${i.name} ${i.size ? `(${i.size})` : ''}`).join('\n') || '';
    const text = `*PEDIDO #${order.id.toUpperCase()}*
Cliente: ${order.cliente_nome}
Telefone: ${order.telefone}
Endereço: ${order.endereco}
Itens: ${items}
Pagamento: ${order.pagamento.toUpperCase()}
Total: ${formatBRL(order.total)}`;
    
    navigator.clipboard.writeText(text);
    alert("Copiado para o WhatsApp!");
  };

  const handlePrint = (order: any) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 100);
  };

  if (loading && !menu) return <div className="p-8 text-white">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-surface md:pb-0 pb-20">
      {/* Área de Impressão (Invisível na tela, visível no papel) */}
      {printingOrder && (
        <div className="fixed inset-0 bg-white z-[9999] p-8 text-black font-mono print-only block">
          <div className="max-w-[80mm] mx-auto border-2 border-dashed border-black p-4">
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-xl font-bold uppercase">Marmitaria da Talita</h1>
              <p className="text-xs">Sabor & Tradição Caseira</p>
              <p className="text-xs">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
            
            <div className="mb-4">
              <p className="font-bold">PEDIDO: #{printingOrder.id.toUpperCase()}</p>
              <p>CLIENTE: {printingOrder.cliente_nome}</p>
              <p>TEL: {printingOrder.telefone}</p>
            </div>

            <div className="mb-4 border-y border-black py-2">
              <p className="font-bold mb-1">ITENS:</p>
              {printingOrder.itens?.map((i:any, idx:number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{i.quantity}x {i.name} {i.size && `(${i.size})`}</span>
                  <span>{formatBRL(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <p className="font-bold">ENDEREÇO DE ENTREGA:</p>
              <p className="text-sm">{printingOrder.endereco}</p>
            </div>

            <div className="border-t-2 border-black pt-2">
              <div className="flex justify-between font-bold">
                <span>PAGAMENTO:</span>
                <span>{printingOrder.pagamento.toUpperCase()}</span>
              </div>
              {printingOrder.trocoPara && (
                <div className="flex justify-between text-sm">
                  <span>Troco para:</span>
                  <span>R$ {printingOrder.trocoPara}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>TOTAL:</span>
                <span>{formatBRL(printingOrder.total)}</span>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] uppercase">
              <p>Obrigado pela preferência!</p>
              <p>Bom apetite!</p>
            </div>
          </div>
        </div>
      )}

      {/* Header e Layout do Admin (Escondido ao imprimir) */}
      <div className="no-print">
        <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-between items-center px-4 py-3 w-full">
          <div className="flex items-center gap-3">
            <Utensils className="text-orange-600 w-6 h-6" />
            <h1 className="text-xl font-heading font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 uppercase tracking-widest">
              MARMITARIA DA TALITA
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-orange-600 hidden sm:block">ADMIN</span>
            <div className="w-2 h-2 rounded-full bg-green-500 pulse-led"></div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-container py-8 flex flex-col gap-8 md:pl-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-primary mb-1 uppercase">Painel de Gestão</p>
              <h2 className="font-heading text-3xl font-bold text-white">
                {activeTab === 'menu' ? 'Cardápio' : 'Pedidos'}
              </h2>
            </div>
            <div className="flex p-1 bg-surface-container-highest rounded-lg w-full md:w-auto">
              <button onClick={() => setActiveTab('menu')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-heading text-sm font-bold uppercase transition-all ${activeTab === 'menu' ? 'bg-zinc-950 text-orange-500' : 'text-zinc-500 hover:text-white'}`}>
                <Utensils className="w-4 h-4" /> Cardápio
              </button>
              <button onClick={() => setActiveTab('orders')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-heading text-sm font-bold uppercase transition-all ${activeTab === 'orders' ? 'bg-zinc-950 text-orange-500' : 'text-zinc-500 hover:text-white'}`}>
                <Receipt className="w-4 h-4" /> Pedidos
              </button>
            </div>
          </div>

          {activeTab === 'menu' && menu && (
            <form onSubmit={handleMenuSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <section className="glass-card rounded-xl p-6 border border-orange-500/30 neon-glow-primary">
                  <h3 className="font-heading text-2xl text-white mb-4">Prato do Dia</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-mono text-xs text-zinc-400 uppercase">Título</label>
                      <input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 text-white outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-xs text-zinc-400 uppercase">Descrição</label>
                      <textarea value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 text-white outline-none" rows={3} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <input type="number" step="0.01" value={menu.prices.p} onChange={e => setMenu({...menu, prices: {...menu.prices, p: parseFloat(e.target.value)}})} className="bg-surface-container-low p-3 rounded-lg text-white" />
                      <input type="number" step="0.01" value={menu.prices.m} onChange={e => setMenu({...menu, prices: {...menu.prices, m: parseFloat(e.target.value)}})} className="bg-primary-container/20 p-3 rounded-lg text-white" />
                      <input type="number" step="0.01" value={menu.prices.g} onChange={e => setMenu({...menu, prices: {...menu.prices, g: parseFloat(e.target.value)}})} className="bg-surface-container-low p-3 rounded-lg text-white" />
                    </div>
                  </div>
                </section>
                <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-500 py-4 rounded-xl font-heading text-lg font-bold text-white uppercase tracking-wider neon-glow-btn">
                  Salvar Cardápio
                </button>
              </div>
            </form>
          )}

          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.length === 0 ? (
                <div className="col-span-full text-center p-12 glass-card rounded-xl text-zinc-500">Nenhum pedido recebido.</div>
              ) : orders.map(order => (
                <div key={order.id} className="glass-card rounded-xl overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300">
                  <div className="p-4 border-b border-white/5 flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white">{order.cliente_nome}</h3>
                      <p className="font-sans text-xs text-zinc-500 mt-1">{format(new Date(order.createdAt), "dd/MM HH:mm")}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${order.status === 'pendente' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : order.status === 'confirmado' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500'}`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-grow space-y-4">
                    <div className="bg-white/5 p-2 rounded-lg space-y-1">
                      {order.itens?.map((i:any, idx:number) => (
                        <p key={idx} className="font-sans text-sm text-zinc-300">
                          {i.quantity}x {i.name} {i.size && `(${i.size})`}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-mono text-[10px] text-zinc-500 uppercase">Pagamento</p>
                        <p className="font-sans text-sm text-white uppercase">{order.pagamento}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-xl text-tertiary">{formatBRL(order.total)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-900/50 flex flex-col gap-2 border-t border-white/5">
                    {order.status === 'pendente' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOrderStatus(order.id, 'confirmado')} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4"/> CONFIRMAR</button>
                        <button onClick={() => handleOrderStatus(order.id, 'negado')} className="flex-1 bg-red-600/20 text-red-500 py-2 rounded-lg font-bold text-xs border border-red-600/50"><XCircle className="w-4 h-4"/> NEGAR</button>
                      </div>
                    )}
                    {order.status === 'confirmado' && (
                      <>
                        <button onClick={() => handlePrint(order)} className="w-full bg-white text-black py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Printer className="w-4 h-4"/> IMPRIMIR COMANDA</button>
                        <button onClick={() => copyToWhatsApp(order)} className="w-full bg-green-600/20 text-green-500 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-green-600/50"><Copy className="w-4 h-4"/> COPIAR WHATSAPP</button>
                        <button onClick={() => handleOrderStatus(order.id, 'entregue')} className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold text-xs">MARCAR COMO ENTREGUE</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-20 flex-col bg-zinc-900/95 border-r border-white/5 pt-24 pb-8 items-center justify-between">
          <nav className="flex flex-col gap-4">
            <button onClick={() => setActiveTab('menu')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'menu' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <Utensils className="w-6 h-6" />
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <Receipt className="w-6 h-6" />
            </button>
          </nav>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-500 hover:text-red-500">
            <LogOut className="w-6 h-6" />
          </button>
        </aside>
      </div>
    </div>
  );
}