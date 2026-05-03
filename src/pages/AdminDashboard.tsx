import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatBRL } from '../lib/utils';
import { 
  Utensils, 
  Receipt, 
  Settings, 
  History, 
  LogOut,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('orders');
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // In a real app, we'd use polling or WebSockets here
    const interval = setInterval(() => {
      if (activeTab === 'orders') fetchOrders();
    }, 5000);
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
    fetchOrders(); // Refresh
  };

  const generatePrintableText = (order: any) => {
    const items = order.itens.map((i:any) => `${i.quantity}x ${i.name} ${i.size ? `(${i.size})` : ''}`).join('\n');
    return `*PEDIDO #${order.id.toUpperCase()}*
Cliente: ${order.cliente_nome}
Telefone: ${order.telefone}

*ENDEREÇO*
${order.endereco}

*ITENS*
${items}

*PAGAMENTO:* ${order.pagamento.toUpperCase()}
Total: ${formatBRL(order.total)}
${order.trocoPara ? `Troco para: R$ ${order.trocoPara}` : ''}
`;
  };

  const handlePrint = (order: any) => {
    const text = generatePrintableText(order);
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência! Cole no WhatsApp do entregador.");
  };

  if (loading && !menu) return <div className="p-8 text-white">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-surface md:pb-0 pb-20">
      {/* TopAppBar */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-between items-center px-4 py-3 w-full">
        <div className="flex items-center gap-3">
          <Utensils className="text-orange-600 w-6 h-6" />
          <h1 className="text-xl font-heading font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 uppercase tracking-widest">
            MARMITARIA DA TALITA
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-heading text-sm font-bold uppercase tracking-widest text-orange-600 hidden sm:block">ADMIN</span>
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-led shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-container py-8 flex flex-col gap-8 md:pl-28">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-primary mb-1 uppercase">Painel da Talita</p>
            <h2 className="font-heading text-3xl font-bold text-white">
              {activeTab === 'menu' ? 'Gestão de Cardápio' : 'Gerenciamento de Pedidos'}
            </h2>
          </div>
          <div className="flex p-1 bg-surface-container-highest rounded-lg w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('menu')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-heading text-sm font-bold uppercase transition-all ${activeTab === 'menu' ? 'bg-zinc-950 text-orange-500 drop-shadow-[0_0_5px_rgba(255,61,0,0.8)]' : 'text-zinc-500 hover:text-white'}`}
            >
              <Utensils className="w-4 h-4" /> Cardápio
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-heading text-sm font-bold uppercase transition-all ${activeTab === 'orders' ? 'bg-zinc-950 text-orange-500 drop-shadow-[0_0_5px_rgba(255,61,0,0.8)]' : 'text-zinc-500 hover:text-white'}`}
            >
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
                    <label className="font-mono text-xs text-zinc-400 uppercase">Título do Prato</label>
                    <input 
                      type="text" 
                      value={menu.title}
                      onChange={e => setMenu({...menu, title: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 text-white font-sans focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs text-zinc-400 uppercase">Descrição Saborosa</label>
                    <textarea 
                      value={menu.description}
                      onChange={e => setMenu({...menu, description: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 text-white font-sans focus:ring-1 focus:ring-primary outline-none transition-all" 
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs text-zinc-400 uppercase">URL da Imagem</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={menu.image}
                        onChange={e => setMenu({...menu, image: e.target.value})}
                        className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 pl-10 text-white font-sans focus:ring-1 focus:ring-primary outline-none transition-all" 
                      />
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="font-mono text-xs text-zinc-400 uppercase">Preço (P)</label>
                      <input 
                        type="number" step="0.01" 
                        value={menu.prices.p}
                        onChange={e => setMenu({...menu, prices: {...menu.prices, p: parseFloat(e.target.value)}})}
                        className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 text-white font-heading font-bold focus:ring-1 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-xs text-zinc-400 uppercase">Preço (M)</label>
                      <input 
                        type="number" step="0.01" 
                        value={menu.prices.m}
                        onChange={e => setMenu({...menu, prices: {...menu.prices, m: parseFloat(e.target.value)}})}
                        className="w-full bg-primary-container/10 border-primary rounded-lg p-3 text-white font-heading font-bold focus:ring-1 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-xs text-zinc-400 uppercase">Preço (G)</label>
                      <input 
                        type="number" step="0.01" 
                        value={menu.prices.g}
                        onChange={e => setMenu({...menu, prices: {...menu.prices, g: parseFloat(e.target.value)}})}
                        className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-lg p-3 text-white font-heading font-bold focus:ring-1 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="glass-card rounded-xl p-6 border-l-4 border-l-tertiary">
                <h3 className="font-heading text-2xl text-white mb-4">Opções de Carnes Diárias</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {menu.meats.map((meat: any, idx: number) => (
                    <label key={meat.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-white/5 cursor-pointer hover:bg-surface-container-high transition-colors group">
                      <input 
                        type="checkbox" 
                        checked={meat.available}
                        onChange={e => {
                          const newMeats = [...menu.meats];
                          newMeats[idx].available = e.target.checked;
                          setMenu({...menu, meats: newMeats});
                        }}
                        className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500 outline-none"
                      />
                      <span className="text-on-background font-sans group-hover:text-white">{meat.name}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-500 py-4 rounded-xl font-heading text-lg font-bold text-white uppercase tracking-wider neon-glow-btn hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.length === 0 ? (
              <div className="col-span-full text-center p-12 glass-card rounded-xl text-zinc-500">
                Nenhum pedido recebido ainda.
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="glass-card rounded-xl overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300">
                <div className="p-4 border-b border-white/5 flex justify-between items-start">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">{order.cliente_nome}</h3>
                    <p className="font-sans text-sm text-zinc-400 mt-1">{order.endereco}</p>
                    <p className="font-sans text-xs text-zinc-500 mt-1">
                      {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full flex items-center gap-1 border ${order.status === 'pendente' ? 'bg-orange-500/10 border-orange-500/30' : order.status === 'confirmado' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    {order.status === 'pendente' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 pulse-led"></div>}
                    <span className={`font-mono text-[10px] uppercase ${order.status === 'pendente' ? 'text-orange-500' : order.status === 'confirmado' ? 'text-green-500' : 'text-red-500'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 flex-grow space-y-4">
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Itens do Pedido</p>
                    <div className="bg-white/5 p-2 rounded-lg space-y-1">
                      {order.itens?.map((i:any, idx:number) => (
                        <p key={idx} className="font-sans text-sm text-zinc-300">
                          {i.quantity}x {i.name} {i.size && `(${i.size})`}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-[10px] text-zinc-500 uppercase">Pagamento</p>
                      <p className="font-sans text-sm text-white">{order.pagamento.toUpperCase()}</p>
                      {order.trocoPara && <p className="font-sans text-xs text-tertiary">Troco para {order.trocoPara}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-zinc-500 uppercase">Total</p>
                      <p className="font-heading font-bold text-xl text-tertiary">{formatBRL(order.total)}</p>
                    </div>
                  </div>
                </div>
                
                {order.status === 'pendente' && (
                  <div className="p-4 bg-zinc-900/50 flex gap-2 border-t border-white/5">
                    <button 
                      onClick={() => handleOrderStatus(order.id, 'confirmado')}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" /> CONFIRMAR
                    </button>
                    <button 
                      onClick={() => handleOrderStatus(order.id, 'negado')}
                      className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <XCircle className="w-4 h-4" /> NEGAR
                    </button>
                  </div>
                )}
                
                {order.status === 'confirmado' && (
                  <div className="p-4 bg-zinc-900/50 flex flex-col gap-2 border-t border-white/5">
                    <button 
                      onClick={() => handlePrint(order)}
                      className="w-full bg-surface-container hover:bg-surface-container-high text-white border border-white/10 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Printer className="w-4 h-4" /> IMPRIMIR (WhatsApp)
                    </button>
                    <button 
                      onClick={() => handleOrderStatus(order.id, 'entregue')}
                      className="w-full bg-primary-container/20 hover:bg-primary-container/30 text-primary-container border border-primary-container/50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(255,86,44,0.2)] active:scale-95"
                    >
                      MARCAR COMO ENTREGUE
                    </button>
                  </div>
                )}

                 {order.status === 'entregue' && (
                  <div className="p-4 bg-zinc-900/50 flex flex-col gap-2 border-t border-white/5 text-center">
                    <p className="text-zinc-500 font-bold text-sm">FINALIZADO</p>
                  </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-20 flex-col bg-zinc-900/95 backdrop-blur-md border-r border-white/5 pt-24 pb-8 items-center justify-between">
        <nav className="flex flex-col gap-4">
          <button onClick={() => setActiveTab('menu')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'menu' ? 'bg-orange-600/10 text-orange-500 border-l-4 border-orange-600' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
            <Utensils className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'orders' ? 'bg-orange-600/10 text-orange-500 border-l-4 border-orange-600' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
           <Receipt className="w-6 h-6" />
          </button>
        </nav>
        <button className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-red-900/20 hover:text-red-500 transition-all">
          <LogOut className="w-6 h-6" />
        </button>
      </aside>
    </div>
  );
}
