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
      return new Response('ok')
    }

    const chatId = message.chat.id
    const userText = message.text
    let aiPromptText = userText; // Texto que enviaremos para a IA
    
    // Suportar tanto maiúsculas quanto minúsculas
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('telegram_bot_token')
    const openaiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('openai_api_key')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!botToken || !openaiKey || !supabaseUrl || !supabaseKey) {
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
        
        // Salvamento seguro sem depender de PK no upsert
        const { data: existingSession } = await supabase.from('telegram_sessions').select('chat_id').eq('chat_id', chatId).maybeSingle();
        
        if (existingSession) {
          await supabase.from('telegram_sessions').update({ 
            store_slug: currentStoreSlug, 
            user_id: currentUserId,
            history: [], 
            updated_at: new Date().toISOString() 
          }).eq('chat_id', chatId);
        } else {
          await supabase.from('telegram_sessions').insert({ 
            chat_id: chatId, 
            store_slug: currentStoreSlug, 
            user_id: currentUserId,
            history: [], 
            updated_at: new Date().toISOString() 
          });
        }
      }
      
      // Trocamos o texto feio do start por uma saudação para a IA não se confundir
      aiPromptText = "Oi, acabei de chegar pelo aplicativo!";
    } else {
      // Busca a sessão salva
      const { data: session } = await supabase.from('telegram_sessions').select('*').eq('chat_id', chatId).maybeSingle();
      if (session) {
        currentStoreSlug = session.store_slug;
        currentUserId = session.user_id;
        chatHistory = session.history || [];
      }
    }

    const sendTelegramMessage = async (text) => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
      }).catch(err => console.error(err));
    }

    // SEGURANÇA: Se não tem ID, manda pro App
    if (!currentUserId || !currentStoreSlug) {
      await sendTelegramMessage("Olá! Para sua segurança, eu só atendo clientes conectados. Por favor, volte ao aplicativo e clique novamente no botão 'Pedir com o Garçom'. *Lembre-se de clicar em INICIAR (ou START) assim que o Telegram abrir.*");
      return new Response('ok')
    }

    // PUXAR DADOS DO CLIENTE E DA LOJA
    const [{ data: userProfile }, { data: storeData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle(),
      supabase.from('store_settings').select('menu_data').eq('store_slug', currentStoreSlug).maybeSingle()
    ]);

    if (!storeData || !storeData.menu_data || !userProfile) {
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
      { role: 'user', content: aiPromptText }
    ];

    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools, temperature: 0.7 }),
      });

      if (!aiResponse.ok) {
        await sendTelegramMessage("Ops! Meu cérebro de Inteligência Artificial deu uma travadinha (Erro na OpenAI). Por favor, avise o dono da loja!");
        return new Response('ok')
      }

      const aiData = await aiResponse.json();
      let responseMessage = aiData.choices[0].message;
      let replyText = responseMessage.content;

      if (responseMessage.tool_calls) {
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

      await sendTelegramMessage(replyText);

      const newHistory = [
        ...chatHistory,
        { role: 'user', content: aiPromptText },
        { role: 'assistant', content: replyText }
      ].slice(-10);

      await supabase.from('telegram_sessions').update({ history: newHistory }).eq('chat_id', chatId);
      return new Response(JSON.stringify({ status: 'success' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (openaiErr) {
      await sendTelegramMessage("Estou enfrentando problemas técnicos de conexão. Tente novamente mais tarde!");
      return new Response('ok')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})