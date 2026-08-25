import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatBRL, cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { 
  Utensils, Receipt, CheckCircle, Clock, Bike, 
  Plus, Trash2, LogOut, ArrowLeft, Ban, 
  Settings, Save, Coffee, Beef, X, DollarSign,
  ChevronRight, AlertCircle, Camera, ImageIcon, Calendar, Shield, ExternalLink,
  Printer, MapPin, MessageSquare, Bot, Sparkles, RefreshCw, Users, ShieldCheck
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useOrders, useMenu, useUpdateOrderStatus, useSaveMenu, queryKeys } from '../lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { STORE_TEMPLATES } from '../lib/templates';
import OrderChatModal from '../components/OrderChatModal';
import OrderChatButton from '../components/OrderChatButton';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings' | 'reports' | 'marketing' | 'couriers'>('orders');
  const [reportDate, setReportDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [menu, setMenu] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any>(null);
  
  // Modals state
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkPrice, setNewDrinkPrice] = useState('');
  const [showMeatModal, setShowMeatModal] = useState(false);
  const [newMeatName, setNewMeatName] = useState('');

  // Product/Espeto Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('Espetos Tradicionais');
  const [newProdStock, setNewProdStock] = useState('30');
  const [newProdImg, setNewProdImg] = useState('');

  // Motoboys State
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('');
  const [newCourierEmail, setNewCourierEmail] = useState('');
  const [newCourierPassword, setNewCourierPassword] = useState('');
  const [newCourierPlate, setNewCourierPlate] = useState('');
  const [savingCourier, setSavingCourier] = useState(false);
  const [dispatchingOrder, setDispatchingOrder] = useState<any>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [finalizingAll, setFinalizingAll] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');
      setUserEmail(user.email || '');

      const [adminData, profile] = await Promise.all([
        api.checkAdminAccess(user.email!),
        api.getProfile(user.id)
      ]);

      if (!adminData && user.email !== 'arleisilverio41@gmail.com') {
        toast.error("Acesso negado.");
        return navigate('/');
      }

      const isProfileComplete = !!(profile?.full_name && profile?.phone && profile?.address);
      setIsProfileComplete(isProfileComplete);

      if (adminData) {
        if (adminData.status === 'blocked') {
          setIsBlocked(true);
          return;
        }

        // Apenas notificamos se o perfil estiver incompleto e não for o Super Admin
        if (!isProfileComplete && user.email !== 'arleisilverio41@gmail.com') {
          toast.error("Atenção: Seu perfil está incompleto. Alguns recursos podem estar limitados.", { id: 'admin-profile-warning' });
        }

        setStoreSlug(adminData.slug);
      } else if (user.email === 'arleisilverio41@gmail.com') {
        setStoreSlug('da-quebrada');
      }
    } catch (err) {
      console.error("Erro no checkAccess:", err);
      toast.error("Erro ao validar acesso.");
      navigate('/');
    } finally {
      setLoadingAuth(false);
    }
  };

  const { data: menuData, isLoading: loadingMenu } = useMenu(storeSlug);
  const { data: orders = [], isLoading: loadingOrders } = useOrders(storeSlug);
  const { mutateAsync: updateStatus } = useUpdateOrderStatus(storeSlug);
  const { mutateAsync: saveMenuApi } = useSaveMenu(storeSlug);

  useEffect(() => {
    if (menuData && !menu) {
      setMenu(menuData);
    }
  }, [menuData]);

  const loading = loadingAuth || (!isBlocked && (loadingMenu || loadingOrders || !menu));

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ id: orderId, status: newStatus });
      toast.success(`Pedido ${newStatus}!`);
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      const savedData = await saveMenuApi(menu);
      setMenu(savedData);
      toast.success("Cardápio salvo com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const updatePrice = (size: 'p' | 'm' | 'g', value: string) => {
    const cleaned = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    setMenu({ ...menu, prices: { ...menu.prices, [size]: cleaned } });
  };

  const addDrink = () => {
    setShowDrinkModal(true);
  };

  const handleAddDrinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDrinkName && newDrinkPrice) {
      // Clean price: remove R$, spaces, and handle comma
      const cleanPrice = newDrinkPrice.replace(/[R$\s]/g, '').replace(',', '.');
      const newDrink = { id: Date.now().toString(), name: newDrinkName, price: parseFloat(cleanPrice) || 0 };
      setMenu({ ...menu, drinks: [...(menu.drinks || []), newDrink] });
      setShowDrinkModal(false);
      setNewDrinkName('');
      setNewDrinkPrice('');
    }
  };

  const handleApplyTemplate = (nicheKey: string) => {
    const template = STORE_TEMPLATES[nicheKey];
    if (!template) return;
    if (window.confirm(`Deseja aplicar o modelo "${template.label}"? Os itens e categorias deste modelo serão carregados.`)) {
      setMenu({
        ...menu,
        ...template.menu_data,
        title: menu?.title || template.menu_data.title
      });
      toast.success(`Modelo "${template.label}" aplicado! Lembre-se de salvar.`);
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return toast.error("Preencha nome e preço.");
    const newProduct = {
      id: `prod_${Date.now()}`,
      name: newProdName,
      description: newProdDesc,
      price: parseFloat(newProdPrice.replace(',', '.')) || 0,
      category: newProdCat || 'Espetos Tradicionais',
      stock: parseInt(newProdStock) || 0,
      available: (parseInt(newProdStock) || 0) > 0,
      image: newProdImg || ''
    };
    setMenu({
      ...menu,
      products: [...(menu.products || []), newProduct]
    });
    setShowProductModal(false);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setNewProdStock('30');
    setNewProdImg('');
    toast.success("Item adicionado ao cardápio!");
  };

  const handleProductImageUpload = (productId: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMenu({
        ...menu,
        products: menu.products.map((p: any) => p.id === productId ? { ...p, image: reader.result as string } : p)
      });
      toast.success("Foto do item atualizada! Clique em Salvar.");
    };
    reader.readAsDataURL(file);
  };

  const handleNewProductImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewProdImg(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleProductAvailable = (productId: string) => {
    setMenu({
      ...menu,
      products: menu.products?.map((p: any) => p.id === productId ? { ...p, available: !p.available } : p)
    });
  };

  const removeProduct = (productId: string) => {
    setMenu({
      ...menu,
      products: menu.products?.filter((p: any) => p.id !== productId)
    });
    toast.success("Item removido.");
  };

  const addMeat = () => {
    setShowMeatModal(true);
  };

  const handleAddMeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMeatName) {
      setMenu({ ...menu, meats: [...(menu.meats || []), newMeatName] });
      setShowMeatModal(false);
      setNewMeatName('');
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success("Foto principal enviada. Lembre-se de salvar!");
    const reader = new FileReader();
    reader.onloadend = () => setMenu({ ...menu, image: reader.result });
    reader.readAsDataURL(file);
  };

  const addSlide = () => {
    const newSlide = { id: Date.now().toString(), image: '', title: '', description: '' };
    setMenu({ ...menu, slides: [...(menu.slides || []), newSlide] });
  };

  const removeSlide = (id: string) => {
    setMenu({ ...menu, slides: menu.slides.filter((s: any) => s.id !== id) });
  };

  const updateSlide = (id: string, field: string, value: string) => {
    setMenu({ ...menu, slides: menu.slides.map((s: any) => s.id === id ? { ...s, [field]: value } : s) });
  };

  const handleSlideImageUpload = async (id: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success("Foto do slide enviada. Lembre-se de salvar!");
    const reader = new FileReader();
    reader.onloadend = () => updateSlide(id, 'image', reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- FUNÇÕES DE GESTÃO DE MOTOBOYS ---
  const loadCouriers = async () => {
    if (!storeSlug) return;
    setLoadingCouriers(true);
    try {
      const data = await api.getCouriers(storeSlug);
      setCouriers(data);
    } catch (e) {
      console.warn("Erro ao carregar motoboys:", e);
    } finally {
      setLoadingCouriers(false);
    }
  };

  useEffect(() => {
    if (storeSlug) {
      loadCouriers();
    }
  }, [storeSlug, activeTab]);

  const handleAddCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName || !newCourierEmail || !newCourierPassword) {
      return toast.error("Preencha nome, e-mail e senha do motoboy.");
    }
    setSavingCourier(true);
    try {
      await api.addCourier(storeSlug, {
        name: newCourierName,
        phone: newCourierPhone,
        email: newCourierEmail,
        password: newCourierPassword,
        vehicle_plate: newCourierPlate
      });
      toast.success("Motoboy cadastrado com sucesso! 🛵");
      setShowCourierModal(false);
      setNewCourierName('');
      setNewCourierPhone('');
      setNewCourierEmail('');
      setNewCourierPassword('');
      setNewCourierPlate('');
      await loadCouriers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar motoboy.");
    } finally {
      setSavingCourier(false);
    }
  };

  const handleDeleteCourier = async (courierId: string, courierName: string) => {
    if (!window.confirm(`Deseja remover o motoboy "${courierName}" da sua loja?`)) return;
    try {
      await api.deleteCourier(storeSlug, courierId);
      toast.success("Motoboy removido.");
      await loadCouriers();
    } catch (err: any) {
      toast.error("Erro ao remover motoboy.");
    }
  };

  const handleToggleCourierStatus = async (courier: any) => {
    const newStatus = courier.status === 'available' ? 'offline' : 'available';
    try {
      await api.updateCourier(storeSlug, courier.id, {
        status: newStatus,
        queue_joined_at: new Date().toISOString()
      });
      toast.success(newStatus === 'available' ? `${courier.name} está disponível na fila!` : `${courier.name} foi pausado.`);
      await loadCouriers();
    } catch (err: any) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDispatchOrderToCourier = async (order: any, courierId?: string) => {
    const available = couriers.filter(c => c.status === 'available');
    let targetCourier = null;

    if (courierId) {
      targetCourier = couriers.find(c => c.id === courierId);
    } else if (available.length > 0) {
      targetCourier = available[0]; // 1º da fila de revezamento!
    }

    if (!targetCourier) {
      // Se não há motoboy na fila, avança status normalmente
      return handleUpdateStatus(order.id, 'confirmado');
    }

    try {
      await api.dispatchOrderToCourier(order.id, targetCourier.id, targetCourier.name, storeSlug);
      toast.success(`Pedido despachado para ${targetCourier.name} (1º da Fila)! 🛵`);
      setDispatchingOrder(null);
      setSelectedCourierId('');
      await Promise.all([
        loadCouriers(),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders(storeSlug) })
      ]);
    } catch (err: any) {
      toast.error("Erro ao despachar pedido.");
    }
  };

  const handleDispatchBatch = async (courierId: string) => {
    if (selectedOrderIds.length === 0) return toast.error("Nenhum pedido selecionado.");
    const targetCourier = couriers.find(c => c.id === courierId) || couriers.find(c => c.status === 'available');

    if (!targetCourier) {
      return toast.error("Selecione um motoboy para receber o lote de entregas.");
    }

    try {
      await api.dispatchMultipleOrdersToCourier(selectedOrderIds, targetCourier.id, targetCourier.name, storeSlug);
      toast.success(`Lote de ${selectedOrderIds.length} pedidos despachado para ${targetCourier.name}! 🛵📦`);
      setSelectedOrderIds([]);
      await Promise.all([
        loadCouriers(),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders(storeSlug) })
      ]);
    } catch (err: any) {
      toast.error("Erro ao despachar lote de entregas.");
    }
  };

  // Botão de Modo Teste: Conclui todos os pedidos abertos da loja
  const handleFinalizeAllOrders = async () => {
    const pendingOrders = todayOrders.filter(o => o.status === 'pendente' || o.status === 'confirmado');
    if (pendingOrders.length === 0) {
      return toast.error("Não há pedidos pendentes ou em rota para finalizar.");
    }

    if (!window.confirm(`Deseja marcar todos os ${pendingOrders.length} pedidos pendentes/em rota como "ENTREGUES"? (Modo de Teste)`)) {
      return;
    }

    setFinalizingAll(true);
    try {
      // 1. Atualiza todos os pedidos abertos para 'entregue'
      for (const order of pendingOrders) {
        await supabase
          .from('orders')
          .update({
            status: 'entregue',
            delivered_at: new Date().toISOString()
          })
          .eq('id', order.id);
      }

      // 2. Libera todos os motoboys ocupados de volta para a fila
      for (const c of couriers) {
        if (c.status === 'busy') {
          await api.updateCourier(storeSlug, c.id, {
            status: 'available',
            queue_joined_at: new Date().toISOString()
          });
        }
      }

      toast.success(`🎉 Todos os ${pendingOrders.length} pedidos foram finalizados como Entregues!`);
      setSelectedOrderIds([]);
      await Promise.all([
        loadCouriers(),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders(storeSlug) })
      ]);
    } catch (err: any) {
      toast.error("Erro ao finalizar pedidos.");
    } finally {
      setFinalizingAll(false);
    }
  };

  const handlePrintOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Erro ao abrir janela de impressão.");

    const itemsHtml = order.items_json?.map((item: any) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>${item.quantity}x ${typeof item.name === 'object' ? item.name.name : item.name} ${item.size ? `(${item.size})` : ''}</span>
        <span>${formatBRL(item.price * item.quantity)}</span>
      </div>
    `).join('');

    const content = `
      <html>
        <head>
          <title>Comanda - ${order.customer_name}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              padding: 10px; 
              margin: 0;
              font-size: 12px;
              color: #000;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
            .section { border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 20px; font-style: italic; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${menu?.title || 'Loja'}</div>
            <div>${format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</div>
          </div>
          
          <div class="section">
            <div><span class="bold">CLIENTE:</span> ${order.customer_name}</div>
            <div><span class="bold">TEL:</span> ${order.customer_phone}</div>
            <div style="margin-top: 5px;"><span class="bold">ENDEREÇO:</span> ${order.delivery_address}</div>
          </div>

          <div class="section">
            <div class="bold" style="margin-bottom: 10px;">ITENS:</div>
            ${itemsHtml}
          </div>

          <div class="section">
            <div style="display: flex; justify-content: space-between;">
              <span class="bold">PAGAMENTO:</span>
              <span>${order.payment_method.toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; margin-top: 5px;">
              <span class="bold">TOTAL:</span>
              <span class="bold">${formatBRL(order.total_amount)}</span>
            </div>
          </div>

          <div class="footer">
            Obrigado pela preferência!
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Sincronizando Loja...</p>
    </div>
  );

  if (isBlocked) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
      <div className="max-w-md bg-zinc-900 p-10 rounded-3xl border border-red-500/30 shadow-2xl">
        <Ban className="mx-auto text-red-500 w-16 h-16 mb-6"/>
        <h2 className="text-2xl font-bold text-white mb-4">Acesso Suspenso</h2>
        <p className="text-zinc-500">Sua conta de lojista está inativa. Fale com o suporte.</p>
        <button onClick={() => navigate('/')} className="mt-8 text-zinc-400 underline">Voltar</button>
      </div>
    </div>
  );

  const todayOrders = orders.filter(o => {
    if (!o?.created_at) return false;
    try {
      return isSameDay(new Date(o.created_at), new Date());
    } catch {
      return false;
    }
  });
  
  // Reports Logic
  const reportOrders = orders.filter(o => {
    if (!o?.created_at) return false;
    try {
      const orderDate = format(new Date(o.created_at), 'yyyy-MM-dd');
      return orderDate === reportDate;
    } catch {
      return false;
    }
  });
  const deliveredOrders = reportOrders.filter(o => o.status === 'entregue');
  const totalRevenue = deliveredOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
  const ticketMedio = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER PREMIUM */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/${storeSlug}`)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight uppercase">{menu?.title || 'Loja'}</h1>
            <div className="flex items-center gap-2">
               <span className="text-[10px] text-primary font-black uppercase tracking-widest">Painel Admin</span>
               <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
               <span className="text-[10px] text-zinc-500 font-mono uppercase">v2.0 Multi-Loja</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href={`/${storeSlug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Ver Loja Online
          </a>
          <button 
            onClick={async () => {
              const updated = { ...menu, isOpen: !menu.isOpen };
              setMenu(updated);
              try {
                await saveMenuApi(updated);
                toast.success(updated.isOpen ? "Loja Aberta!" : "Loja Fechada!");
              } catch (err: any) {
                toast.error(err.message || "Erro ao alterar status da loja.");
                // Reverte o estado visual se falhar
                setMenu(menu);
              }
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              menu.isOpen ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {menu.isOpen ? 'LOJA ABERTA' : 'FECHADA'}
          </button>
          {userEmail === 'arleisilverio41@gmail.com' && (
            <button onClick={() => navigate('/super-admin')} className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors border border-white/10 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Super Admin
            </button>
          )}
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
          <button onClick={() => setActiveTab('orders')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'orders' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Receipt className="w-4 h-4" /> Pedidos ({todayOrders.length})
          </button>
          <button onClick={() => setActiveTab('couriers')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'couriers' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Bike className="w-4 h-4" /> Motoboys ({couriers.length}/5)
          </button>
          <button onClick={() => setActiveTab('menu')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'menu' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Utensils className="w-4 h-4" /> Cardápio
          </button>
          <button onClick={() => setActiveTab('settings')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Settings className="w-4 h-4" /> Configs
          </button>
          <button onClick={() => setActiveTab('marketing')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'marketing' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Camera className="w-4 h-4" /> Divulgação
          </button>
          <button onClick={() => setActiveTab('reports')} className={cn("px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'reports' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500")}>
            <Calendar className="w-4 h-4" /> Relatórios
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ABA PEDIDOS */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* BARRA FLUTUANTE DE DESPACHO EM LOTE (MESMA REGIÃO/BAIRRO) */}
              {selectedOrderIds.length > 0 && (
                <div className="col-span-full sticky top-24 z-30 bg-zinc-950/95 border-2 border-primary/40 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Bike className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        📦 {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados para a mesma rota'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Atribua entregas da mesma região/bairro para o mesmo motoboy na mesma viagem.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      id="batch-courier-select"
                      className="bg-zinc-900 border border-white/10 text-white text-xs py-3 px-4 rounded-xl outline-none"
                    >
                      {couriers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.status === 'available' ? '🟢 1º da Fila' : c.status === 'busy' ? '🟡 Já em Rota' : '⚪ Pausa'})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        const select = document.getElementById('batch-courier-select') as HTMLSelectElement;
                        const targetId = select?.value || couriers[0]?.id;
                        handleDispatchBatch(targetId);
                      }}
                      className="bg-gradient-to-r from-orange-600 to-primary text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Bike className="w-4 h-4" /> Despachar Lote
                    </button>

                    <button
                      onClick={() => setSelectedOrderIds([])}
                      className="px-4 py-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* BARRA DE CONTROLE & BOTÃO DE MODO TESTE */}
              <div className="col-span-full flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-3xl border border-white/5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">Painel de Pedidos</h3>
                    <p className="text-[11px] text-zinc-400">
                      {todayOrders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length} em andamento / {todayOrders.length} total hoje
                    </p>
                  </div>
                </div>

                {todayOrders.some(o => o.status === 'pendente' || o.status === 'confirmado') && (
                  <button
                    onClick={handleFinalizeAllOrders}
                    disabled={finalizingAll}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95 cursor-pointer"
                    title="Finaliza todos os pedidos abertos da loja como entregues (Modo de Teste)"
                  >
                    {finalizingAll ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Finalizando Todos...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        ⚡ Finalizar Todos os Pedidos (Modo Teste)
                      </>
                    )}
                  </button>
                )}
              </div>

              {todayOrders.length === 0 ? (
                <div className="col-span-full py-24 text-center text-zinc-600 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                  <Receipt className="mx-auto w-12 h-12 mb-4 opacity-20" />
                  <p className="font-heading font-bold">Nenhum pedido hoje.</p>
                  <p className="text-xs">Os pedidos aparecerão aqui assim que chegarem.</p>
                </div>
              ) : (
                todayOrders.map(order => (
                  <div key={order.id} className={cn(
                    "bg-zinc-900 border rounded-3xl p-6 flex flex-col shadow-xl transition-all",
                    selectedOrderIds.includes(order.id) ? "border-primary ring-2 ring-primary/30" : "border-white/5"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3">
                        {/* CHECKBOX PARA SELEÇÃO EM LOTE */}
                        {order.status !== 'entregue' && order.status !== 'cancelado' && (
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => {
                              setSelectedOrderIds(prev => 
                                prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                              );
                            }}
                            className="mt-1 w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                            title="Selecionar para rota em lote"
                          />
                        )}
                        <div>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{format(new Date(order.created_at), "HH:mm")}</p>
                          <h3 className="text-white font-bold text-lg leading-tight">{order.customer_name}</h3>
                          <p className="text-xs text-zinc-400">{order.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePrintOrder(order)}
                          className="p-3 bg-white/5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title="Imprimir Comanda"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <span className={cn(
                          "px-3 py-1 h-fit rounded-full text-[9px] font-black uppercase tracking-widest",
                          order.status === 'pendente' ? "bg-primary/10 text-primary border border-primary/20" :
                          order.status === 'confirmado' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-green-500/10 text-green-500 border border-green-500/20"
                        )}>{order.status}</span>
                      </div>
                    </div>

                    {/* INDICADOR DE MOTOBOY ATRIBUÍDO */}
                    {order.courier_name && (
                      <div className="mb-4 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-zinc-400 flex items-center gap-1.5"><Bike className="w-4 h-4 text-orange-400" /> Motoboy:</span>
                        <b className="text-orange-400">{order.courier_name}</b>
                      </div>
                    )}

                    <div className="mb-6 flex items-start gap-2 bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Endereço de Entrega</p>
                        <p className={cn("text-xs font-medium", order.delivery_address === 'RETIRADA' ? "text-secondary" : "text-white")}>
                          {order.delivery_address}
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 mb-6 space-y-2 flex-grow border border-white/5">
                      {order.items_json?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300">
                            <b className="text-primary mr-2">{item.quantity}x</b> 
                            {/* FIX: Check if name is object or string */}
                            {typeof item.name === 'object' ? item.name.name : item.name} 
                            {item.size && <span className="text-zinc-600 text-xs ml-1">({item.size})</span>}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-mono">
                        <span className="bg-white/5 px-2 py-0.5 rounded">{order.payment_method}</span>
                        <span className="text-white font-bold text-lg">{formatBRL(order.total_amount)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {order.status === 'pendente' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateStatus(order.id, 'confirmado')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20">
                              Aceitar Pedido
                            </button>
                            {couriers.filter(c => c.status === 'available').length > 0 && (
                              <button 
                                onClick={() => handleDispatchOrderToCourier(order)} 
                                className="px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-1 shadow-lg shadow-orange-600/20"
                                title="Despachar direto para o 1º da Fila de Motoboys"
                              >
                                <Bike className="w-4 h-4" /> 1º da Fila
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === 'confirmado' && (
                          <div className="space-y-2">
                            <button 
                              onClick={() => handleDispatchOrderToCourier(order)} 
                              className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                            >
                              <Bike className="w-4 h-4"/> 
                              {couriers.filter(c => c.status === 'available').length > 0 
                                ? `Despachar para ${couriers.filter(c => c.status === 'available')[0].name} (1º da Fila)` 
                                : 'Saiu para Entrega'}
                            </button>
                            {couriers.length > 1 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) handleDispatchOrderToCourier(order, e.target.value);
                                }}
                                defaultValue=""
                                className="w-full bg-black/50 border border-white/10 text-zinc-400 text-[11px] py-2 px-3 rounded-xl outline-none"
                              >
                                <option value="" disabled>Ou escolha outro motoboy da lista...</option>
                                {couriers.map((c: any) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.status === 'available' ? '🟢 Na Fila' : c.status === 'busy' ? '🟡 Em Rota' : '⚪ Pausa'})
                                  </option>
                                ))}
                              </select>
                            )}

                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'entregue')} 
                              className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                              title="Marcar como entregue"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Marcar como Entregue ✓
                            </button>
                          </div>
                        )}

                        {order.status === 'entregue' && (
                          <div className="w-full bg-green-500/10 text-green-500 py-3 rounded-xl font-bold text-xs uppercase text-center border border-green-500/20">
                            Pedido Entregue ✓
                          </div>
                        )}
                        {order.status === 'cancelado' && (
                          <div className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl font-bold text-xs uppercase text-center border border-red-500/20">Pedido Cancelado ✕</div>
                        )}

                        {/* BOTÃO DE CHAT DIRETO COM O CLIENTE (COM BADGE NEON PULSANTE) */}
                        <div className="mt-1">
                          <OrderChatButton
                            orderId={order.id}
                            senderType="store"
                            label="Chat com o Cliente / Acordo"
                            onClick={() => setSelectedOrderForChat(order)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ABA CARDÁPIO */}
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-white font-bold text-xl flex items-center gap-2"><Utensils className="text-primary"/> Gerenciar Cardápio</h2>
                  <p className="text-zinc-500 text-xs mt-1">Configure os itens, preços e modelos da sua loja.</p>
                </div>
                <button onClick={handleSaveMenu} disabled={saving} className="w-full md:w-auto bg-primary px-10 py-4 rounded-xl font-heading font-black text-white shadow-xl shadow-primary/20 active:scale-95 transition-all">
                  {saving ? 'SALVANDO...' : 'SALVAR TODAS AS ALTERAÇÕES'}
                </button>
              </div>

              {/* SELETOR RÁPIDO DE MODELO / NICHO DE LOJA */}
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest block">Templates Prontos</span>
                    <h3 className="text-white font-bold text-lg">Aplicar Modelo de Loja com 1 Clique</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'espetinho', label: '🍢 Espetinhos', desc: 'Churrasco & Jantinhas' },
                    { id: 'marmitaria', label: '🍱 Marmitaria', desc: 'Marmitas P/M/G' },
                    { id: 'bolos_doces', label: '🍰 Doces & Bolos', desc: 'Fatias, Tortas & Potes' },
                    { id: 'hamburgueria', label: '🍔 Hamburgueria', desc: 'Burgers & Combos' }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className="p-3.5 bg-black/40 hover:bg-primary/20 border border-white/5 hover:border-primary/40 rounded-2xl text-left transition-all group"
                    >
                      <p className="text-white font-bold text-sm group-hover:text-primary transition-colors">{tpl.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* SE A LOJA POSSUIR PRODUTOS/ESPETOS NO CARDÁPIO */}
              {menu.products && menu.products.length > 0 && (
                <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-white">Espetos & Produtos em Destaque ({menu.products.length})</h3>
                      <p className="text-zinc-500 text-sm mt-1">Gerencie os preços, fotos e disponibilidade de cada espeto/item.</p>
                    </div>
                    <button 
                      onClick={() => setShowProductModal(true)} 
                      className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 transition-all self-start"
                    >
                      <Plus className="w-4 h-4" /> NOVO ITEM / ESPETO
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menu.products.map((prod: any) => (
                      <div key={prod.id} className="bg-zinc-900/60 border border-white/10 p-5 rounded-3xl flex flex-col justify-between hover:border-primary/40 transition-all shadow-xl">
                        <div className="space-y-3">
                          {/* FOTO DO LANCHE / PRODUTO */}
                          <div className="relative w-full h-44 bg-zinc-950 rounded-2xl overflow-hidden group border border-white/5 flex items-center justify-center">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="flex flex-col items-center text-zinc-600">
                                <ImageIcon className="w-10 h-10 mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Sem Foto</span>
                              </div>
                            )}

                            {/* BOTÃO FLUTUANTE DE TROCAR FOTO DA GALERIA DO CEL / PC */}
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                              <Camera className="w-6 h-6 mb-1 text-primary" />
                              <span className="text-xs font-bold uppercase tracking-wider">Trocar Foto</span>
                              <span className="text-[9px] text-zinc-400">Galeria ou Câmera</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleProductImageUpload(prod.id, e)} 
                              />
                            </label>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-white/5 text-primary font-bold">
                              {prod.category || 'Geral'}
                            </span>
                            <button 
                              type="button"
                              onClick={() => removeProduct(prod.id)} 
                              className="text-zinc-600 hover:text-red-500 p-1 transition-colors"
                              title="Excluir Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* EDIÇÃO DO NOME DO ITEM */}
                          <div>
                            <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-1">Nome do Lanche / Item</label>
                            <input 
                              type="text"
                              value={prod.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setMenu({
                                  ...menu,
                                  products: menu.products.map((p: any) => p.id === prod.id ? { ...p, name: newName } : p)
                                });
                              }}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none focus:border-primary"
                              placeholder="Nome do lanche"
                            />
                          </div>

                          {/* EDIÇÃO DA DESCRIÇÃO / INGREDIENTES */}
                          <div>
                            <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-1">Descrição / Ingredientes</label>
                            <textarea 
                              rows={2}
                              value={prod.description || ''}
                              onChange={(e) => {
                                const newDesc = e.target.value;
                                setMenu({
                                  ...menu,
                                  products: menu.products.map((p: any) => p.id === prod.id ? { ...p, description: newDesc } : p)
                                });
                              }}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-zinc-300 text-xs outline-none focus:border-primary resize-none"
                              placeholder="Ex: Pão brioche, 160g de blend, queijo cheddar, bacon crocante..."
                            />
                          </div>
                        </div>

                        {/* PREÇO, ESTOQUE E DISPONIBILIDADE */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-3">
                          <div>
                            <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">Preço (R$)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-zinc-400 font-bold">R$</span>
                              <input 
                                type="number" 
                                step="0.50"
                                value={prod.price}
                                onChange={(e) => {
                                  const newP = parseFloat(e.target.value) || 0;
                                  setMenu({
                                    ...menu,
                                    products: menu.products.map((p: any) => p.id === prod.id ? { ...p, price: newP } : p)
                                  });
                                }}
                                className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white text-sm font-black outline-none focus:border-primary"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">Qtd Disponível (un)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={prod.stock ?? 30}
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0;
                                setMenu({
                                  ...menu,
                                  products: menu.products.map((p: any) => p.id === prod.id ? { 
                                    ...p, 
                                    stock: newStock,
                                    available: newStock > 0 
                                  } : p)
                                });
                              }}
                              className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white text-sm font-black outline-none focus:border-primary text-center"
                            />
                          </div>
                        </div>

                        <div className="pt-3 flex justify-between items-center">
                          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full", (prod.stock ?? 1) > 5 ? "bg-green-500" : (prod.stock ?? 1) > 0 ? "bg-amber-500" : "bg-red-500")} />
                            {prod.stock !== undefined ? `${prod.stock} un disponíveis` : 'Estoque ilimitado'}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleProductAvailable(prod.id)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                              prod.available !== false && (prod.stock ?? 1) > 0 
                                ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" 
                                : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            )}
                          >
                            {prod.available !== false && (prod.stock ?? 1) > 0 ? 'DISPONÍVEL' : 'ESGOTADO'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Carrossel de Destaques (Topo)</h3>
                    <p className="text-zinc-500 text-sm mt-1">Adicione banners, avisos ou promoções que ficarão rodando no topo.</p>
                  </div>
                  <button onClick={addSlide} className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> ADICIONAR SLIDE
                  </button>
                </div>

                <div className="space-y-6">
                  {!menu.slides || menu.slides.length === 0 ? <p className="text-zinc-500 text-center py-4">Nenhum slide configurado.</p> : null}
                  
                  {menu.slides?.map((slide: any) => (
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
                            <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Título do Slide</label>
                             <input name="slide_title" autoComplete="off" type="text" value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-white outline-none focus:border-primary text-sm font-bold" />
                          </div>
                          <button onClick={() => removeSlide(slide.id)} className="text-red-500 hover:bg-red-500/10 p-3 rounded-lg h-fit transition-colors mt-5">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase text-zinc-500 mb-1 block">Subtítulo / Descrição</label>
                           <input name="slide_description" autoComplete="off" type="text" value={slide.description} onChange={e => updateSlide(slide.id, 'description', e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-white outline-none focus:border-primary text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SE FOR MODELO DE MARMITARIA (P, M, G) */}
              {menu.prices && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* PREÇOS */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
                    <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary"/> Preços das Marmitas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['p', 'm', 'g'].map(size => (
                        <div key={size}>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Tamanho {size.toUpperCase()}</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">R$</span>
                             <input 
                              name={`price_${size}`}
                              autoComplete="off"
                              type="text" 
                              value={menu.prices?.[size] || '0'} 
                              onChange={e => updatePrice(size as any, e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 pl-8 text-white outline-none focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARNES */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Beef className="w-4 h-4 text-primary"/> Carnes do Dia</h3>
                      <button onClick={addMeat} className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"><Plus/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {menu.meats?.map((meat: any, idx: number) => {
                        const meatName = typeof meat === 'object' ? meat.name : meat;
                        return (
                          <span key={idx} className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 border border-white/5 group">
                            {meatName}
                            <button onClick={() => setMenu({ ...menu, meats: menu.meats.filter((_:any, i:number) => i !== idx) })} className="text-zinc-600 group-hover:text-red-500">
                              <X className="w-3 h-3"/>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* BEBIDAS */}
              <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Coffee className="w-4 h-4 text-primary"/> Bebidas e Acompanhamentos Extras</h3>
                  <button onClick={addDrink} className="bg-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-primary/20 flex items-center gap-2"><Plus className="w-4 h-4"/> Novo Item</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {menu.drinks?.map((drink: any) => (
                    <div key={drink.id || drink.name} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-primary/20 transition-colors">
                      <div>
                        <p className="text-white font-bold text-sm">{drink.name}</p>
                        <p className="text-primary text-xs font-bold">{formatBRL(drink.price)}</p>
                      </div>
                      <button onClick={() => setMenu({ ...menu, drinks: menu.drinks.filter((d: any) => (d.id || d.name) !== (drink.id || drink.name)) })} className="text-zinc-700 group-hover:text-red-500">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA CONFIGURAÇÕES */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto space-y-6">
              <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/5 shadow-2xl">
                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Settings className="text-primary"/> Configurações Gerais</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Nome Público da Loja</label>
                    <input name="store_name" autoComplete="off" type="text" value={menu.title} onChange={e => setMenu({...menu, title: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Slogan / Frase de Impacto</label>
                    <input name="store_description" autoComplete="off" type="text" value={menu.description} onChange={e => setMenu({...menu, description: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Delivery via Motoboy</label>
                    <button 
                      type="button"
                      onClick={() => setMenu({ ...menu, hasDelivery: !Boolean(menu.hasDelivery) })} 
                      className={cn(
                        "w-full p-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all border",
                        menu.hasDelivery ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {menu.hasDelivery ? 'ATIVADO' : 'DESATIVADO'}
                    </button>
                    <p className="text-[9px] text-zinc-600 uppercase font-bold text-center">Desative para esconder a opção de entrega no checkout</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Taxa de Entrega (R$)</label>
                    <input name="delivery_fee" autoComplete="off" type="text" value={menu.deliveryFee} onChange={e => setMenu({...menu, deliveryFee: e.target.value.replace(',', '.')})} disabled={!menu.hasDelivery} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary disabled:opacity-50"/>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Tempo de Preparo (Min)</label>
                    <input name="prep_time" autoComplete="off" type="number" value={menu.prepTime} onChange={e => setMenu({...menu, prepTime: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary"/>
                  </div>
                </div>

                {/* CONFIGURAÇÕES DO GARÇOM IA */}
                <div className="p-6 rounded-2xl bg-zinc-950/60 border border-orange-500/20 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-primary shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-base flex items-center gap-2 flex-wrap">
                          Garçom IA / Atendente Virtual
                          <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                            GPT-4o Mini
                          </span>
                        </h3>
                        <p className="text-zinc-400 text-xs">Atende clientes, tira dúvidas, sugere pratos e ajuda a montar pedidos no app.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMenu({
                        ...menu,
                        ai_config: {
                          ...(menu.ai_config || {}),
                          enabled: menu.ai_config?.enabled === false ? true : false
                        }
                      })}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border self-start sm:self-auto",
                        menu.ai_config?.enabled !== false
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-zinc-800 text-zinc-500 border-white/10"
                      )}
                    >
                      {menu.ai_config?.enabled !== false ? 'ATIVADO' : 'DESATIVADO'}
                    </button>
                  </div>

                  {menu.ai_config?.enabled !== false && (
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                          Nome do Garçom / Bot
                        </label>
                        <input
                          name="ai_bot_name"
                          autoComplete="off"
                          type="text"
                          placeholder="Ex: Garçom Virtual, Zé do Espeto, Quebrada AI"
                          value={menu.ai_config?.botName ?? ''}
                          onChange={e => setMenu({
                            ...menu,
                            ai_config: {
                              ...(menu.ai_config || {}),
                              botName: e.target.value
                            }
                          })}
                          className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-primary text-sm"
                        />
                        <p className="text-[10px] text-zinc-500">Nome exibido no balão de chat da sua loja.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                          Mensagem Inicial de Saudação
                        </label>
                        <input
                          name="ai_welcome_message"
                          autoComplete="off"
                          type="text"
                          placeholder="Ex: Olá! Sou o garçom da loja. Em que posso te ajudar hoje?"
                          value={menu.ai_config?.welcomeMessage ?? ''}
                          onChange={e => setMenu({
                            ...menu,
                            ai_config: {
                              ...(menu.ai_config || {}),
                              welcomeMessage: e.target.value
                            }
                          })}
                          className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-primary text-sm"
                        />
                        <p className="text-[10px] text-zinc-500">Primeira frase enviada ao cliente ao abrir o chat.</p>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                          Dicas de Venda / Instruções Especiais para o Garçom (Opcional)
                        </label>
                        <textarea
                          name="ai_custom_instructions"
                          rows={2}
                          placeholder="Ex: Sempre sugira uma bebida gelada para acompanhar. Destaque os espetos artesanais com farofa e vinagrete."
                          value={menu.ai_config?.customInstructions ?? ''}
                          onChange={e => setMenu({
                            ...menu,
                            ai_config: {
                              ...(menu.ai_config || {}),
                              customInstructions: e.target.value
                            }
                          })}
                          className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-primary text-sm resize-none"
                        />
                        <p className="text-[10px] text-zinc-500">Instruções para o garçom IA personalizar seu estilo ou focar em vendas específicas.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                   <button onClick={handleSaveMenu} disabled={saving} className="flex-grow bg-primary py-4 rounded-xl font-heading font-black text-white shadow-xl shadow-primary/20 active:scale-95 transition-all">
                    {saving ? 'PROCESSANDO...' : 'SALVAR CONFIGURAÇÕES'}
                   </button>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <h4 className="text-red-500 font-bold text-sm">Segurança da Conta</h4>
                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-tighter">Sair do painel administrativo imediatamente.</p>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20">LOGOUT</button>
              </div>
            </motion.div>
          )}

          {/* ABA DIVULGAÇÃO (MARKETING) */}
          {activeTab === 'marketing' && (
            <motion.div key="marketing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* QR CODE CARD */}
                <div className="glass-card p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-6">
                  <div className="w-full">
                    <h3 className="text-white font-bold text-xl mb-2">QR Code da sua Loja</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Imprima e coloque no seu balcão</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-3xl shadow-2xl">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/${storeSlug}`)}`} 
                      alt="QR Code da Loja"
                      className="w-48 h-48 md:w-64 md:h-64"
                    />
                  </div>

                  <div className="flex flex-col w-full gap-3">
                    <button 
                      onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${window.location.origin}/${storeSlug}`)}`, '_blank')}
                      className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                    >
                      Baixar QR Code (Alta Resolução)
                    </button>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold">O cliente aponta a câmera e abre direto o seu cardápio</p>
                  </div>
                </div>

                {/* LINKS E COMPARTILHAMENTO */}
                <div className="space-y-6">
                  <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <ExternalLink className="text-primary w-5 h-5"/> Links Diretos
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Link da sua Loja</label>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={`${window.location.origin}/${storeSlug}`}
                            className="flex-grow bg-black/40 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-primary font-mono"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/${storeSlug}`);
                              toast.success("Link copiado!");
                            }}
                            className="bg-primary text-white p-4 rounded-xl font-bold text-xs"
                          >
                            COPIAR
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Link do Shopping (Todas as Lojas)</label>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={window.location.origin}
                            className="flex-grow bg-black/40 border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-primary font-mono"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin);
                              toast.success("Link copiado!");
                            }}
                            className="bg-zinc-800 text-white p-4 rounded-xl font-bold text-xs"
                          >
                            COPIAR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8 rounded-3xl border border-white/5 bg-green-500/5 border-green-500/10 space-y-4">
                    <h3 className="text-green-500 font-bold text-lg flex items-center gap-2">
                      <Coffee className="w-5 h-5"/> WhatsApp
                    </h3>
                    <p className="text-zinc-400 text-sm">Envie seu cardápio para seus clientes agora mesmo.</p>
                    <button 
                      onClick={() => {
                        const message = `Olá! Confira nosso cardápio online e faça seu pedido aqui: ${window.location.origin}/${storeSlug}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 transition-colors"
                    >
                      Enviar no WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA CONTABILIDADE / RELATÓRIOS */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 font-bold uppercase">Escolha a data do relatório</p>
                    <input 
                      name="report_date"
                      autoComplete="off"
                      type="date" 
                      value={reportDate} 
                      onChange={(e) => setReportDate(e.target.value)}
                      className="bg-transparent text-xl font-heading font-bold text-white outline-none mt-1 [color-scheme:dark]"
                    />
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
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Marmitas Entregues</p>
                  <p className="text-3xl font-heading font-black text-white">{deliveredOrders.length}</p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden mt-8 shadow-xl">
                <div className="p-4 border-b border-white/5 bg-zinc-950 flex justify-between items-center">
                  <h3 className="font-bold text-white font-heading">Histórico Detalhado</h3>
                  <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2 py-1 rounded">{reportDate ? format(parseISO(reportDate), 'dd/MM/yyyy') : '-'}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {reportOrders.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                      <Receipt className="w-8 h-8 mx-auto mb-3 opacity-20"/>
                      <p>Nenhum registro encontrado para esta data.</p>
                    </div>
                  ) : (
                    reportOrders.map(order => (
                      <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-bold text-white">{order.customer_name}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-1">
                            {format(new Date(order.created_at), "HH:mm")} • {order.payment_method?.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-primary text-lg">{formatBRL(order.total_amount)}</p>
                          <p className={`text-[10px] uppercase font-bold mt-1 inline-block px-2 py-0.5 rounded ${order.status === 'entregue' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                            {order.status}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA MOTOBOYS & GESTÃO DE ENTREGADORES */}
          {activeTab === 'couriers' && (
            <motion.div key="couriers" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              {/* HEADER DA ABA COM LOGO DISCRETA */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 border border-white/5 p-6 rounded-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-white font-black text-xl font-heading">Equipe de Motoboys</h2>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <Bike className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary tracking-widest uppercase font-mono">
                        da Quebrada <span className="text-zinc-400 font-normal">Delivery</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Gerencie até 5 motoboys do seu estabelecimento com fila de revezamento justa e controle de repasses.
                  </p>
                </div>

                <button
                  onClick={() => setShowCourierModal(true)}
                  disabled={couriers.length >= 5}
                  className={cn(
                    "px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg",
                    couriers.length >= 5
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                      : "bg-primary text-white hover:bg-primary/90 shadow-primary/20 active:scale-95"
                  )}
                >
                  <Plus className="w-4 h-4" /> Cadastrar Motoboy ({couriers.length}/5)
                </button>
              </div>

              {/* CARDS DE RESUMO OPERACIONAL */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Cadastrados</p>
                  <p className="text-2xl font-black text-white">{couriers.length} <span className="text-xs text-zinc-500 font-normal">/ 5</span></p>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Na Fila (Disponíveis)</p>
                  <p className="text-2xl font-black text-green-400">{couriers.filter(c => c.status === 'available').length}</p>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Em Rota de Entrega</p>
                  <p className="text-2xl font-black text-yellow-400">{couriers.filter(c => c.status === 'busy').length}</p>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Total Entregas Realizadas</p>
                  <p className="text-2xl font-black text-white">{couriers.reduce((acc, c) => acc + (c.deliveries_count || 0), 0)}</p>
                </div>
              </div>

              {/* FILA DE REVEZAMENTO EM TEMPO REAL */}
              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Fila de Revezamento (Ordem de Chegada)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      O próximo pedido despachado vai automaticamente para o 1º da fila. Ao concluir a entrega, ele vai para o final da fila.
                    </p>
                  </div>
                  <button onClick={loadCouriers} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 transition-colors" title="Atualizar Fila">
                    <RefreshCw className={cn("w-4 h-4", loadingCouriers && "animate-spin")} />
                  </button>
                </div>

                {couriers.filter(c => c.status === 'available').length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl">
                    <Bike className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-bold">Nenhum motoboy na fila no momento.</p>
                    <p className="text-xs text-zinc-600">Peça para os motoboys entrarem no app e ativarem a disponibilidade.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {couriers.filter(c => c.status === 'available').map((c: any, idx: number) => (
                      <div key={c.id} className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between",
                        idx === 0 ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5" : "bg-zinc-950/60 border-white/5"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center",
                            idx === 0 ? "bg-green-500 text-black shadow-lg shadow-green-500/30" : "bg-zinc-800 text-white"
                          )}>
                            {idx + 1}º
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm leading-tight flex items-center gap-1.5">
                              {c.name} {idx === 0 && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.2 rounded font-mono font-bold">PRÓXIMO</span>}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono">{c.phone || c.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{c.deliveries_count || 0} corridas</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LISTA DE MOTOBOYS CADASTRADOS */}
              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Motoboys Cadastrados ({couriers.length}/5)
                  </h3>
                </div>

                {couriers.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl space-y-3">
                    <Bike className="w-12 h-12 mx-auto opacity-30 text-primary" />
                    <h4 className="text-white font-bold">Nenhum motoboy cadastrado</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Cadastre os motoboys do seu estabelecimento para que eles possam logar no aplicativo com login e senha próprios.
                    </p>
                    <button
                      onClick={() => setShowCourierModal(true)}
                      className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
                    >
                      + Cadastrar Primeiro Motoboy
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {couriers.map((c: any) => (
                      <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black",
                            c.status === 'available' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            c.status === 'busy' ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                            "bg-zinc-800 text-zinc-500 border border-white/5"
                          )}>
                            <Bike className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-bold text-base leading-snug">{c.name}</h4>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                                c.status === 'available' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                c.status === 'busy' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                "bg-zinc-800 text-zinc-500 border-white/5"
                              )}>
                                {c.status === 'available' ? '🟢 Disponível na Fila' :
                                 c.status === 'busy' ? '🟡 Em Entrega' : '⚪ Pausa / Offline'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                              <span className="flex items-center gap-1 font-mono">
                                <span>Login:</span> <b className="text-zinc-200">{c.email}</b>
                              </span>
                              <span className="font-mono text-zinc-500">|</span>
                              <span className="flex items-center gap-1 font-mono">
                                <span>Senha:</span> <b className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{c.password}</b>
                              </span>
                              {c.vehicle_plate && (
                                <>
                                  <span className="font-mono text-zinc-500">|</span>
                                  <span className="text-zinc-400 font-mono">Placa: {c.vehicle_plate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleToggleCourierStatus(c)}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-colors"
                          >
                            {c.status === 'available' ? 'Pausar' : 'Ativar na Fila'}
                          </button>
                          {c.phone && (
                            <a
                              href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl border border-green-500/30 transition-colors"
                              title="Conversar no WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteCourier(c.id, c.name)}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                            title="Excluir Motoboy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RELATÓRIO FINANCEIRO DE REPASSES */}
              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" /> Relatório de Repasses Financeiros
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Controle de quantas entregas cada motoboy realizou e quanto a loja deve repassar a eles (Taxa padrão da loja: {formatBRL(menu?.deliveryFee || 0)}).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {couriers.map((c: any) => {
                    const fee = Number(menu?.deliveryFee || 0);
                    const totalEarned = (c.deliveries_count || 0) * fee;

                    return (
                      <div key={c.id} className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-white font-bold text-sm">{c.name}</p>
                          <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-zinc-400">
                            {c.deliveries_count || 0} corridas
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Total Repasse</span>
                          <span className="text-lg font-black text-green-400 font-mono">{formatBRL(totalEarned)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL DE PRODUTO / ESPETO */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-primary"/> Novo Espeto / Produto</h3>
                <button onClick={() => setShowProductModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddProductSubmit} className="space-y-4">
                {/* Upload Foto do Novo Produto da Galeria */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Foto do Item (Galeria / Câmera)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative shrink-0">
                      {newProdImg ? (
                        <img src={newProdImg} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-600" />
                      )}
                    </div>
                    <label className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer flex items-center gap-2 transition-colors">
                      <Camera className="w-4 h-4 text-primary" /> {newProdImg ? 'Trocar Foto' : 'Escolher da Galeria'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleNewProductImageUpload} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Nome do Item / Lanche</label>
                  <input autoComplete="off" autoFocus type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Ex: Espeto de Picanha Especial" className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm" required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Categoria</label>
                  <input autoComplete="off" type="text" value={newProdCat} onChange={e => setNewProdCat(e.target.value)} placeholder="Ex: Espetos Tradicionais, Jantinhas, etc." className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Preço (R$)</label>
                    <input autoComplete="off" type="text" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="Ex: 14.00" className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm" required />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Qtd em Estoque (Un)</label>
                    <input autoComplete="off" type="number" min="0" value={newProdStock} onChange={e => setNewProdStock(e.target.value)} placeholder="Ex: 30" className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Descrição / Ingredientes (Opcional)</label>
                  <textarea rows={2} value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Ex: Acompanha farofa crocante e vinagrete da casa." className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-sm resize-none" />
                </div>
                <button type="submit" className="w-full bg-primary py-3.5 rounded-xl font-black text-white uppercase text-sm shadow-lg shadow-primary/20 mt-2">
                  Adicionar ao Cardápio
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE BEBIDA */}
      <AnimatePresence>
        {showDrinkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><Coffee className="w-5 h-5 text-primary"/> Nova Bebida/Extra</h3>
                <button onClick={() => setShowDrinkModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddDrinkSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Nome do Item</label>
                   <input name="new_drink_name" autoComplete="off" autoFocus type="text" value={newDrinkName} onChange={e => setNewDrinkName(e.target.value)} placeholder="Ex: Coca-Cola 2L" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Preço (R$)</label>
                   <input name="new_drink_price" autoComplete="off" type="text" value={newDrinkPrice} onChange={e => setNewDrinkPrice(e.target.value)} placeholder="Ex: 12.00" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary" required />
                </div>
                <button type="submit" className="w-full bg-primary py-4 rounded-xl font-black text-white uppercase text-sm shadow-lg shadow-primary/20 mt-2">Adicionar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CARNE */}
      <AnimatePresence>
        {showMeatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><Beef className="w-5 h-5 text-primary"/> Nova Opção de Carne</h3>
                <button onClick={() => setShowMeatModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddMeatSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Nome da Carne</label>
                  <input name="new_meat_name" autoComplete="off" autoFocus type="text" value={newMeatName} onChange={e => setNewMeatName(e.target.value)} placeholder="Ex: Bife a Cavalo" className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-primary" required />
                </div>
                <button type="submit" className="w-full bg-primary py-4 rounded-xl font-black text-white uppercase text-sm shadow-lg shadow-primary/20 mt-2">Adicionar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CADASTRO DE MOTOBOY */}
      <AnimatePresence>
        {showCourierModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Bike className="w-5 h-5 text-primary"/> Cadastrar Novo Motoboy
                  </h3>
                  <p className="text-xs text-zinc-400">Limite de até 5 motoboys por estabelecimento.</p>
                </div>
                <button onClick={() => setShowCourierModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <form onSubmit={handleAddCourierSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Nome do Motoboy</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ex: Carlos Oliveira"
                    value={newCourierName}
                    onChange={e => setNewCourierName(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">WhatsApp / Celular</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      value={newCourierPhone}
                      onChange={e => setNewCourierPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Placa da Moto (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: ABC-1234"
                      value={newCourierPlate}
                      onChange={e => setNewCourierPlate(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-primary text-sm uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-400" /> Credenciais de Acesso do Motoboy
                  </p>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">E-mail de Login</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: carlos.motoboy@loja.com"
                      value={newCourierEmail}
                      onChange={e => setNewCourierEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 block">Senha de Acesso</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: moto1234"
                      value={newCourierPassword}
                      onChange={e => setNewCourierPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500">O motoboy usará este e-mail e senha para logar e abrir o painel de corridas.</p>
                </div>

                <button
                  type="submit"
                  disabled={savingCourier}
                  className="w-full bg-primary hover:bg-primary/90 py-4 rounded-xl font-black text-white uppercase text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {savingCourier ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Bike className="w-4 h-4" /> Concluir Cadastro de Motoboy
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CHAT DO PEDIDO */}
      {selectedOrderForChat && (
        <OrderChatModal
          isOpen={!!selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
          order={selectedOrderForChat}
          senderType="store"
          senderName={menu?.title || 'Lojista'}
        />
      )}
    </div>
  );
}
