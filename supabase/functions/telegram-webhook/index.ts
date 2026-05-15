// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    
    // O Telegram envia a mensagem no campo "message"
    const message = body.message
    if (!message || !message.text) {
      return new Response('ok') // Ignora edições, fotos, etc (por enquanto)
    }

    const chatId = message.chat.id
    const userText = message.text
    
    // Variáveis de ambiente
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Precisamos da service_role para burlar o RLS e ler configurações

    if (!botToken || !openaiKey || !supabaseUrl || !supabaseKey) {
      console.error("[telegram-webhook] Missing environment variables")
      return new Response('Configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    let currentStoreSlug = null;

    // LÓGICA DE DEEP LINK E SESSÃO
    // Se o usuário clicar no botão do App, a primeira mensagem será: "/start nomedaloja"
    if (userText.startsWith('/start ')) {
      currentStoreSlug = userText.split(' ')[1].trim();
      
      // Salva no banco de dados que esse chat_id agora está falando com essa loja
      await supabase
        .from('telegram_sessions')
        .upsert({ chat_id: chatId, store_slug: currentStoreSlug, updated_at: new Date().toISOString() });
      
    } else {
      // Se não for um /start, tenta achar qual a loja salva na sessão desse usuário
      const { data: session } = await supabase
        .from('telegram_sessions')
        .select('store_slug')
        .eq('chat_id', chatId)
        .single();
        
      if (session) {
        currentStoreSlug = session.store_slug;
      }
    }

    // Se ainda não tivermos a loja (ex: mandou oi do nada pro bot), pedimos para ele ir pelo App
    if (!currentStoreSlug) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Olá! Para eu saber de qual loja você quer pedir, por favor, clique no botão 'Pedir com o Garçom' lá no aplicativo da loja."
        })
      });
      return new Response('ok')
    }

    // Puxar as configurações e cardápio DA LOJA ESPECÍFICA
    const { data: storeData } = await supabase
      .from('store_settings')
      .select('menu_data')
      .eq('store_slug', currentStoreSlug)
      .single();

    if (!storeData || !storeData.menu_data) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: "Desculpe, não consegui carregar o cardápio dessa loja no momento." })
      });
      return new Response('ok')
    }

    const menuData = storeData.menu_data;
    
    // MONTA O CÉREBRO (PROMPT) DA IA BASEADO NAS CONFIGS DO LOJISTA
    const aiName = menuData.aiName || 'Assistente';
    const aiPersona = menuData.aiPersona || `Você é ${aiName}, atendente educado(a) e ágil.`;
    
    const systemPrompt = `
      ${aiPersona}
      
      SEU NOME É: ${aiName}
      NOME DA LOJA: ${menuData.title}
      STATUS: A loja está ${menuData.isOpen ? 'ABERTA' : 'FECHADA'}. ${!menuData.isOpen ? 'Avise o cliente que não estamos aceitando pedidos agora.' : ''}
      
      CARDÁPIO DA LOJA:
      - Principal: ${menuData.title} (P: R$${menuData.prices.p}, M: R$${menuData.prices.m}, G: R$${menuData.prices.g})
      - Adicionais: ${menuData.meats?.map((m: any) => `${m.name} (+R$${m.price || 0})`).join(', ') || 'Nenhum'}
      - Bebidas/Extras: ${menuData.drinks?.map((d: any) => `${d.name} (R$${d.price})`).join(', ') || 'Nenhuma'}
      
      REGRAS:
      1. Siga a personalidade que foi definida para você.
      2. Mantenha as respostas curtas para o Telegram.
      3. Se o cliente fechar o pedido, anote os itens, o endereço (ou se é retirada) e a forma de pagamento (Pix, Cartão, Dinheiro).
      4. Quando confirmar tudo, dê um resumo e diga que o pedido foi enviado para a cozinha.
    `;

    // CHAMA A OPENAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        temperature: 0.7,
      }),
    })

    const aiData = await aiResponse.json()
    const replyText = aiData.choices?.[0]?.message?.content || "Desculpe, tive um rápido travamento nas minhas engrenagens. Pode repetir?"

    // MANDA A RESPOSTA PRO TELEGRAM
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown'
      })
    })

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[telegram-webhook] Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})