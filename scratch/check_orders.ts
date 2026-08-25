import { supabase } from '../src/integrations/supabase/client';

async function checkRecentOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log("Recent orders:", orders);
  if (error) console.error("Error fetching orders:", error);
}

checkRecentOrders();
