import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL } from '../lib/utils';
import { 
  Utensils, Receipt, BarChart3, CheckCircle, Printer, Copy, 
  Camera, Save, Image as ImageIcon, Calendar, User, ShieldAlert, Store, Clock, AlertTriangle, Bike, Plus, Trash2
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
      api.getMenu().then(data => {
        // Garante que a propriedade slides exista
        if (!data.slides) data.slides = [];
        setMenu(data);
      }),
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

  // Gerenciamento de Slides
  const addSlide = () => setMenu({ ...menu, slides: [...(menu.slides || []), { id: 's' + Date.now(), image: '', title: '', description: '' }] });
  const updateSlide = (id: string, field: string, value: any) => setMenu({ ...menu, slides: menu.slides.map((s: any) => s.id === id ? { ...s, [field]: value } : s) });
  const removeSlide = (id: string) => setMenu({ ...menu, slides: menu.slides.filter((s: any) => s.id !== id) });
  
  const handleSlideImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateSlide(id, 'image', reader.result as string);
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
        <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-center w-full px-4 py-3">
          <div className="max-w-7xl w-full flex justify-between items-center overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-3 min-w-max mr-4">
              <h1 className="text-lg md:text-2xl font-heading font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 uppercase tracking-widest">
                PAINEL DA CHEF
              </h1>
            </div>
            
            <div className="flex items-center gap-2 min-w-max">
              <div className="flex flex-col items-center bg-zinc-900 border border-white/10 rounded-xl px-4 py-1.5 md:py-2">
                <span className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase font-bold mb-0.5">Loja Geral</span>
                <button 
                  onClick={() => {
                    const newState = { ...menu, isOpen: !menu.isOpen };
                    setMenu(newState); api.updateMenu(newState);
                    toast(newState.isOpen ? 'Loja Aberta!' : 'Loja Fechada!');
                  }}
                  className={`flex items-center gap-1.5 text-xs md:text-sm font-bold uppercase transition-all ${menu.isOpen ? 'text-green-500' : 'text-red-500'}`}
                >
                  <Store className="w-3.5 h-3.5 md:w-4 md:h-4" /> {menu.isOpen ? 'ABERTA' : 'FECHADA'}
                </button>
              </div>
              
              <div className="flex flex-col items-center bg-zinc-900 border border-white/10 rounded-xl px-4 py-1.5 md:py-2">
                <span className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase font-bold mb-0.5">Motoboy</span>
                <button 
                  onClick={() => {
                    const newState = { ...menu, isDeliveryOpen: !menu.isDeliveryOpen };
                    setMenu(newState); api.updateMenu(newState);
                    toast(newState.isDeliveryOpen ? 'Delivery Ligado!' : 'Delivery Desligado!');
                  }}
                  className={`flex items-center gap-1.5 text-xs md:text-sm font-bold uppercase transition-all ${menu.isDeliveryOpen ? 'text-blue-400' : 'text-zinc-500'}`}
                >
                  <Bike className="w-3.5 h-3.5 md:w-4 md:h-4" /> {menu.isDeliveryOpen ? 'LIGADO' : 'DESLIGADO'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-container py-8 flex flex-col gap-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs md:text-sm text-primary mb-1 uppercase tracking-widest">Gestão Completa</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
                {activeTab === 'menu' ? 'Gerenciar Cardápio' : activeTab === 'orders' ? 'Operação de Hoje' : 'Contabilidade'}
              </h2>
            </div>
            <div className="flex p-1 bg-zinc-900 rounded-xl md:rounded-2xl border border-white/5 overflow-x-auto hide-scrollbar shadow-lg">
              <button onClick={() => setActiveTab('menu')} className={`flex-1 flex justify-center items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-heading text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-zinc-800 text-orange-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                <Utensils className="w-4 h-4" /> Cardápio
              </button>
              <button onClick={() => setActiveTab('orders')} className={`flex-1 flex justify-center items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-heading text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-zinc-800 text-orange-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                <Receipt className="w-4 h-4" /> Hoje <span className="bg-orange-500 text-white rounded-full px-2 py-0.5 ml-1">{todayOrders.filter(o => o.status === 'pendente').length}</span>
              </button>
              <button onClick={() => setActiveTab('reports')} className={`flex-1 flex justify-center items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-heading text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-zinc-800 text-orange-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                <BarChart3 className="w-4 h-4" /> Relatórios
              </button>
            </div>
          </div>

          {activeTab === 'menu' && menu && (
            <div className="space-y-8 pb-12 animate-fade-in max-w-5xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                <div>
                  <h3 className="font-heading text-lg md:text-xl font-bold text-white">Configurações e Pratos</h3>
                  <p className="text-zinc-500 text-sm">Atualize os valores e fotos para o cliente.</p>
                </div>
                <button onClick={handleMenuSave} className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  <Save className="w-5 h-5" /> PUBLICAR ALTERAÇÕES
                </button>
              </div>

              {/* GESTÃO DE SLIDES / CARROSSEL */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Carrossel de Destaques (Topo)</h3>
                    <p className="text-zinc-500 text-sm mt-1">Adicione o cardápio da semana ou promoções que ficarão rodando no topo.</p>
                  </div>
                  <button onClick={addSlide} className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> ADICIONAR SLIDE
                  </button>
                </div>

                <div className="space-y-6">
                  {menu.slides?.length === 0 && <p className="text-zinc-500 text-center py-4">Nenhum slide configurado. A imagem do Prato Principal será mostrada por padrão.</p>}
                  
                  {menu.slides?.map((slide: any, index: number) => (
                    <div key={slide.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-6">
                      {/* Upload Foto do Slide */}
                      <div className="relative w-full md:w-48 h-32 bg-zinc-800 rounded-xl overflow-hidden group flex-shrink-0 border border-white/5">
                        {slide.image ? <img src={slide.image} alt="Slide" className="w-full h-full object-cover opacity-80" /> : <ImageIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-zinc-600" />}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold gap-1">
                          <Camera className="w-4 h-4" /> Trocar
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSlideImageUpload(slide.id, e)} />
                        </label>
                      </div>

                      {/* Textos do Slide */}
                      <div className="flex-grow space-y-4">
                        <div className="flex justify-between gap-4">
                          <div className="flex-grow">
                            <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Título Principal (Ex: Segunda-Feira)</label>
                            <input type="text" value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-white outline-none focus:border-orange-500 text-sm font-bold" />
                          </div>
                          <button onClick={() => removeSlide(slide.id)} className="text-red-500 hover:bg-red-500/10 p-3 rounded-lg h-fit transition-colors mt-5">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Subtítulo / Prato (Ex: Feijoada Completa)</label>
                          <input type="text" value={slide.description} onChange={e => updateSlide(slide.id, 'description', e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-white outline-none focus:border-orange-500 text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-white font-bold md:text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500"/> Tempo de Preparo</p>
                    <p className="text-xs md:text-sm text-zinc-500 mt-1">Define o cronômetro do painel</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" value={menu.prepTime || 40} onChange={e => setMenu({...menu, prepTime: Number(e.target.value)})} className="w-24 md:w-32 bg-zinc-900 border border-white/10 p-3 md:p-4 rounded-xl text-white outline-none text-center font-bold text-xl md:text-2xl" />
                    <span className="text-zinc-500 text-sm md:text-base font-bold uppercase">Minutos</span>
                  </div>
                </div>

                <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-white font-bold md:text-lg flex items-center gap-2"><Bike className="w-5 h-5 text-blue-400"/> Taxa de Entrega Padrão</p>
                    <p className="text-xs md:text-sm text-zinc-500 mt-1">Valor cobrado no delivery</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold md:text-lg">R$</span>
                    <input type="number" step="0.50" value={menu.deliveryFee !== undefined ? menu.deliveryFee : 5.00} onChange={e => setMenu({...menu, deliveryFee: parseFloat(e.target.value) || 0})} className="w-32 md:w-40 bg-zinc-900 border border-white/10 p-3 md:p-4 rounded-xl text-white outline-none text-center font-bold text-xl md:text-2xl focus:border-orange-500" />
                  </div>
                </div>
              </div>

              {/* FOTO E DADOS DO PRATO PRINCIPAL DO DIA */}
              <div className="space-y-6 mt-8">
                <h3 className="font-heading text-xl font-bold text-white border-b border-white/10 pb-2">Marmita do Dia (Para Venda Hoje)</h3>
                
                <div className="relative h-64 md:h-80 bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 group flex items-center justify-center">
                  {menu.image ? <img src={menu.image} alt="Menu" className="w-full h-full object-cover opacity-60" /> : <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-zinc-700" />}
                  <div className="absolute bottom-6 left-0 w-full flex justify-center">
                    <label className="bg-white/90 hover:bg-white backdrop-blur-md text-black px-6 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 cursor-pointer shadow-xl transition-colors">
                      <Camera className="w-4 h-4 md:w-5 md:h-5" /> ALTERAR FOTO DO PRATO
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <div><label className="text-zinc-500 text-xs md:text-sm font-mono uppercase mb-2 block">Nome do Prato (Hoje)</label><input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 md:p-5 rounded-xl text-white outline-none focus:border-orange-500 text-lg md:text-xl" /></div>
                  <div><label className="text-zinc-500 text-xs md:text-sm font-mono uppercase mb-2 block">Descrição Completa</label><textarea value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 md:p-5 rounded-xl text-white outline-none resize-none focus:border-orange-500 text-base md:text-lg" rows={3} /></div>
                </div>
              </div>

              <div className="glass-card p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5">
                <label className="text-zinc-500 text-xs md:text-sm font-mono uppercase mb-6 block text-center">Valores dos Tamanhos (R$)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {['p', 'm', 'g'].map(size => (
                     <div key={size} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                       <label className="text-white text-sm md:text-base font-bold uppercase mb-2 block text-center">Tamanho {size.toUpperCase()}</label>
                       <input type="number" step="0.01" value={menu.prices[size]} onChange={e => handlePriceChange(size, parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-white/10 p-4 md:p-5 rounded-xl text-white outline-none text-2xl md:text-3xl text-center font-bold font-heading focus:border-orange-500" />
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <label className="text-zinc-500 text-xs md:text-sm font-mono uppercase">Carnes do Dia</label>
                    <button onClick={addMeat} className="text-orange-500 text-xs md:text-sm font-bold bg-orange-500/10 px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors">+ ADICIONAR CARNE</button>
                  </div>
                  {menu.meats.map((meat: any) => (
                    <div key={meat.id} className="flex gap-2">
                      <input type="text" value={meat.name} onChange={e => updateMeat(meat.id, 'name', e.target.value)} className="flex-1 bg-zinc-900 p-3 md:p-4 rounded-xl text-white text-sm md:text-base border border-white/5 focus:border-orange-500 outline-none" />
                      <button onClick={() => updateMeat(meat.id, 'available', !meat.available)} className={`px-4 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-colors ${meat.available ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                        {meat.available ? 'TEM' : 'ACABOU'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <label className="text-zinc-500 text-xs md:text-sm font-mono uppercase">Bebidas e Extras</label>
                    <button onClick={addDrink} className="text-orange-500 text-xs md:text-sm font-bold bg-orange-500/10 px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors">+ ADICIONAR BEBIDA</button>
                  </div>
                  {menu.drinks.map((drink: any) => (
                    <div key={drink.id} className="flex gap-2">
                      <input type="text" value={drink.name} onChange={e => updateDrink(drink.id, 'name', e.target.value)} className="flex-1 bg-zinc-900 p-3 md:p-4 rounded-xl text-white text-sm md:text-base border border-white/5 focus:border-orange-500 outline-none" placeholder="Ex: Coca-Cola 2L" />
                      <input type="number" value={drink.price} onChange={e => updateDrink(drink.id, 'price', parseFloat(e.target.value))} className="w-24 md:w-32 bg-zinc-900 p-3 md:p-4 rounded-xl text-white text-sm md:text-base text-center border border-white/5 focus:border-orange-500 outline-none" placeholder="R$" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {todayOrders.length === 0 ? (
                  <div className="col-span-full text-center py-20 glass-card rounded-2xl text-zinc-500 border border-white/5 md:text-lg">Nenhum pedido para hoje ainda.</div>
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
                  <div key={order.id} className={`glass-card rounded-2xl overflow-hidden flex flex-col border transition-all ${order.status === 'pendente' ? 'border-orange-500/50 shadow-[0_0_20px_rgba(234,88,12,0.15)] scale-[1.02]' : 'border-white/5 hover:border-white/10'}`}>
                    <div className="p-5 border-b border-white/5 flex justify-between items-start">
                      <div>
                        <h3 className="font-heading font-bold text-lg md:text-xl text-white">{order.customer_name}</h3>
                        <p className="font-sans text-xs md:text-sm text-zinc-500 mt-1">{format(new Date(order.created_at), "HH:mm")}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs uppercase font-bold border ${order.status === 'pendente' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : order.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : order.status === 'entregue' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500'}`}>
                          {order.status}
                        </div>
                        {showTimer && (
                          <div className={`flex items-center gap-1.5 font-mono text-xs md:text-sm font-bold px-3 py-1.5 rounded-lg border ${isLate ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' : 'bg-white/5 text-zinc-300 border-white/10'}`}>
                            {isLate ? <AlertTriangle className="w-3 h-3 md:w-4 md:h-4"/> : <Clock className="w-3 h-3 md:w-4 md:h-4"/>}{isLate ? '-' : ''}{timeString}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-grow space-y-4 bg-black/20">
                      <div className="space-y-2">
                        {order.items_json?.map((i:any, idx:number) => (
                          <p key={idx} className="font-sans text-sm md:text-base text-zinc-300 font-medium leading-relaxed">
                            <span className="font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md mr-2">{i.quantity}x</span> {i.name} {i.size && <span className="text-orange-400">({i.size})</span>}
                          </p>
                        ))}
                      </div>
                      <div className="flex justify-between items-end pt-5 border-t border-white/5">
                        <div>
                          <p className="font-mono text-[10px] md:text-xs text-zinc-500 uppercase">{order.payment_method}</p>
                          <p className={`text-xs md:text-sm font-bold mt-1 ${order.delivery_address.includes('RETIRADA') ? 'text-blue-400' : 'text-zinc-400'}`}>
                            {order.delivery_address.includes('RETIRADA') ? '🏪 RETIRADA NO BALCÃO' : '🛵 ENTREGA'}
                          </p>
                        </div>
                        <p className="font-heading font-bold text-2xl text-tertiary">{formatBRL(order.total_amount)}</p>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col gap-3">
                      {order.status === 'pendente' && (
                        <div className="flex gap-3">
                          <button onClick={() => handleOrderStatus(order.id, 'confirmado')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3.5 md:py-4 rounded-xl font-bold text-xs md:text-sm transition-colors shadow-lg shadow-green-600/20"><CheckCircle className="inline w-4 h-4 mr-1"/> ACEITAR PEDIDO</button>
                          <button onClick={() => handleOrderStatus(order.id, 'negado')} className="bg-zinc-800 hover:bg-zinc-700 text-red-500 px-6 py-3.5 md:py-4 rounded-xl font-bold text-xs md:text-sm transition-colors">NEGAR</button>
                        </div>
                      )}
                      {order.status === 'confirmado' && (
                        <>
                          <button onClick={() => handlePrint(order)} className="w-full bg-white hover:bg-zinc-200 text-black py-3.5 md:py-4 rounded-xl font-bold text-xs md:text-sm flex justify-center items-center gap-2 transition-colors"><Printer className="w-4 h-4 md:w-5 md:h-5"/> IMPRIMIR COMANDA</button>
                          <button onClick={() => copyToWhatsApp(order)} className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] py-3.5 md:py-4 rounded-xl font-bold text-xs md:text-sm flex justify-center items-center gap-2 border border-[#25D366]/50 transition-colors"><Copy className="w-4 h-4 md:w-5 md:h-5"/> ENVIAR PRO MOTOBOY (WHATSAPP)</button>
                          <button onClick={() => handleOrderStatus(order.id, 'entregue')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white py-3.5 md:py-4 rounded-xl font-bold text-xs md:text-sm transition-colors mt-2">MARCAR COMO CONCLUÍDO</button>
                        </>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500"><Calendar className="w-6 h-6 md:w-8 md:h-8" /></div>
                  <div>
                    <p className="text-sm md:text-base text-zinc-400 font-bold uppercase tracking-widest">Escolha a data</p>
                    <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="bg-transparent text-xl md:text-2xl font-heading font-bold text-white outline-none mt-1" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg">
                  <p className="text-xs md:text-sm text-zinc-500 uppercase font-bold tracking-widest mb-3">Faturamento Dia</p>
                  <p className="text-3xl md:text-4xl font-heading font-black text-green-400">{formatBRL(totalRevenue)}</p>
                </div>
                <div className="glass-card p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg">
                  <p className="text-xs md:text-sm text-zinc-500 uppercase font-bold tracking-widest mb-3">Ticket Médio</p>
                  <p className="text-3xl md:text-4xl font-heading font-black text-white">{formatBRL(ticketMedio)}</p>
                </div>
                <div className="glass-card p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg">
                  <p className="text-xs md:text-sm text-zinc-500 uppercase font-bold tracking-widest mb-3">Marmitas Vendidas</p>
                  <p className="text-3xl md:text-4xl font-heading font-black text-white">{deliveredOrders.length}</p>
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