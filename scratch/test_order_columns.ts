import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderUpdate() {
  console.log("Testing update on orders with courier_id...");
  const { data: orders, error: fetchErr } = await supabase.from('orders').select('*').limit(1);
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  if (orders && orders.length > 0) {
    const testOrder = orders[0];
    console.log("Found order:", testOrder.id);
    const { data, error } = await supabase.from('orders').update({
      courier_name: 'Teste Motoboy',
      dispatched_at: new Date().toISOString()
    }).eq('id', testOrder.id).select();
    
    if (error) {
      console.error("Update error:", error);
    } else {
      console.log("Update success!", data);
    }
  } else {
    console.log("No orders in table.");
  }
}

testOrderUpdate();
