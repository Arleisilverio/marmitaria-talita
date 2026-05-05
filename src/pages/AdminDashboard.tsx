import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL } from '../lib/utils';
import { 
  Utensils, 
  Receipt, 
  CheckCircle,
  XCircle,
  Printer,
  Copy,
  Camera,
  Trash2,
  Plus,
  Save,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('orders');
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (activeTab === 'orders') fetchOrders();
    }, 10000);
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

  // -- Funções do Editor de Cardápio --

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMenu({ ...menu, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (size: string, value: number) => {
    setMenu({ ...menu, prices: { ...menu.prices, [size]: value } });
  };

  const updateMeat = (id: string, field: string, value: any) => {
    const newMeats = menu.meats.map((m: any) => m.id === id ? { ...m, [field]: value } : m);
    setMenu({ ...menu, meats: newMeats });
  };
  
  const addMeat = () => {
    const newId = 'm' + Date.now();
    setMenu({ ...menu, meats: [...menu.meats, { id: newId, name: '', available: true }] });
  };
  
  const removeMeat = (id: string) => {
    setMenu({ ...menu, meats: menu.meats.filter((m: any) => m.id !== id) });
  };

  const updateDrink = (id: string, field: string, value: any) => {
    const newDrinks = menu.drinks.map((d: any) => d.id === id ? { ...d, [field]: value } : d);
    setMenu({ ...menu, drinks: newDrinks });
  };
  
  const addDrink = () => {
    const newId = 'd' + Date.now();
    setMenu({ ...menu, drinks: [...menu.drinks, { id: newId, name: '', price: 0 }] });
  };
  
  const removeDrink = (id: string) => {
    setMenu({ ...menu, drinks: menu.drinks.filter((d: any) => d.id !== id) });
  };

  const handleMenuSave = async () => {
    try {
      await api.updateMenu(menu);
      toast.success('Cardápio atualizado com sucesso e já visível aos clientes!');
    } catch (err) {
      toast.error('Erro ao salvar o cardápio. Tente novamente.');
    }
  };

  // -- Funções de Pedidos --

  const handleOrderStatus = async (id: string, status: string) => {
    await api.updateOrderStatus(id, status);
    fetchOrders();
  };

  const copyToWhatsApp = (order: any) => {
    const items = order.itens?.map((i:any) => `${i.quantity}x ${i.name} ${i.size ? `(${i.size})` : ''}`).join('\n') || '';
    const text = `*PEDIDO #${order.id.substring(0, 8).toUpperCase()}*
Cliente: ${order.customer_name}
Telefone: ${order.customer_phone}
Endereço: ${order.delivery_address}
Itens: ${items}
Pagamento: ${order.payment_method?.toUpperCase()}
Total: ${formatBRL(order.total_amount)}`;
    
    navigator.clipboard.writeText(text);
    toast.success("Copiado para o WhatsApp!");
  };

  const handlePrint = (order: any) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 100);
  };

  if (loading && !menu) return <div className="p-8 text-white flex justify-center mt-20">Carregando painel da cozinha...</div>;

  return (
    <div className="min-h-screen bg-surface md:pb-0 pb-20">
      {/* Área de Impressão (invisível na tela, apenas impressora) */}
      {printingOrder && (
        <div className="fixed inset-0 bg-white z-[9999] p-8 text-black font-mono print-only block">
          <div className="max-w-[80mm] mx-auto border-2 border-dashed border-black p-4">
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-xl font-bold uppercase">Marmitaria da Talita</h1>
              <p className="text-xs">Sabor & Tradição Caseira</p>
              <p className="text-xs">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
            
            <div className="mb-4">
              <p className="font-bold uppercase text-xs">PEDIDO: #{printingOrder.id.substring(0, 8).toUpperCase()}</p>
              <p className="text-sm">CLIENTE: {printingOrder.customer_name}</p>
              <p className="text-sm">TEL: {printingOrder.customer_phone}</p>
            </div>

            <div className="mb-4 border-y border-black py-2">
              <p className="font-bold text-xs mb-1">ITENS:</p>
              {printingOrder.itens?.map((i:any, idx:number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{i.quantity}x {i.name} {i.size && `(${i.size})`}</span>
                  <span>{formatBRL(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <p className="font-bold text-xs uppercase">ENDEREÇO:</p>
              <p className="text-sm">{printingOrder.delivery_address}</p>
            </div>

            <div className="border-t-2 border-black pt-2">
              <div className="flex justify-between font-bold text-sm">
                <span>PAGAMENTO:</span>
                <span>{printingOrder.payment_method?.toUpperCase()}</span>
              </div>
              {printingOrder.change_for && (
                <div className="flex justify-between text-xs">
                  <span>Troco para:</span>
                  <span>{formatBRL(parseFloat(printingOrder.change_for))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>TOTAL:</span>
                <span>{formatBRL(printingOrder.total_amount)}</span>
              </div>
            </div>
            <div className="mt-8 text-center text-[10px] uppercase">
              <p>Obrigado pela preferência!</p>
              <p>Bom apetite!</p>
            </div>
          </div>
        </div>
      )}

      {/* Painel Visível */}
      <div className="no-print">
        <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(255,61,0,0.3)] docked full-width top-0 sticky z-50 flex justify-between items-center px-4 py-3 w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-orange-600 hover:text-white transition-colors active:scale-95 p-1 -ml-1">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Utensils className="text-orange-600 w-6 h-6 hidden sm:block" />
            <h1 className="text-lg md:text-xl font-heading font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 uppercase tracking-widest truncate">
              MARMITARIA DA TALITA
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-orange-600 hidden sm:block">ADMIN</span>
            <div className="w-2 h-2 rounded-full bg-green-500 pulse-led"></div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-container py-8 flex flex-col gap-8 md:pl-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-primary mb-1 uppercase">Painel de Gestão</p>
              <h2 className="font-heading text-3xl font-bold text-white">
                {activeTab === 'menu' ? 'Gerenciar Cardápio' : 'Pedidos Recebidos'}
              </h2>
            </div>
            <div className="flex p-1 bg-zinc-900 rounded-lg w-full md:w-auto">
              <button onClick={() => setActiveTab('menu')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-heading text-sm font-bold uppercase transition-all ${activeTab === 'menu' ? 'bg-zinc-800 text-orange-500 shadow-lg shadow-orange-500/10' : 'text-zinc-500 hover:text-white'}`}>
                <Utensils className="w-4 h-4" /> Cardápio
              </button>
              <button onClick={() => setActiveTab('orders')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-heading text-sm font-bold uppercase transition-all ${activeTab === 'orders' ? 'bg-zinc-800 text-orange-500 shadow-lg shadow-orange-500/10' : 'text-zinc-500 hover:text-white'}`}>
                <Receipt className="w-4 h-4" /> Pedidos
              </button>
            </div>
          </div>

          {activeTab === 'menu' && menu && (
            <div className="space-y-8 pb-12">
              <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Editar Prato Principal</h3>
                  <p className="text-xs text-zinc-400">As alterações vão direto para o site principal.</p>
                </div>
                <button onClick={handleMenuSave} className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  <Save className="w-5 h-5" /> PUBLICAR
                </button>
              </div>

              {/* Upload de Imagem */}
              <div className="relative h-64 bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 group flex items-center justify-center shadow-xl">
                {menu.image ? (
                  <img src={menu.image} alt="Menu" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-zinc-700" />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                   <label className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xl hover:scale-105 transition-transform">
                     <Camera className="w-5 h-5" />
                     TIRAR FOTO OU ESCOLHER NA GALERIA
                     {/* Este input abrirá a câmera no celular, ou a galeria se preferir */}
                     <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                   </label>
                </div>
                {/* Dica para mobile - sempre visível se a opacidade group-hover não ativar */}
                <div className="absolute bottom-4 left-0 w-full flex justify-center lg:hidden">
                  <label className="bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                    <Camera className="w-4 h-4" /> ALTERAR FOTO
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Textos Principais */}
              <div className="grid md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-zinc-500 text-xs font-mono uppercase mb-2 block">Nome do Prato (Especial de Hoje)</label>
                   <input type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" />
                 </div>
                 <div>
                   <label className="text-zinc-500 text-xs font-mono uppercase mb-2 block">Descrição dos Acompanhamentos</label>
                   <textarea value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500 resize-none" rows={3} />
                 </div>
              </div>

              {/* Valores */}
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <label className="text-zinc-500 text-xs font-mono uppercase mb-4 block">Valores dos Tamanhos (R$)</label>
                <div className="grid grid-cols-3 gap-4">
                   {['p', 'm', 'g'].map(size => (
                     <div key={size}>
                       <label className="text-white text-sm font-bold uppercase mb-1 block">Tamanho {size}</label>
                       <input type="number" step="0.01" value={menu.prices[size]} onChange={e => handlePriceChange(size, parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500 text-xl font-bold font-heading" />
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Carnes */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <label className="text-zinc-500 text-xs font-mono uppercase">Carnes do Dia</label>
                    <button onClick={addMeat} className="text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-orange-500/20"><Plus className="w-4 h-4"/> ADICIONAR</button>
                  </div>
                  <div className="space-y-3">
                    {menu.meats.map((meat: any) => (
                      <div key={meat.id} className="flex items-center gap-3 bg-zinc-900 p-2 pl-4 rounded-xl border border-white/5">
                        <input type="text" value={meat.name} onChange={e => updateMeat(meat.id, 'name', e.target.value)} className="flex-1 bg-transparent border-none text-white font-bold outline-none" placeholder="Nome da carne" />
                        <label className={`flex items-center gap-2 cursor-pointer text-xs px-3 py-2 rounded-lg transition-colors ${meat.available ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          <input type="checkbox" checked={meat.available} onChange={e => updateMeat(meat.id, 'available', e.target.checked)} className="hidden" />
                          <div className={`w-2 h-2 rounded-full ${meat.available ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                          {meat.available ? 'TEM' : 'ACABOU'}
                        </label>
                        <button onClick={() => removeMeat(meat.id)} className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bebidas */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <label className="text-zinc-500 text-xs font-mono uppercase">Bebidas e Extras</label>
                    <button onClick={addDrink} className="text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-orange-500/20"><Plus className="w-4 h-4"/> ADICIONAR</button>
                  </div>
                  <div className="space-y-3">
                    {menu.drinks.map((drink: any) => (
                      <div key={drink.id} className="flex items-center gap-3 bg-zinc-900 p-2 pl-4 rounded-xl border border-white/5">
                        <input type="text" value={drink.name} onChange={e => updateDrink(drink.id, 'name', e.target.value)} className="flex-1 bg-transparent border-none text-white font-bold outline-none" placeholder="Nome da bebida" />
                        <div className="flex items-center bg-zinc-800 px-3 rounded-lg border border-white/5">
                          <span className="text-zinc-500 text-xs font-bold mr-1">R$</span>
                          <input type="number" step="0.01" value={drink.price} onChange={e => updateDrink(drink.id, 'price', parseFloat(e.target.value) || 0)} className="w-16 bg-transparent border-none text-white font-bold outline-none py-2 text-center" />
                        </div>
                        <button onClick={() => removeDrink(drink.id)} className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.length === 0 ? (
                <div className="col-span-full text-center p-12 glass-card rounded-xl text-zinc-500">Nenhum pedido recebido.</div>
              ) : orders.map(order => (
                <div key={order.id} className="glass-card rounded-xl overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300">
                  <div className="p-4 border-b border-white/5 flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white">{order.customer_name}</h3>
                      <p className="font-sans text-xs text-zinc-500 mt-1">{format(new Date(order.created_at || Date.now()), "dd/MM HH:mm")}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${order.status === 'pendente' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : order.status === 'confirmado' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500'}`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-grow space-y-4">
                    <div className="bg-white/5 p-3 rounded-lg space-y-2">
                      {order.itens?.map((i:any, idx:number) => (
                        <p key={idx} className="font-sans text-sm text-zinc-200 font-medium">
                          {i.quantity}x {i.name} {i.size && <span className="text-orange-400">({i.size})</span>}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-mono text-[10px] text-zinc-500 uppercase">Pagamento</p>
                        <p className="font-sans text-sm text-white uppercase font-bold">{order.payment_method}</p>
                        {order.change_for && <p className="text-xs text-orange-400 mt-1">Troco p/ {order.change_for}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-2xl text-tertiary">{formatBRL(order.total_amount)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-950 flex flex-col gap-2 border-t border-white/5">
                    {order.status === 'pendente' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOrderStatus(order.id, 'confirmado')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"><CheckCircle className="w-4 h-4"/> CONFIRMAR</button>
                        <button onClick={() => handleOrderStatus(order.id, 'negado')} className="flex-1 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white py-3 rounded-xl font-bold text-xs border border-red-600/30 transition-colors"><XCircle className="w-4 h-4"/> NEGAR</button>
                      </div>
                    )}
                    {order.status === 'confirmado' && (
                      <>
                        <button onClick={() => handlePrint(order)} className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"><Printer className="w-4 h-4"/> IMPRIMIR COMANDA</button>
                        <button onClick={() => copyToWhatsApp(order)} className="w-full bg-[#25D366]/20 text-[#25D366] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-[#25D366]/50 hover:bg-[#25D366] hover:text-white transition-colors"><Copy className="w-4 h-4"/> WHATSAPP DO MOTOBOY</button>
                        <button onClick={() => handleOrderStatus(order.id, 'entregue')} className="w-full bg-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl font-bold text-xs transition-colors">FINALIZAR E ARQUIVAR</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}