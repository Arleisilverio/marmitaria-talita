import { supabase } from '../integrations/supabase/client';
import { STORE_TEMPLATES } from './templates';

// Helper para anexar metadados do motoboy no campo notes
export function attachCourierToNotes(currentNotes: string | null | undefined, courierData: { id: string; name: string; dispatched_at?: string; delivered_at?: string }) {
  const clean = (currentNotes || '').replace(/\[COURIER:[\s\S]*?\]/g, '').trim();
  const courierTag = `[COURIER:${JSON.stringify(courierData)}]`;
  return clean ? `${clean}\n${courierTag}` : courierTag;
}

// Helper para extrair metadados do motoboy de um pedido (seja por colunas dedicadas ou por notes)
export function extractCourierFromOrder(order: any) {
  if (!order) return null;
  if (order.courier_name) {
    return {
      courier_id: order.courier_id,
      courier_name: order.courier_name,
      dispatched_at: order.dispatched_at,
      delivered_at: order.delivered_at
    };
  }
  if (order.notes) {
    const match = order.notes.match(/\[COURIER:([\s\S]*?)\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        return {
          courier_id: parsed.id || parsed.courier_id,
          courier_name: parsed.name || parsed.courier_name,
          dispatched_at: parsed.dispatched_at,
          delivered_at: parsed.delivered_at
        };
      } catch (e) {}
    }
  }
  return null;
}

export const api = {
  // Busca o cardápio de uma loja específica
  // Retorna null com storeBlocked=true se o lojista estiver bloqueado pelo Super Admin
  getMenu: async (slug: string) => {
    if (!slug) return null;

    // 1. Verifica se a loja existe e está ativa
    const { data: adminData } = await supabase
      .from('app_admins')
      .select('status, store_name')
      .eq('slug', slug)
      .maybeSingle();

    // Loja bloqueada pelo Super Admin
    if (adminData && adminData.status === 'blocked') {
      return {
        storeBlocked: true,
        isOpen: false, hasDelivery: false, prepTime: 0, deliveryFee: 0,
        title: adminData.store_name || "Loja Indisponível",
        description: "", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [], slides: []
      };
    }

    const { data, error } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('store_slug', slug)
      .maybeSingle();
      
    if (error || !data) {
      return { 
        isOpen: false, hasDelivery: false, prepTime: 40, deliveryFee: 5,
        title: "Nova Loja", description: "Configure seu cardápio no painel admin.", image: "",
        prices: { p: 0, m: 0, g: 0 }, meats: [], drinks: [], slides: []
      };
    }
    return data.menu_data;
  },
  
  updateMenu: async (slug: string, menuData: any) => {
    const { data, error } = await supabase
      .from('store_settings')
      .upsert(
        { 
          store_slug: slug.toLowerCase().trim(), 
          menu_data: menuData, 
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'store_slug' }
      )
      .select()
      .maybeSingle();
      
    if (error) {
      console.error("Supabase update error:", error);
      if (error.code === '42501') {
        throw new Error("Erro de permissão (RLS): Você não tem autorização para alterar as configurações desta loja.");
      }
      throw new Error(error.message || "Erro ao salvar configurações da loja.");
    }
    return data?.menu_data || menuData;
  },

  getOrders: async (slug: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_slug', slug)
      .order('created_at', { ascending: false });
      
    if (error || !data) return [];

    return data.map((order: any) => {
      const courierMeta = extractCourierFromOrder(order);
      return {
        ...order,
        courier_id: courierMeta?.courier_id || order.courier_id,
        courier_name: courierMeta?.courier_name || order.courier_name,
        dispatched_at: courierMeta?.dispatched_at || order.dispatched_at,
        delivered_at: courierMeta?.delivered_at || order.delivered_at
      };
    });
  },

  getMyOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error || !data) return [];

    return data.map((order: any) => {
      const courierMeta = extractCourierFromOrder(order);
      return {
        ...order,
        courier_id: courierMeta?.courier_id || order.courier_id,
        courier_name: courierMeta?.courier_name || order.courier_name,
        dispatched_at: courierMeta?.dispatched_at || order.dispatched_at,
        delivered_at: courierMeta?.delivered_at || order.delivered_at
      };
    });
  },

  updateOrderStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // ---- FUNÇÕES DO SAAS (SUPER ADMIN) ---- //
  checkAdminAccess: async (email: string) => {
    if (!email) return null;
    const { data } = await supabase
      .from('app_admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    return data;
  },

  getAppAdmins: async () => {
    const { data } = await supabase
      .from('app_admins')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },

  addAppAdmin: async (email: string, storeName: string, slug: string, niche: string = 'espetinho') => {
    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const cleanEmail = email.toLowerCase().trim();

    // 1. Adiciona na tabela de admins
    const { error: adminError } = await supabase
      .from('app_admins')
      .insert({ 
        email: cleanEmail, 
        store_name: storeName, 
        slug: cleanSlug,
        status: 'active'
      });
      
    if (adminError) {
      console.error("AddAdmin error:", adminError);
      throw new Error("Erro ao cadastrar lojista. E-mail ou Slug já podem estar em uso.");
    }

    // 2. Inicializa as configurações da loja usando o template do nicho
    const template = STORE_TEMPLATES[niche] || STORE_TEMPLATES['espetinho'];
    const initialMenu = {
      ...template.menu_data,
      title: storeName,
      isOpen: true
    };

    const { error: settingsError } = await supabase
      .from('store_settings')
      .insert({
        store_slug: cleanSlug,
        menu_data: initialMenu
      });

    if (settingsError) {
      console.error("Settings init error:", settingsError);
    }
  },

  toggleAppAdminStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const { error } = await supabase
      .from('app_admins')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) throw new Error("Erro ao alterar status.");
    return newStatus;
  },

  deleteAppAdmin: async (id: string) => {
    const { error } = await supabase
      .from('app_admins')
      .delete()
      .eq('id', id);
    if (error) throw new Error("Erro ao excluir lojista.");
  },

  // Busca apenas lojas ATIVAS para a vitrine (bloqueadas ficam invisíveis)
  getAllStores: async () => {
    // Busca apenas slugs de lojas com status 'active'
    const { data: activeAdmins, error: adminError } = await supabase
      .from('app_admins')
      .select('slug')
      .eq('status', 'active');

    if (adminError || !activeAdmins || activeAdmins.length === 0) return [];

    const activeSlugs = activeAdmins.map(a => a.slug);

    const { data, error } = await supabase
      .from('store_settings')
      .select('store_slug, menu_data')
      .in('store_slug', activeSlugs);
      
    if (error) {
      console.error("Erro ao buscar configurações das lojas:", error);
      return [];
    }
    
    // Filtra apenas as que têm dados básicos de menu
    return data.map(item => ({
      slug: item.store_slug,
      title: item.menu_data?.title || "Nova Loja",
      description: item.menu_data?.description || "",
      image: item.menu_data?.image || "",
      isOpen: item.menu_data?.isOpen || false
    }));
  },

  getProfile: async (userId: string) => {
    if (!userId) return null;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data;
  },

  processAI: async (
    param1: string | { message?: string; messages?: { role: 'user' | 'assistant'; content: string }[]; context?: any; storeName?: string; aiConfig?: any },
    legacyContext?: any
  ) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const openAiKey = (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY) as string;
    
    let payload: any = {};
    if (typeof param1 === 'string') {
      payload = { message: param1, context: legacyContext };
    } else {
      payload = param1;
    }

    // 1. Tenta via Supabase Edge Function
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        return await res.json();
      }
    } catch (edgeErr) {
      console.warn("Edge Function indisponível, usando fallback direto da OpenAI:", edgeErr);
    }

    // 2. Fallback direto usando OpenAI API
    if (openAiKey) {
      const { messages, message, context, storeName, aiConfig } = payload;
      const botName = aiConfig?.botName || context?.ai_config?.botName || 'Garçom Virtual';
      const restaurantName = storeName || context?.title || 'nossa loja';
      const customInstructions = aiConfig?.customInstructions || context?.ai_config?.customInstructions || '';

      let menuSummary = `Nome da Loja: ${restaurantName}\n`;
      if (context?.description) menuSummary += `Descrição: ${context.description}\n`;
      if (context?.prepTime) menuSummary += `Tempo médio de preparo: ${context.prepTime} min\n`;
      if (context?.hasDelivery) menuSummary += `Delivery disponível (Taxa: R$ ${context.deliveryFee || 0})\n`;

      if (context?.prices) {
        menuSummary += `Preços de Marmitas: Pequena (P) = R$ ${context.prices.p}, Média (M) = R$ ${context.prices.m}, Grande (G) = R$ ${context.prices.g}\n`;
      }
      if (context?.meats && context.meats.length > 0) {
        const meatList = context.meats.map((m: any) => typeof m === 'object' ? m.name : m).join(', ');
        menuSummary += `Opções de Carnes / Pratos do Dia: ${meatList}\n`;
      }
      if (context?.products && context.products.length > 0) {
        const productList = context.products.map((p: any) => `${p.name} (R$ ${p.price}${p.category ? ' - ' + p.category : ''})`).join(', ');
        menuSummary += `Produtos / Itens do Cardápio: ${productList}\n`;
      }
      if (context?.drinks && context.drinks.length > 0) {
        const drinkList = context.drinks.map((d: any) => `${d.name} (R$ ${d.price})`).join(', ');
        menuSummary += `Bebidas e Acompanhamentos: ${drinkList}\n`;
      }

      const systemPrompt = `Você é "${botName}", o garçom virtual inteligente e acolhedor de "${restaurantName}".
Seu objetivo é atender o cliente, tirar dúvidas sobre o cardápio, sugerir bebidas/acompanhamentos e montar o pedido dele para enviar direto para a cozinha do lojista.

--- CARDÁPIO E INFORMAÇÕES DA LOJA ---
${menuSummary}

--- REGRAS CRÍTICAS DE SEGURANÇA E PRIVACIDADE ---
1. NÃO PEÇA DADOS PESSOAIS: NUNCA peça nome, CPF, telefone ou endereço de entrega no chat. O aplicativo já tem esses dados salvos no cadastro do cliente e os usará automaticamente. Se o cliente perguntar, informe que o pedido irá para o endereço cadastrado no perfil dele no app.
2. NÃO PEÇA DADOS DE CARTÃO: NUNCA peça números de cartão, validade ou CVV.
3. FORMAS DE PAGAMENTO: Antes de fechar o pedido, SEMPRE pergunte como o cliente vai pagar. As opções são:
   - PIX
   - Cartão na Entrega (Débito ou Crédito na maquininha)
   - Dinheiro (pergunte se precisa de troco)
4. VENDA ATIVA: Sugira bebidas ou acompanhamentos para harmonizar com os pratos escolhidos.
5. CONCISÃO: Mensagens curtas, acolhedoras e em bom português do Brasil.

--- FLUXO DE ATENDIMENTO, CONFIRMAÇÃO E FINALIZAÇÃO ---
1. ATENDIMENTO & SUGESTÕES: Tire dúvidas, sugira acompanhamentos/bebidas para harmonizar e pergunte como o cliente prefere pagar (PIX, Cartão na Entrega ou Dinheiro).
2. CONFIRMAÇÃO DO PEDIDO: Quando os itens e a forma de pagamento forem definidos, sempre faça a confirmação clara dos itens e do valor total do pedido.
3. FINALIZAR EM PEDIR: Sempre que o cliente confirmar (ex: "sim", "pode pedir", "pode enviar", "confirmo", "finalizar") ou quando ele já pedir diretamente para fechar o pedido:
   - Responda confirmando com entusiasmo que o pedido foi finalizado e enviado para a cozinha.
   - Ao final absoluto da sua mensagem, inclua a tag delimitadora exclusiva com os dados estruturados para envio imediato:
<<<PEDIDO_JSON
{"items":[{"id":"1","name":"Nome do Item","price":20.0,"quantity":1,"size":"m"}],"payment_method":"pix","delivery_type":"entrega"}
PEDIDO_JSON>>>
(Nota: use payment_method como "pix", "cartao_entrega" ou "dinheiro", e delivery_type como "entrega" ou "retirada").
${customInstructions ? `\nInstruções Especiais do Lojista: ${customInstructions}` : ''}
`;

      let conversationMessages: any[] = [{ role: 'system', content: systemPrompt }];

      if (Array.isArray(messages) && messages.length > 0) {
        conversationMessages = conversationMessages.concat(
          messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: String(m.content || '')
          }))
        );
      } else if (message) {
        conversationMessages.push({ role: 'user', content: String(message) });
      }

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 450
        })
      });

      if (!openAiRes.ok) {
        const err = await openAiRes.json().catch(() => null);
        throw new Error(err?.error?.message || `Erro OpenAI ${openAiRes.status}`);
      }

      const openAiData = await openAiRes.json();
      return { reply: openAiData.choices?.[0]?.message?.content || 'Como posso te ajudar hoje?' };
    }

    throw new Error("Não foi possível conectar com o Garçom IA. Verifique as chaves de API.");
  },

  // =========================================================================
  // SISTEMA DE DELIVERY: GESTÃO DE MOTOBOYS & FILA DE REVEZAMENTO
  // =========================================================================

  // Busca todos os motoboys da loja ordenados por ordem na fila (queue_joined_at)
  getCouriers: async (storeSlug: string) => {
    if (!storeSlug) return [];

    try {
      const { data, error } = await supabase
        .from('store_couriers')
        .select('*')
        .eq('store_slug', storeSlug)
        .order('queue_joined_at', { ascending: true });

      if (!error && data) return data;
    } catch (e) {}

    // Fallback: se a tabela ainda não estiver criada no Supabase, lê de store_settings
    const { data: settings } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('store_slug', storeSlug)
      .maybeSingle();

    return (settings?.menu_data?.couriers || []).sort((a: any, b: any) => 
      new Date(a.queue_joined_at || 0).getTime() - new Date(b.queue_joined_at || 0).getTime()
    );
  },

  // Cadastra um motoboy (limite de até 5 por loja)
  addCourier: async (storeSlug: string, courier: { name: string; phone: string; email: string; password: string; vehicle_plate?: string }) => {
    const cleanEmail = courier.email.toLowerCase().trim();
    const existing = await api.getCouriers(storeSlug);

    if (existing.length >= 5) {
      throw new Error("Limite máximo de 5 motoboys por estabelecimento atingido.");
    }

    if (existing.some((c: any) => c.email.toLowerCase() === cleanEmail)) {
      throw new Error("Já existe um motoboy cadastrado com este e-mail nesta loja.");
    }

    const newCourier = {
      id: `courier_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      store_slug: storeSlug,
      name: courier.name.trim(),
      phone: courier.phone.trim(),
      email: cleanEmail,
      password: courier.password.trim(),
      vehicle_plate: courier.vehicle_plate?.trim() || '',
      status: 'available', // 'available', 'busy', 'offline'
      queue_joined_at: new Date().toISOString(),
      deliveries_count: 0,
      active: true,
      created_at: new Date().toISOString()
    };

    // 1. Tenta inserir na tabela dedicada
    try {
      const { data, error } = await supabase.from('store_couriers').insert(newCourier).select().single();
      if (!error && data) return data;
    } catch (e) {}

    // 2. Fallback: salva dentro de store_settings.menu_data.couriers
    const { data: settings } = await supabase.from('store_settings').select('menu_data').eq('store_slug', storeSlug).maybeSingle();
    const currentCouriers = settings?.menu_data?.couriers || [];
    const updatedCouriers = [...currentCouriers, newCourier];
    await api.updateMenu(storeSlug, { ...(settings?.menu_data || {}), couriers: updatedCouriers });

    return newCourier;
  },

  // Atualiza dados ou status do motoboy
  updateCourier: async (storeSlug: string, courierId: string, updates: any) => {
    // 1. Atualiza sessão local se for o motoboy logado
    try {
      const currentSession = api.getCourierSession();
      if (currentSession && currentSession.id === courierId) {
        localStorage.setItem('daquebrada_courier_session', JSON.stringify({ ...currentSession, ...updates }));
      }
    } catch (e) {}

    // 2. Tenta atualizar na tabela dedicada store_couriers
    try {
      const { data, error } = await supabase
        .from('store_couriers')
        .update(updates)
        .eq('id', courierId)
        .select()
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {}

    // 3. Fallback store_settings (se for o lojista autenticado)
    try {
      const { data: settings } = await supabase.from('store_settings').select('menu_data').eq('store_slug', storeSlug).maybeSingle();
      const currentCouriers = settings?.menu_data?.couriers || [];
      const updatedCouriers = currentCouriers.map((c: any) => c.id === courierId ? { ...c, ...updates } : c);
      await api.updateMenu(storeSlug, { ...(settings?.menu_data || {}), couriers: updatedCouriers });
    } catch (e) {
      // Ignora erro RLS caso a chamada venha do próprio motoboy sem token de admin
    }
    return updates;
  },

  // Remove um motoboy
  deleteCourier: async (storeSlug: string, courierId: string) => {
    try {
      const { error } = await supabase.from('store_couriers').delete().eq('id', courierId);
      if (!error) return true;
    } catch (e) {}

    // Fallback store_settings
    const { data: settings } = await supabase.from('store_settings').select('menu_data').eq('store_slug', storeSlug).maybeSingle();
    const currentCouriers = settings?.menu_data?.couriers || [];
    const updatedCouriers = currentCouriers.filter((c: any) => c.id !== courierId);
    await api.updateMenu(storeSlug, { ...(settings?.menu_data || {}), couriers: updatedCouriers });
    return true;
  },

  // Login dedicado do motoboy
  loginCourier: async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // 1. Tenta buscar na tabela store_couriers
    try {
      const { data, error } = await supabase
        .from('store_couriers')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', cleanPassword)
        .maybeSingle();

      if (!error && data) {
        // Busca nome da loja
        const { data: storeAdmin } = await supabase.from('app_admins').select('store_name').eq('slug', data.store_slug).maybeSingle();
        const session = {
          courier: data,
          storeSlug: data.store_slug,
          storeName: storeAdmin?.store_name || data.store_slug
        };
        localStorage.setItem('daquebrada_courier_session', JSON.stringify(session));
        return session;
      }
    } catch (e) {}

    // 2. Fallback: escaneia store_settings de todas as lojas
    const { data: allSettings } = await supabase.from('store_settings').select('store_slug, menu_data');
    if (allSettings) {
      for (const st of allSettings) {
        const couriers = st.menu_data?.couriers || [];
        const match = couriers.find((c: any) => c.email?.toLowerCase() === cleanEmail && c.password === cleanPassword);
        if (match) {
          const session = {
            courier: match,
            storeSlug: st.store_slug,
            storeName: st.menu_data?.title || st.store_slug
          };
          localStorage.setItem('daquebrada_courier_session', JSON.stringify(session));
          return session;
        }
      }
    }

    throw new Error("E-mail ou senha de entregador inválidos.");
  },

  // Obter sessão atual salva do motoboy
  getCourierSession: () => {
    try {
      const saved = localStorage.getItem('daquebrada_courier_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  // Logout do motoboy
  logoutCourier: () => {
    localStorage.removeItem('daquebrada_courier_session');
  },

  // Despacha um ou mais pedidos para um motoboy específico (ou 1º da fila)
  dispatchOrderToCourier: async (orderId: string, courierId: string, courierName: string, storeSlug: string) => {
    // 1. Busca pedido atual para preservar e anexar metadados do motoboy em notes
    const { data: currentOrder } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    const newNotes = attachCourierToNotes(currentOrder?.notes, {
      id: courierId,
      name: courierName,
      dispatched_at: new Date().toISOString()
    });

    let updated = false;

    // 2. Tenta primeiro com colunas dedicadas
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'confirmado',
          courier_id: courierId,
          courier_name: courierName,
          dispatched_at: new Date().toISOString(),
          notes: newNotes
        })
        .eq('id', orderId);

      if (!error) updated = true;
    } catch (e) {}

    // Fallback garantido se as colunas ainda não existirem no schema
    if (!updated) {
      const { error: fallbackErr } = await supabase
        .from('orders')
        .update({
          status: 'confirmado',
          notes: newNotes
        })
        .eq('id', orderId);

      if (fallbackErr) throw fallbackErr;
    }

    // 3. Coloca o motoboy em status 'busy'
    await api.updateCourier(storeSlug, courierId, { status: 'busy' });
    return true;
  },

  // Despacha lote de múltiplos pedidos (ex: mesma região/bairro) para o mesmo motoboy
  dispatchMultipleOrdersToCourier: async (orderIds: string[], courierId: string, courierName: string, storeSlug: string) => {
    if (!orderIds || orderIds.length === 0) return;

    for (const id of orderIds) {
      await api.dispatchOrderToCourier(id, courierId, courierName, storeSlug);
    }
  },

  // Conclui a entrega (botão do motoboy) -> atualiza pedido e só libera na fila se não tiver outras entregas pendentes no lote
  completeCourierDelivery: async (orderId: string, courierId: string, storeSlug: string, deliveryFee: number = 0, paymentMethod?: string) => {
    // 1. Busca pedido atual para marcar hora de entrega em notes
    const { data: currentOrder } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    const newNotes = attachCourierToNotes(currentOrder?.notes, {
      id: courierId,
      name: currentOrder?.courier_name || 'Motoboy',
      delivered_at: new Date().toISOString()
    });

    let updated = false;
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'entregue',
          delivered_at: new Date().toISOString(),
          notes: newNotes
        })
        .eq('id', orderId);

      if (!error) updated = true;
    } catch (e) {}

    if (!updated) {
      const { error: fallbackErr } = await supabase
        .from('orders')
        .update({
          status: 'entregue',
          notes: newNotes
        })
        .eq('id', orderId);

      if (fallbackErr) throw fallbackErr;
    }

    // 2. Registra o repasse financeiro na tabela courier_payouts (se existir)
    try {
      await supabase.from('courier_payouts').insert({
        courier_id: courierId,
        order_id: orderId,
        store_slug: storeSlug,
        delivery_fee: deliveryFee,
        payment_method: paymentMethod || 'dinheiro'
      });
    } catch (e) {}

    // 3. Atualiza contador de entregas do motoboy
    const couriers = await api.getCouriers(storeSlug);
    const courier = couriers.find((c: any) => c.id === courierId);
    const newCount = (courier?.deliveries_count || 0) + 1;

    // 4. Verifica se o motoboy ainda possui outras entregas ativas/pendentes na mesma viagem
    const allMyOrders = await api.getCourierOrders(storeSlug, courierId);
    const remainingActiveOrders = allMyOrders.filter((o: any) => o.id !== orderId && o.status === 'confirmado');

    if (remainingActiveOrders.length > 0) {
      // Ainda tem entregas no lote da viagem atual: continua em rota ('busy')
      await api.updateCourier(storeSlug, courierId, {
        status: 'busy',
        deliveries_count: newCount
      });
    } else {
      // Concluiu todas as entregas do lote: vai para o fim da fila de revezamento ('available')
      await api.updateCourier(storeSlug, courierId, {
        status: 'available',
        queue_joined_at: new Date().toISOString(), // Fim da fila!
        deliveries_count: newCount
      });
    }

    return true;
  },

  // Busca pedidos atribuídos ao motoboy
  getCourierOrders: async (storeSlug: string, courierId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_slug', storeSlug)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((order: any) => {
      const courierMeta = extractCourierFromOrder(order);
      return {
        ...order,
        courier_id: courierMeta?.courier_id || order.courier_id,
        courier_name: courierMeta?.courier_name || order.courier_name,
        dispatched_at: courierMeta?.dispatched_at || order.dispatched_at,
        delivered_at: courierMeta?.delivered_at || order.delivered_at
      };
    }).filter((order: any) => order.courier_id === courierId);
  },

  // Busca histórico de repasses/entregas para relatório financeiro
  getCourierPayouts: async (storeSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('courier_payouts')
        .select('*')
        .eq('store_slug', storeSlug)
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (e) {}

    // Fallback: calcula a partir dos pedidos com status 'entregue' e courier_id preenchido
    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('store_slug', storeSlug)
      .eq('status', 'entregue')
      .not('courier_id', 'is', null);

    return deliveredOrders || [];
  }
};
