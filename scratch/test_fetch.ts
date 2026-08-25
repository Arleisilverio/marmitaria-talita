import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testFetchAndExtract() {
  const { data: orders, error } = await supabase.from('orders').select('*').limit(3);
  console.log("Orders found:", orders?.length, "Error:", error);
  if (orders && orders.length > 0) {
    console.log("First order notes:", orders[0].notes);
  }
}

testFetchAndExtract();
