// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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
    
    // Telegram sends the message in the "message" field
    const message = body.message
    if (!message || !message.text) {
      return new Response('ok') // Ignore non-text messages
    }

    const chatId = message.chat.id
    const userText = message.text
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!botToken || !openaiKey) {
      console.error("[telegram-webhook] Missing environment variables")
      return new Response('Configuration error', { status: 500 })
    }

    // 1. Get AI Response from OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é a Talita, a assistente virtual da Marmitaria Talita no Telegram. \n            Seu objetivo é ser prestativa, rápida e gentil.\n            \n            Contexto: Você vende marmitas caseiras deliciosas.\n            Se o cliente demonstrar interesse em comprar, peça o nome e o que ele deseja.\n            Caso ele queira ver o cardápio completo ou finalizar com pagamento, você pode enviar o link do app.\n            \n            Mantenha as respostas curtas para o Telegram.`
          },
          { role: 'user', content: userText }
        ],
        temperature: 0.7,
      }),
    })

    const aiData = await aiResponse.json()
    const replyText = aiData.choices?.[0]?.message?.content || "Desculpe, estou com um probleminha técnico. Pode repetir?"

    // 2. Send reply back to Telegram
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
