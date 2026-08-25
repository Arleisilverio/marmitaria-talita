import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkCurrentOrders() {
  const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10);
  console.log("Found", orders?.length, "orders");
  for (const o of (orders || [])) {
    console.log({
      id: o.id,
      customer_name: o.customer_name,
      status: o.status,
      notes: o.notes,
      store_slug: o.store_slug
    });
  }
}

checkCurrentOrders();
