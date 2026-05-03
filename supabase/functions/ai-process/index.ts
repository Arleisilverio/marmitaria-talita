// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, context } = await req.json()
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not set in Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é a Talita, a assistente virtual gentil e eficiente da Marmitaria Talita. 
            Seu objetivo é ajudar os clientes a escolherem suas marmitas, tirar dúvidas sobre o cardápio e ingredientes.
            Contexto do Cardápio: ${JSON.stringify(context)}
            Instruções:
            1. Seja sempre cordial e use um tom acolhedor de comida caseira.
            2. Se o cliente quiser pedir, oriente-o a usar o carrinho no app ou forneça as opções.
            3. Responda de forma curta e objetiva.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const reply = data.choices[0].message.content

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})