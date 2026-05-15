// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const message = body.message
    if (!message || !message.text) return new Response('ok')

    const chatId = message.chat.id
    const userText = message.text
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!botToken || !openaiKey || !supabaseUrl || !supabaseKey) {
      console.error("[telegram-webhook] Missing environment variables")
      return new Response('Configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let currentStoreSlug = null;
    let currentUserId = null;
    let chatHistory = [];

    // LÓGICA DE DEEP LINK: Chegou pelo botão do App
    if (userText.startsWith('/start ')) {
      const payload = userText.split(' ')[1].trim(); 
      // Formato esperado: "marmitaria-talita__123abc..."
      const parts = payload.split('__');
      currentStoreSlug = parts[0];
      if (parts.length > 1) currentUserId = parts[1];
      
      await supabase.from('telegram_sessions').upsert({ 
        chat_id: chatId, 
        store_slug: currentStoreSlug, 
        user_id: currentUserId,
        history: [], // Limpa histórico ao iniciar nova conversa
        updated_at: new Date().toISOString() 
      });
      
    } else {
      // Busca a sessão salva
      const { data: session } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('chat_id', chatId)
        .single();
        
      if (session) {
        currentStoreSlug = session.store_slug;
        currentUserId = session.user_id;
        chatHistory = session.history || [];
      }
    }

    // SEGURANÇA: Se não tem ID, manda pro App
    if (!currentUserId || !currentStoreSlug) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Olá! Para sua segurança, eu só atendo clientes conectados. Por favor, volte ao aplicativo e clique novamente no botão 'Pedir com o Garçom'."
        })
      });
      return new Response('ok')
    }

    // PUXAR DADOS DO CLIENTE E DA LOJA
    const [{ data: userProfile }, { data: storeData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUserId).single(),
      supabase.from('store_settings').select('menu_data').eq('store_slug', currentStoreSlug).single()
    ]);

    if (!storeData || !storeData.menu_data || !userProfile) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: "Ocorreu um erro ao carregar seus dados ou o cardápio." }) });
      return new Response('ok')
    }

    const menuData = storeData.menu_data;
    const aiName = menuData.aiName || 'Garçom';
    const aiPersona = menuData.aiPersona || `Você é ${aiName}, um atendente educado.`;
    
    // CONSTRUIR O CÉREBRO DA IA
    const systemPrompt = `
      ${aiPersona}
      
      Você está falando com o cliente: ${userProfile.full_name}.
      Telefone: ${userProfile.phone}
      Endereço cadastrado: ${userProfile.address}
      
      A loja é: ${menuData.title}
      Status: ${menuData.isOpen ? 'ABERTA' : 'FECHADA'}
      
      CARDÁPIO DA LOJA:
      - Principal: ${menuData.title} (P: R$${menuData.prices.p}, M: R$${menuData.prices.m}, G: R$${menuData.prices.g})
      - Adicionais: ${menuData.meats?.map(m => `${m.name} (+R$${m.price || 0})`).join(', ') || 'Nenhum'}
      - Bebidas: ${menuData.drinks?.map(d => `${d.name} (R$${d.price})`).join(', ') || 'Nenhuma'}
      - Taxa de Entrega: R$${menuData.deliveryFee || 0}
      
      REGRAS ESTABELECIDAS:
      1. Se o cliente quiser fechar o pedido, confirme TODOS os itens escolhidos e a forma de pagamento (Pix, Dinheiro, Cartão).
      2. Confirme se será Entrega no endereço cadastrado dele (${userProfile.address}) ou Retirada.
      3. APENAS quando o cliente confirmar tudo e disser que pode fechar, VOCÊ DEVE OBRIGATORIAMENTE chamar a função 'register_order'.
      4. Mantenha as respostas curtas para leitura fácil no celular.
    `;

    // Função que a IA pode chamar
    const tools = [
      {
        type: "function",
        function: {
          name: "register_order",
          description: "Registra o pedido finalizado no sistema para a cozinha começar a preparar.",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                description: "Lista de itens pedidos.",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    price: { type: "number" },
                    size: { type: "string", description: "Tamanho (P, M, G) se aplicável" }
                  }
                }
              },
              payment_method: { type: "string", enum: ["pix", "dinheiro", "cartao_entrega"] },
              total_amount: { type: "number", description: "Valor total somando produtos e entrega" },
              delivery_type: { type: "string", enum: ["entrega", "retirada"] }
            },
            required: ["items", "payment_method", "total_amount", "delivery_type"]
          }
        }
      }
    ];

    // Monta o array de mensagens
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userText }
    ];

    // CHAMA A OPENAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools, temperature: 0.7 }),
    });

    const aiData = await aiResponse.json();
    let responseMessage = aiData.choices[0].message;
    let replyText = responseMessage.content;

    // SE A IA DECIDIR CHAMAR A FUNÇÃO DE CADASTRAR O PEDIDO
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'register_order') {
          const args = JSON.parse(toolCall.function.arguments);
          
          // SALVA NO BANCO (MÁGICA ACONTECENDO)
          const address = args.delivery_type === 'retirada' ? 'RETIRADA' : userProfile.address;
          
          const { error: orderError } = await supabase.from('orders').insert({
            user_id: currentUserId,
            customer_name: userProfile.full_name,
            customer_phone: userProfile.phone,
            delivery_address: address,
            payment_method: args.payment_method,
            total_amount: args.total_amount,
            status: 'pendente',
            items_json: args.items,
            store_slug: currentStoreSlug
          });

          // Avisa a IA que deu certo para ela responder ao cliente
          messages.push(responseMessage);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: orderError ? "Erro ao salvar pedido." : "Pedido registrado com sucesso no painel da loja!"
          });

          // Pede pra IA gerar o texto final
          const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7 }),
          });
          const secondData = await secondResponse.json();
          replyText = secondData.choices[0].message.content;
        }
      }
    }

    if (!replyText) replyText = "Desculpe, deu um erro aqui. Pode repetir?";

    // Envia resposta pro Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' })
    });

    // Atualiza o histórico
    const newHistory = [
      ...chatHistory,
      { role: 'user', content: userText },
      { role: 'assistant', content: replyText }
    ].slice(-10); // Guarda apenas as últimas 10 mensagens para não pesar

    await supabase.from('telegram_sessions').update({ history: newHistory }).eq('chat_id', chatId);

    return new Response(JSON.stringify({ status: 'success' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error("[telegram-webhook] Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})