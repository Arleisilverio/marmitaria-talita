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
    const { orderId, status } = await req.json()
    console.log(`[notify-order-status] Recebido atualização de status para pedido ${orderId}: ${status}`)

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('telegram_bot_token')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!botToken || !supabaseUrl || !supabaseKey) {
      console.error("[notify-order-status] Erro de configuração: faltam chaves de ambiente.")
      return new Response(JSON.stringify({ error: 'Configuração incompleta' }), { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Busca o pedido
    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (orderError || !order) {
      console.error(`[notify-order-status] Pedido não encontrado: ${orderId}`)
      return new Response(JSON.stringify({ error: 'Pedido não encontrado' }), { headers: corsHeaders })
    }

    // Busca a sessão do Telegram do usuário (para saber para qual celular mandar)
    const { data: session } = await supabase.from('telegram_sessions').select('chat_id').eq('user_id', order.user_id).maybeSingle()
    
    if (!session || !session.chat_id) {
      console.log(`[notify-order-status] Usuário do pedido ${orderId} não possui chat_id no Telegram. Ignorando notificação.`)
      return new Response(JSON.stringify({ success: true, message: 'Usuário sem telegram' }), { headers: corsHeaders })
    }

    // Busca configurações da loja para o Recibo
    const { data: storeSettings } = await supabase.from('store_settings').select('menu_data').eq('store_slug', order.store_slug).maybeSingle()
    const storeName = storeSettings?.menu_data?.title || 'Nossa Loja'

    let message = ''

    // STATUS: PREPARANDO
    if (status === 'confirmado') {
      message = `👩‍🍳 *Boas notícias!*\n\nSeu pedido foi *recebido e está sendo preparado* pela equipe da *${storeName}*. Capricho garantido!\n\nAssim que sair para entrega (ou estiver pronto para retirada), eu te aviso aqui.`
    } 
    // STATUS: SAIU PARA ENTREGA / ENTREGUE (CUPOM FISCAL)
    else if (status === 'entregue') {
      
      const orderDate = new Date(order.created_at)
      
      // Formata a lista de itens
      let itemsText = ''
      if (Array.isArray(order.items_json)) {
        itemsText = order.items_json.map((item: any) => {
           const name = typeof item.name === 'object' ? item.name.name : item.name;
           const size = item.size ? ` (Tam: ${item.size})` : '';
           const itemTotal = item.price * item.quantity;
           const priceStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemTotal);
           return `▫️ ${item.quantity}x ${name}${size} - ${priceStr}`;
        }).join('\n');
      }

      const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount);
      const paymentMethod = order.payment_method ? order.payment_method.replace('_', ' ').toUpperCase() : 'NÃO INFORMADO';
      
      message = `🛵 *Prontinho!* Seu pedido saiu para entrega (ou já pode ser retirado no balcão).\n\nAqui está o seu comprovante:\n\n` +
                `🧾 *CUPOM DO PEDIDO*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏪 *Loja:* ${storeName}\n` +
                `👤 *Cliente:* ${order.customer_name}\n` +
                `📅 *Data:* ${orderDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${orderDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}\n` +
                `📍 *Endereço:* ${order.delivery_address}\n\n` +
                `*ITENS DO PEDIDO:*\n${itemsText}\n\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💰 *VALOR TOTAL:* ${totalFormatted}\n` +
                `💳 *PAGAMENTO:* ${paymentMethod}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `Agradecemos a preferência! Bom apetite! 😋`
    }

    if (message) {
      console.log(`[notify-order-status] Enviando notificação para o chat ${session.chat_id}...`)
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: session.chat_id,
          text: message,
          parse_mode: 'Markdown'
        })
      })
      
      if (!response.ok) {
        console.error(`[notify-order-status] Erro do Telegram:`, await response.text())
      } else {
        console.log(`[notify-order-status] Notificação enviada com sucesso.`)
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('[notify-order-status] Falha crítica:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})