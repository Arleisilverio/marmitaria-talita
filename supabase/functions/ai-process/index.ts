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
    const payload = await req.json()
    const { message, messages, context, storeName, aiConfig } = payload

    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('VITE_OPENAI_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY não configurada nos Segredos do Supabase.',
          fallback: true
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const botName = aiConfig?.botName || context?.ai_config?.botName || 'Garçom Virtual'
    const restaurantName = storeName || context?.title || 'nossa loja'
    const customInstructions = aiConfig?.customInstructions || context?.ai_config?.customInstructions || ''

    // Monta o resumo do cardápio para a IA
    let menuSummary = `Nome da Loja: ${restaurantName}\n`
    if (context?.description) menuSummary += `Descrição: ${context.description}\n`
    if (context?.prepTime) menuSummary += `Tempo médio de preparo: ${context.prepTime} min\n`
    if (context?.hasDelivery) menuSummary += `Delivery disponível (Taxa de Entrega: R$ ${context.deliveryFee || 0})\n`

    if (context?.prices) {
      menuSummary += `Preços das Marmitas: Pequena (P) = R$ ${context.prices.p}, Média (M) = R$ ${context.prices.m}, Grande (G) = R$ ${context.prices.g}\n`
    }
    if (context?.meats && context.meats.length > 0) {
      const meatList = context.meats.map((m: any) => typeof m === 'object' ? m.name : m).join(', ')
      menuSummary += `Opções de Carnes / Pratos do Dia: ${meatList}\n`
    }
    if (context?.products && context.products.length > 0) {
      const productList = context.products.map((p: any) => `${p.name} (R$ ${p.price}${p.category ? ' - ' + p.category : ''})`).join(', ')
      menuSummary += `Produtos / Itens do Cardápio: ${productList}\n`
    }
    if (context?.drinks && context.drinks.length > 0) {
      const drinkList = context.drinks.map((d: any) => `${d.name} (R$ ${d.price})`).join(', ')
      menuSummary += `Bebidas e Acompanhamentos: ${drinkList}\n`
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
`

    let conversationMessages = [{ role: 'system', content: systemPrompt }]

    if (Array.isArray(messages) && messages.length > 0) {
      conversationMessages = conversationMessages.concat(
        messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content || '')
        }))
      )
    } else if (message) {
      conversationMessages.push({ role: 'user', content: String(message) })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI Error:', data)
      throw new Error(data.error?.message || `OpenAI error ${response.status}`)
    }

    const reply = data.choices?.[0]?.message?.content || 'Como posso te ajudar hoje?'

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('ai-process error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar atendimento IA' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
