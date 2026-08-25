import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCouriers() {
  console.log("Checking store_couriers table...");
  const { data, error } = await supabase.from('store_couriers').select('*').limit(1);
  if (error) {
    console.error("Table store_couriers check:", error.message);
  } else {
    console.log("Table store_couriers is accessible! Data:", data);
  }
}

testCouriers();
