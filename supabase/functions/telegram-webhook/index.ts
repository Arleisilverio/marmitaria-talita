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
    console.log("[telegram-webhook] Recebido payload do Telegram:", JSON.stringify(body))

    const message = body.message
    if (!message || !message.text) {
      console.log("[telegram-webhook] Nenhuma mensagem de texto válida encontrada.")
      return new Response('ok')
    }

    const chatId = message.chat.id
    const userText = message.text
    console.log(`[telegram-webhook] Processando mensagem de ${chatId}: ${userText}`)
    
    // Suportar tanto maiúsculas quanto minúsculas (às vezes salva minúsculo no Supabase)
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('telegram_bot_token')
    const openaiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('openai_api_key')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!botToken || !openaiKey || !supabaseUrl || !supabaseKey) {
      console.error("[telegram-webhook] ERRO: Variáveis de ambiente ausentes. Verifique o Supabase Secrets.")
      return new Response('Configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let currentStoreSlug = null;
    let currentUserId = null;
    let chatHistory = [];

    // LÓGICA DE DEEP LINK (Quando o usuário clica no botão do app)
    if (userText.startsWith('/start')) {
      const parts = userText.split(' ');
      if (parts.length > 1) {
        const payload = parts[1].trim(); 
        const payloadParts = payload.split('__');
        currentStoreSlug = payloadParts[0];
        if (payloadParts.length > 1) currentUserId = payloadParts[1];
        
        console.log(`[telegram-webhook] Novo acesso via App. Loja: ${currentStoreSlug}, User: ${currentUserId}`);
        
        const { error: upsertError } = await supabase.from('telegram_sessions').upsert({ 
          chat_id: chatId, 
          store_slug: currentStoreSlug, 
          user_id: currentUserId,
          history: [], 
          updated_at: new Date().toISOString() 
        });

        if (upsertError) {
           console.error("[telegram-webhook] Erro ao salvar sessão no banco:", upsertError);
        }
      }
    } else {
      // Busca a sessão salva
      console.log(`[telegram-webhook] Buscando sessão para o chat ${chatId}`);
      const { data: session, error: sessionError } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('chat_id', chatId)
        .maybeSingle();
        
      if (sessionError) console.error("[telegram-webhook] Erro ao buscar sessão:", sessionError);
        
      if (session) {
        currentStoreSlug = session.store_slug;
        currentUserId = session.user_id;
        chatHistory = session.history || [];
      }
    }

    // Função de enviar mensagem pro telegram para reaproveitar
    const sendTelegramMessage = async (text) => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
      }).catch(err => console.error("[telegram-webhook] Erro ao enviar mensagem para o Telegram:", err));
    }

    // SEGURANÇA: Se não tem ID, manda pro App
    if (!currentUserId || !currentStoreSlug) {
      console.warn("[telegram-webhook] Acesso não autorizado ou sessão expirada.");
      await sendTelegramMessage("Olá! Para sua segurança, eu só atendo clientes conectados. Por favor, volte ao aplicativo e clique novamente no botão 'Pedir com o Garçom'.");
      return new Response('ok')
    }

    // PUXAR DADOS DO CLIENTE E DA LOJA
    console.log(`[telegram-webhook] Puxando dados de perfil (${currentUserId}) e loja (${currentStoreSlug})`);
    const [{ data: userProfile, error: profileErr }, { data: storeData, error: storeErr }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle(),
      supabase.from('store_settings').select('menu_data').eq('store_slug', currentStoreSlug).maybeSingle()
    ]);

    if (profileErr || storeErr || !storeData || !storeData.menu_data || !userProfile) {
      console.error("[telegram-webhook] Erro de banco de dados ou faltou dado.");
      await sendTelegramMessage("Ocorreu um erro ao carregar seus dados ou o cardápio. Tente acessar pelo aplicativo novamente.");
      return new Response('ok')
    }

    const menuData = storeData.menu_data;
    const aiName = menuData.aiName || 'Garçom';
    const aiPersona = menuData.aiPersona || `Você é ${aiName}, um atendente educado.`;
    
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
      
      REGRAS:
      1. Se o cliente quiser fechar o pedido, confirme TODOS os itens escolhidos e a forma de pagamento (Pix, Dinheiro, Cartão).
      2. Confirme se será Entrega no endereço cadastrado dele (${userProfile.address}) ou Retirada.
      3. APENAS quando o cliente confirmar tudo e disser que pode fechar, VOCÊ DEVE OBRIGATORIAMENTE chamar a função 'register_order'.
      4. Mantenha respostas curtas.
    `;

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

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userText }
    ];

    console.log(`[telegram-webhook] Chamando OpenAI para o chat ${chatId}`);
    
    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools, temperature: 0.7 }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        console.error(`[telegram-webhook] ERRO OpenAI API:`, JSON.stringify(errorData));
        await sendTelegramMessage("Ops! Meu cérebro de Inteligência Artificial deu uma travadinha (Erro na OpenAI). Por favor, avise o dono da loja!");
        return new Response('ok')
      }

      const aiData = await aiResponse.json();
      let responseMessage = aiData.choices[0].message;
      let replyText = responseMessage.content;

      if (responseMessage.tool_calls) {
        console.log(`[telegram-webhook] IA decidiu registrar pedido! Chamando tool_calls...`);
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'register_order') {
            const args = JSON.parse(toolCall.function.arguments);
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

            messages.push(responseMessage);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: orderError ? "Erro ao salvar pedido." : "Pedido registrado com sucesso no painel da loja!"
            });

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

      if (!replyText) replyText = "Desculpe, tive um problema de comunicação aqui. Pode repetir?";

      console.log(`[telegram-webhook] Enviando resposta para ${chatId}`);
      await sendTelegramMessage(replyText);

      const newHistory = [
        ...chatHistory,
        { role: 'user', content: userText },
        { role: 'assistant', content: replyText }
      ].slice(-10);

      await supabase.from('telegram_sessions').update({ history: newHistory }).eq('chat_id', chatId);
      
      console.log(`[telegram-webhook] Processo finalizado com sucesso para ${chatId}`);
      return new Response(JSON.stringify({ status: 'success' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (openaiErr) {
      console.error("[telegram-webhook] Erro ao tentar conectar com a OpenAI:", openaiErr);
      await sendTelegramMessage("Estou enfrentando problemas técnicos de conexão. Tente novamente mais tarde!");
      return new Response('ok')
    }

  } catch (error) {
    console.error("[telegram-webhook] ERRO CRÍTICO:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})