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
    let aiPromptText = userText; 
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('telegram_bot_token')
    const openaiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('openai_api_key')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!botToken || !openaiKey || !supabaseUrl || !supabaseKey) {
      return new Response('Configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Função utilitária de envio
    const sendTelegramMessage = async (text) => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
      }).catch(err => console.error(err));
    }

    let currentStoreSlug = null;
    let currentUserId = null;
    let chatHistory = [];

    // TENTATIVA DE RECEBER O CÓDIGO Deep Link
    if (userText.startsWith('/start')) {
      const parts = userText.split(' ');
      if (parts.length > 1) {
        const payload = parts.slice(1).join('').trim(); 
        const payloadParts = payload.split('__');
        currentStoreSlug = payloadParts[0];
        if (payloadParts.length > 1) currentUserId = payloadParts[1];
        
        console.log(`[telegram-webhook] Sucesso no Deep Link. Loja: ${currentStoreSlug}, User: ${currentUserId}`);
        
        const { data: existingSession } = await supabase.from('telegram_sessions').select('chat_id').eq('chat_id', chatId).maybeSingle();
        
        const sessionData = { 
          store_slug: currentStoreSlug, 
          user_id: currentUserId,
          history: [], 
          updated_at: new Date().toISOString() 
        };

        await (existingSession 
          ? supabase.from('telegram_sessions').update(sessionData).eq('chat_id', chatId)
          : supabase.from('telegram_sessions').insert({ chat_id: chatId, ...sessionData }));
        
        aiPromptText = "Oi, acabei de chegar pelo aplicativo!";
      } else {
        await sendTelegramMessage("⚠️ *Aviso Importante*\n\nVocê enviou apenas o comando `/start` vazio e eu não consegui identificar sua conta.\n\nPor favor, volte ao aplicativo e copie o comando completo gerado na tela (Ex: `/start marmitaria...`) e cole aqui para mim!");
        return new Response('ok');
      }
    } else {
      // BUSCAR SESSÃO ANTIGA
      const { data: session } = await supabase.from('telegram_sessions').select('*').eq('chat_id', chatId).maybeSingle();
      if (session) {
        currentStoreSlug = session.store_slug;
        currentUserId = session.user_id;
        chatHistory = session.history || [];
      }
    }

    if (!currentUserId || !currentStoreSlug) {
      await sendTelegramMessage(`⚠️ *Erro de Autenticação*\n\nEu recebi sua mensagem: \`${userText}\`\n\nMas não consegui encontrar sua conta conectada. Por favor, volte ao aplicativo, clique no botão de IA e copie o comando que vai aparecer na tela.`);
      return new Response('ok')
    }

    // PUXAR DADOS DA LOJA E DO CLIENTE
    const [{ data: userProfile }, { data: storeData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle(),
      supabase.from('store_settings').select('menu_data').eq('store_slug', currentStoreSlug).maybeSingle()
    ]);

    if (!storeData || !storeData.menu_data || !userProfile) {
      await sendTelegramMessage("Ocorreu um erro ao carregar o cardápio. Tente conectar novamente.");
      return new Response('ok')
    }

    const { data: lastOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('store_slug', currentStoreSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const menuData = storeData.menu_data;
    let orderContext = "O cliente NÃO possui pedidos em andamento no momento.";
    let activeOrder = null;

    if (lastOrder && (lastOrder.status === 'pendente' || lastOrder.status === 'confirmado')) {
      activeOrder = lastOrder;
      
      const orderTime = new Date(lastOrder.created_at).getTime();
      const now = Date.now();
      const elapsedMinutes = Math.floor((now - orderTime) / 60000);
      
      const prepMin = menuData.prepTime?.min || 30;
      const prepMax = menuData.prepTime?.max || 50;
      const timeLeft = prepMax - elapsedMinutes;

      orderContext = `
      ATENÇÃO! O cliente tem um PEDIDO EM ANDAMENTO (ID: ${lastOrder.id}):
      - Status na cozinha: ${lastOrder.status}
      - Tempo decorrido desde o pedido: ${elapsedMinutes} minutos
      - Prazo da loja: ${prepMin} a ${prepMax} minutos
      - Situação: ${timeLeft > 0 ? `Ainda no prazo (faltam ${timeLeft}m).` : `ATRASADO EM ${Math.abs(timeLeft)} MINUTOS.`}

      INSTRUÇÕES DE STATUS:
      1. Informe o tempo decorrido amigavelmente se perguntado.
      2. Se estourou o prazo, peça desculpas e OBRIGATORIAMENTE use a função 'alert_store_delay'.
      `;
    }

    const aiName = menuData.aiName || 'Garçom';
    const aiPersona = menuData.aiPersona || `Você é ${aiName}, um atendente educado.`;
    
    const systemPrompt = `
      ${aiPersona}
      
      Cliente: ${userProfile.full_name} | Tel: ${userProfile.phone} | Endereço: ${userProfile.address}
      Loja: ${menuData.title} | Status: ${menuData.isOpen ? 'ABERTA' : 'FECHADA'}

      ${orderContext}
      
      CARDÁPIO DA LOJA:
      - Principal: ${menuData.title} (P: R$${menuData.prices?.p || 0}, M: R$${menuData.prices?.m || 0}, G: R$${menuData.prices?.g || 0})
      - Adicionais: ${menuData.meats?.map(m => `${m.name} (+R$${m.price || 0})`).join(', ') || 'Nenhum'}
      - Bebidas: ${menuData.drinks?.map(d => `${d.name} (R$${d.price})`).join(', ') || 'Nenhuma'}
      - Taxa de Entrega: R$${menuData.deliveryFee || 0}
      
      ⚠️ REGRAS RESTRITAS E LIMITES DE CONVERSA (MUITO IMPORTANTE):
      1. VOCÊ É EXCLUSIVAMENTE UM GARÇOM. É ESTRITAMENTE PROIBIDO conversar sobre política, religião, programação, conhecimentos gerais, contar piadas ou discutir qualquer assunto fora do contexto do restaurante/cardápio.
      2. Se o cliente tentar sair do assunto, responder algo ofensivo ou fazer perguntas genéricas, responda APENAS E EXATAMENTE: "Desculpe, sou apenas o garçom virtual da loja. Posso te ajudar a escolher algo do nosso cardápio ou verificar seu pedido?" e não desenvolva o assunto.
      3. Seja SEMPRE extremamente CURTO, DIRETO e OBJETIVO. Use no máximo 2 a 3 frases por resposta para economizar tempo do cliente (e tokens).
      4. Se o cliente quiser fechar o pedido, confirme TODOS os itens, a forma de pagamento (Pix, Dinheiro, Cartão) e se é Entrega ou Retirada.
      5. APENAS quando o cliente confirmar tudo, CHAME a função 'register_order'.
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
              items: { type: "array", description: "Lista de itens pedidos.", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, price: { type: "number" }, size: { type: "string", description: "Tamanho (P, M, G) se aplicável" } } } },
              payment_method: { type: "string", enum: ["pix", "dinheiro", "cartao_entrega"] },
              total_amount: { type: "number", description: "Valor total somando produtos e entrega" },
              delivery_type: { type: "string", enum: ["entrega", "retirada"] }
            },
            required: ["items", "payment_method", "total_amount", "delivery_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "alert_store_delay",
          description: "Notifica o restaurante/lojista de que o pedido estourou o prazo e o cliente reclamou da demora.",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string", description: "A resposta que você quer dar ao cliente confirmando que avisou a gerência." }
            },
            required: ["message"]
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
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools, temperature: 0.3 }), // Diminui a temperatura para ficar menos "criativo/falador"
      });

      if (!aiResponse.ok) {
        await sendTelegramMessage("Ops! Meu cérebro de Inteligência Artificial deu uma travadinha. Por favor, avise o dono da loja!");
        return new Response('ok')
      }

      const aiData = await aiResponse.json();
      let responseMessage = aiData.choices[0].message;
      let replyText = responseMessage.content;

      // PROCESSAR FUNÇÕES CHAMADAS PELA IA
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
            messages.push({ role: "tool", tool_call_id: toolCall.id, content: orderError ? "Erro ao salvar pedido." : "Pedido registrado com sucesso no painel da loja!" });

            const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST', headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3 }),
            });
            replyText = (await secondResponse.json()).choices[0].message.content;
          }
          
          else if (toolCall.function.name === 'alert_store_delay') {
            if (activeOrder && !activeOrder.customer_name.includes('⚠️')) {
              await supabase.from('orders').update({
                customer_name: `⚠️ ATRASADO - ${activeOrder.customer_name}`
              }).eq('id', activeOrder.id);
            }

            messages.push(responseMessage);
            messages.push({ role: "tool", tool_call_id: toolCall.id, content: "Restaurante notificado no painel administrativo com sucesso!" });

            const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST', headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3 }),
            });
            replyText = (await secondResponse.json()).choices[0].message.content;
          }
        }
      }

      if (!replyText) replyText = "Desculpe, tive um problema de comunicação aqui. Pode repetir?";

      await sendTelegramMessage(replyText);

      const newHistory = [...chatHistory, { role: 'user', content: aiPromptText }, { role: 'assistant', content: replyText }].slice(-6); // Reduzi de -10 para -6 para economizar tokens lidos na memória
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