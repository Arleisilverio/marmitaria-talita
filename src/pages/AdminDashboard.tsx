import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL } from '../lib/utils';
import { 
  Utensils, Receipt, BarChart3, CheckCircle, Printer, Copy, 
  Camera, Save, Image as ImageIcon, Calendar, User, ShieldAlert, Store, Clock, AlertTriangle, Bike
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'reports'>('orders');
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<any>(null);
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchData();
    const orderInterval = setInterval(() => { if (activeTab === 'orders') fetchOrders(); }, 10000);
    const clockInterval = setInterval(() => { setNow(Date.now()); }, 1000);
    return () => { clearInterval(orderInterval); clearInterval(clockInterval); };
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMenu({ ...menu, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (size: string, value: number) => setMenu({ ...menu, prices: { ...menu.prices, [size]: value } });
  const updateMeat = (id: string, field: string, value: any) => setMenu({ ...menu, meats: menu.meats.map((m: any) => m.id === id ? { ...m, [field]: value } : m) });
  const addMeat = () => setMenu({ ...menu, meats: [...menu.meats, { id: 'm' + Date.now(), name: '', available: true }] });
  const updateDrink = (id: string, field: string, value: any) => setMenu({ ...menu, drinks: menu.drinks.map((d: any) => d.id === id ? { ...d, [field]: value } : d) });
  const addDrink = () => setMenu({ ...menu, drinks: [...menu.drinks, { id: 'd' + Date.now(), name: '', price: 0 }] });

  const handleMenuSave = async () => {
    try {
      await api.updateMenu(menu);
      toast.success('Cardápio e Taxas atualizados!');
    } catch (err) { toast.error('Erro ao salvar.'); }
  };

  const handleOrderStatus = async (id: string, status: string) => {
    await api.updateOrderStatus(id, status);
    fetchOrders();
  };

  const copyToWhatsApp = (order: any) => {
    const items = order.items_json?.map((i:any) => `${i.quantity}x ${i.name} ${i.size ? `(${i.size})` : ''}`).join('\n') || '';
    const text = `*PEDIDO #${order.id.substring(0, 8).toUpperCase()}*\nCliente: ${order.customer_name}\nTelefone: ${order.customer_phone}\nEndereço/Retirada: ${order.delivery_address}\nItens: \n${items}\nPagamento: ${order.payment_method?.toUpperCase()}\nTotal: ${formatBRL(order.total_amount)}`;
    navigator.clipboard.writeText(text);
    toast.success("Copiado para o WhatsApp!");
  };

  const handlePrint = (order: any) => {
    setPrintingOrder(order);
    setTimeout(() => { window.print(); setPrintingOrder(null); }, 100);
  };

  if (loading && !menu) return <div className="p-8 text-white flex justify-center mt-20">Carregando painel da cozinha...</div>;

  const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), new Date()));
  const reportOrders = orders.filter(o => isSameDay(new Date(o.created_at), parseISO(reportDate)));
  const deliveredOrders = reportOrders.filter(o => o.status === 'entregue' || o.status === 'confirmado');
  const totalRevenue = deliveredOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);
  const ticketMedio = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  return (
    <div className="min-h-screen bg-surface pb-32 md:pb-0">
      
      {printingOrder && (
        <div className="fixed inset-0 bg-white z-[9999] p-8 text-black font-mono print-only block">
          <div className="max-w-[80mm] mx-auto border-2 border-dashed border-black p-4">
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-xl font-bold uppercase">Marmitaria da Talita</h1>
              <p className="text-xs">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
            <div className="mb-4">
              <p className="font-bold uppercase text-xs">PEDIDO: #{printingOrder.id.substring(0, 8).toUpperCase()}</p>
              <p className="text-sm">CLIENTE: {printingOrder.customer_name}</p>
              <p className="text-sm">TEL: {printingOrder.customer_phone}</p>
            </div>
            <div className="mb-4 border-y border-black py-2">
              <p className="font-bold text-xs mb-1">ITENS:</p>
              {printingOrder.items_json?.map((i:any, idx:number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{i.quantity}x {i.name} {i.size && `(${i.size})`}</span>
                  <span>{formatBRL(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="font-bold text-xs uppercase">LOCAL:</p>
              <p className="text-sm font-bold">{printingOrder.delivery_address}</p>
            </div>
            <div className="border-t-2 border-black pt-2">
              <div className="flex justify-between font-bold text-sm">
                <span>PAG:</span><span>{printingOrder.payment_method?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>TOTAL:</span><span>{formatBRL(printingOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="no-print">
        <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-between items-center px-4 py-3 w-full overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-3 min-w-max mr-4">
            <h1 className="text-lg md:text-xl font-heading font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 uppercase tracking-widest">
              PAINEL DA CHEF
            </h1>
          </div>
          
          <div className="flex items-center gap-2 min-w-max">
            {/* BOTÃO LOJA */}
            <div className="flex flex-col items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold mb-0.5">Loja Geral</span>
              <button 
                onClick={() => {
                  const newState = { ...menu, isOpen: !menu.isOpen };
                  setMenu(newState); api.updateMenu(newState);
                  toast(newState.isOpen ? 'Loja Aberta!' : 'Loja Fechada!');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase transition-all ${menu.isOpen ? 'text-green-500' : 'text-red-500'}`}
              >
                <Store className="w-3.5 h-3.5" /> {menu.isOpen ? 'ABERTA' : 'FECHADA'}
              </button>
            </div>
            
            {/* BOTÃO DELIVERY */}
            <div className="flex flex-col items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold mb-0.5">Motoboy</span>
              <button 
                onClick={() => {
                  const newState = { ...menu, isDeliveryOpen: !menu.isDeliveryOpen };
                  setMenu(newState); api.updateMenu(newState);
                  toast(newState.isDeliveryOpen ? 'Delivery Ligado!' : 'Delivery Desligado!');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase transition-all ${menu.isDeliveryOpen ? 'text-blue-400' : 'text-zinc-500'}`}
              >
                <Bike className="w-3.5 h-3.5" /> {menu.isDeliveryOpen ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-container py-8 flex flex-col gap-8 md:pl-28">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs text-primary mb-1 uppercase">Gestão Completa</p>
              <h2 className="font-heading text-3xl font-bold text-white">
                {activeTab === 'menu' ? 'Gerenciar Cardápio' : activeTab === 'orders' ? 'Operação de Hoje' : 'Contabilidade'}
              </h2>
            </div>
            <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5 overflow-x-auto hide-scrollbar">
              <button onClick={() => setActiveTab('menu')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-heading text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-zinc-800 text-orange-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                <Utensils className="w-4 h-4" /> Cardápio
              </button>
              <button onClick={() => setActiveTab('orders')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-heading text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-zinc-800 text-orange-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                <Receipt className="w-4 h-4" /> Hoje <span className="bg-orange-500 text-white rounded-full px-2 py-0.5 ml-1">{todayOrders.filter(o => o.status === 'pendente').length}</span>
              </button>
              <button onClick={() => setActiveTab('reports')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-heading text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-zinc-800 text-orange-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                <BarChart3 className="w-4 h-4" /> Relatórios
              </button>
            </div>
          </div>

          {activeTab === 'menu' && menu && (
            <div className="space-y-8 pb-12 animate-fade-in">
              <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <div><h3 className="font-heading text-lg font-bold text-white">Configurações e Pratos</h3></div>
                <button onClick={handleMenuSave} className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  <Save className="w-5 h-5" /> PUBLICAR
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Tempo de Preparo */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-white font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500"/> Tempo de Preparo</p>
                    <p className="text-xs text-zinc-500 mt-1">Define o cronômetro do painel</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={menu.prepTime || 40} onChange={e => setMenu({...menu, prepTime: Number(e.target.value)})} className="w-24 bg-zinc-900 border border-white/10 p-3 rounded-xl text-white outline-none text-center font-bold text-xl" />
                    <span className="text-zinc-500 text-sm font-bold uppercase">Minutos</span>
                  </div>
                </div>

                {/* Taxa de Entrega */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-white font-bold flex items-center gap-2"><Bike className="w-4 h-4 text-blue-400"/> Taxa de Entrega Padrão</p>
                    <p className="text-xs text-zinc-500 mt-1">Valor cobrado no delivery</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold">R$</span>
                    <input type="number" step="0.50" value={menu.deliveryFee !== undefined ? menu.deliveryFee : 5.00} onChange={e => setMenu({...menu, deliveryFee: parseFloat(e.target.value) || 0})} className="w-32 bg-zinc-900 border border-white/10 p-3 rounded-xl text-white outline-none text-center font-bold text-xl focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="relative h-64 bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 group flex items-center justify-center">
                {menu.image ? <img src={menu.image} alt="Menu" className="w-full h-full object-cover opacity-60" /> : <ImageIcon className="w-12 h-12 text-zinc-700" />}
                <div className="absolute bottom-4 left-0 w-full flex justify-center">
                  <label className="bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                    <Camera className="w-4 h-4" /> ALTERAR FOTO
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <div><label className="text-zinc-500 text-xs font-mono uppercase mb-2 block">Nome do Prato</label><input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" /></div>
                 <div><label className="text-zinc-500 text-xs font-mono uppercase mb-2 block">Descrição</label><textarea value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white outline-none resize-none focus:border-orange-500" rows={3} /></div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <label className="text-zinc-500 text-xs font-mono uppercase mb-4 block">Valores dos Tamanhos (R$)</label>
                <div className="grid grid-cols-3 gap-4">
                   {['p', 'm', 'g'].map(size => (
                     <div key={size}>
                       <label className="text-white text-sm font-bold uppercase mb-1 block">Tam. {size.toUpperCase()}</label>
                       <input type="number" step="0.01" value={menu.prices[size]} onChange={e => handlePriceChange(size, parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white outline-none text-xl font-bold font-heading focus:border-orange-500" />
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <label className="text-zinc-500 text-xs font-mono uppercase">Carnes do Dia</label>
                    <button onClick={addMeat} className="text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-1 rounded">+ ADC</button>
                  </div>
                  {menu.meats.map((meat: any) => (
                    <div key={meat.id} className="flex gap-2">
                      <input type="text" value={meat.name} onChange={e => updateMeat(meat.id, 'name', e.target.value)} className="flex-1 bg-zinc-900 p-3 rounded-lg text-white text-sm border border-white/5 focus:border-orange-500 outline-none" />
                      <button onClick={() => updateMeat(meat.id, 'available', !meat.available)} className={`px-4 rounded-lg text-xs font-bold transition-colors ${meat.available ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                        {meat.available ? 'TEM' : 'ACABOU'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <label className="text-zinc-500 text-xs font-mono uppercase">Bebidas e Extras</label>
                    <button onClick={addDrink} className="text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-1 rounded">+ ADC</button>
                  </div>
                  {menu.drinks.map((drink: any) => (
                    <div key={drink.id} className="flex gap-2">
                      <input type="text" value={drink.name} onChange={e => updateDrink(drink.id, 'name', e.target.value)} className="flex-1 bg-zinc-900 p-3 rounded-lg text-white text-sm border border-white/5 focus:border-orange-500 outline-none" />
                      <input type="number" value={drink.price} onChange={e => updateDrink(drink.id, 'price', parseFloat(e.target.value))} className="w-24 bg-zinc-900 p-3 rounded-lg text-white text-sm text-center border border-white/5 focus:border-orange-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayOrders.length === 0 ? (
                  <div className="col-span-full text-center p-12 glass-card rounded-xl text-zinc-500 border border-white/5">Nenhum pedido para hoje ainda.</div>
                ) : todayOrders.map(order => {
                  
                  const orderTime = new Date(order.created_at).getTime();
                  const targetTime = orderTime + ((menu.prepTime || 40) * 60000);
                  const diff = targetTime - now;
                  const isLate = diff < 0;
                  const absDiff = Math.abs(diff);
                  const m = Math.floor(absDiff / 60000);
                  const s = Math.floor((absDiff % 60000) / 1000);
                  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                  const showTimer = order.status === 'pendente' || order.status === 'confirmado';

                  return (
                  <div key={order.id} className={`glass-card rounded-xl overflow-hidden flex flex-col border ${order.status === 'pendente' ? 'border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.1)]' : 'border-white/5'}`}>
                    <div className="p-4 border-b border-white/5 flex justify-between items-start">
                      <div>
                        <h3 className="font-heading font-bold text-lg text-white">{order.customer_name}</h3>
                        <p className="font-sans text-xs text-zinc-500 mt-1">{format(new Date(order.created_at), "HH:mm")}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${order.status === 'pendente' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : order.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : order.status === 'entregue' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500'}`}>
                          {order.status}
                        </div>
                        {showTimer && (
                          <div className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded border ${isLate ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' : 'bg-white/5 text-zinc-300 border-white/10'}`}>
                            {isLate ? <AlertTriangle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}{isLate ? '-' : ''}{timeString}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 flex-grow space-y-4 bg-black/20">
                      <div className="space-y-1">
                        {order.items_json?.map((i:any, idx:number) => (
                          <p key={idx} className="font-sans text-sm text-zinc-300 font-medium leading-relaxed">
                            <span className="font-bold text-zinc-500">{i.quantity}x</span> {i.name} {i.size && <span className="text-orange-400">({i.size})</span>}
                          </p>
                        ))}
                      </div>
                      <div className="flex justify-between items-end pt-4 border-t border-white/5">
                        <div>
                          <p className="font-mono text-[10px] text-zinc-500 uppercase">{order.payment_method}</p>
                          <p className={`text-xs font-bold ${order.delivery_address.includes('RETIRADA') ? 'text-blue-400' : 'text-zinc-400'}`}>
                            {order.delivery_address.includes('RETIRADA') ? '🏪 RETIRADA NO BALCÃO' : '🛵 ENTREGA'}
                          </p>
                        </div>
                        <p className="font-heading font-bold text-xl text-tertiary">{formatBRL(order.total_amount)}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-2">
                      {order.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleOrderStatus(order.id, 'confirmado')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-xs"><CheckCircle className="inline w-4 h-4 mr-1"/> ACEITAR</button>
                          <button onClick={() => handleOrderStatus(order.id, 'negado')} className="flex-1 bg-zinc-800 text-red-500 py-3 rounded-xl font-bold text-xs">NEGAR</button>
                        </div>
                      )}
                      {order.status === 'confirmado' && (
                        <>
                          <button onClick={() => handlePrint(order)} className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2"><Printer className="w-4 h-4"/> IMPRIMIR COMANDA</button>
                          <button onClick={() => copyToWhatsApp(order)} className="w-full bg-[#25D366]/20 text-[#25D366] py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 border border-[#25D366]/50"><Copy className="w-4 h-4"/> WHATSAPP DO MOTOBOY</button>
                          <button onClick={() => handleOrderStatus(order.id, 'entregue')} className="w-full bg-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl font-bold text-xs">MARCAR COMO CONCLUÍDO</button>
                        </>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500"><Calendar className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm text-zinc-400 font-bold uppercase">Escolha a data</p>
                    <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="bg-transparent text-xl font-heading font-bold text-white outline-none mt-1" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Faturamento Dia</p>
                  <p className="text-3xl font-heading font-black text-green-400">{formatBRL(totalRevenue)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Ticket Médio</p>
                  <p className="text-3xl font-heading font-black text-white">{formatBRL(ticketMedio)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Marmitas Vendidas</p>
                  <p className="text-3xl font-heading font-black text-white">{deliveredOrders.length}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <nav className="bg-surface/90 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-3xl border-t border-white/5 shadow-2xl flex justify-around items-center h-20 pb-safe md:hidden">
        <button onClick={() => navigate('/', { state: { tab: 'menu' } })} className="flex flex-col items-center justify-center transition-all text-on-surface-variant/40 hover:text-primary/50"><Utensils className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Cardápio</span></button>
        <button onClick={() => navigate('/', { state: { tab: 'orders' } })} className="flex flex-col items-center justify-center transition-all text-on-surface-variant/40 hover:text-primary/50"><Receipt className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Pedidos</span></button>
        <button onClick={() => navigate('/', { state: { tab: 'profile' } })} className="flex flex-col items-center justify-center transition-all text-on-surface-variant/40 hover:text-primary/50"><User className="w-6 h-6 mb-1" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest">Perfil</span></button>
        <button className="flex flex-col items-center justify-center transition-all text-orange-500"><ShieldAlert className="w-6 h-6 mb-1 text-orange-500" /><span className="font-heading text-[10px] font-bold uppercase tracking-widest text-orange-500">Painel</span></button>
      </nav>
    </div>
  );
}