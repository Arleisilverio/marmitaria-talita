import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert order into Supabase...");
  const { data, error } = await supabase.from('orders').insert({
    customer_name: 'João Teste Garçom IA',
    customer_phone: '11988887777',
    delivery_address: 'Rua das Flores, 100',
    payment_method: 'cartao_entrega',
    total_amount: 19.00,
    status: 'pendente',
    items_json: [
      { name: "Torta de Limão no Pote", price: 14.0, quantity: 1 },
      { name: "Café Expresso Gourmet", price: 5.0, quantity: 1 }
    ],
    store_slug: 'marmitaria-talita'
  }).select().single();

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Order inserted successfully! Order ID:", data.id);
  }
}

testInsert();
