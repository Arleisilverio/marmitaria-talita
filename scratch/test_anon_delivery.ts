import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testCompleteDeliveryAsAnon() {
  const { data: orders, error } = await supabase.from('orders').select('*').limit(1);
  if (!orders || orders.length === 0) return console.log("No orders found");
  
  const testOrder = orders[0];
  console.log("Testing update on order:", testOrder.id, "current status:", testOrder.status);

  const { data, error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'entregue'
    })
    .eq('id', testOrder.id);

  if (updateErr) {
    console.error("Order update error:", updateErr);
  } else {
    console.log("Order updated to entregue successfully!");
  }
}

testCompleteDeliveryAsAnon();
