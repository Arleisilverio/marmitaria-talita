import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testInsertOrder() {
  const { data, error } = await supabase.from('orders').insert({
    store_slug: 'espetinho-da-quebrada',
    customer_name: 'Teste Cliente',
    customer_phone: '11999999999',
    delivery_address: 'Rua Teste, 10',
    payment_method: 'pix',
    total_amount: 50.00,
    status: 'pendente',
    items_json: [{ id: '1', name: 'Espeto', price: 10, quantity: 5 }]
  }).select();

  console.log("Insert result:", { data, error });
}

testInsertOrder();
