import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function showColumns() {
  const { data } = await supabase.from('orders').select('*').limit(1);
  console.log("Existing columns in orders:", Object.keys(data?.[0] || {}));
}

showColumns();
