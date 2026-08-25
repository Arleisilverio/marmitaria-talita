import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testWhyUpdateFails() {
  const orderId = '24a991d0-f588-4280-9367-b9271fb04d59';

  // 1. Try simple update
  const res1 = await supabase.from('orders').update({ status: 'entregue' }).eq('id', orderId);
  console.log("res1 (anon update):", res1);

  // Check if status changed
  const { data: check1 } = await supabase.from('orders').select('id, status, user_id').eq('id', orderId).single();
  console.log("Check1 after update:", check1);
}

testWhyUpdateFails();
