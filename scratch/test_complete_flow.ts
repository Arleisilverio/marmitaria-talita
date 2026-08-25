import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

function attachCourierToNotes(currentNotes: string | null | undefined, courierData: { id: string; name: string; dispatched_at?: string; delivered_at?: string }) {
  const clean = (currentNotes || '').replace(/\[COURIER:[\s\S]*?\]/g, '').trim();
  const courierTag = `[COURIER:${JSON.stringify(courierData)}]`;
  return clean ? `${clean}\n${courierTag}` : courierTag;
}

function extractCourierFromOrder(order: any) {
  if (!order) return null;
  if (order.courier_name) {
    return {
      courier_id: order.courier_id,
      courier_name: order.courier_name,
      dispatched_at: order.dispatched_at,
      delivered_at: order.delivered_at
    };
  }
  if (order.notes) {
    const match = order.notes.match(/\[COURIER:([\s\S]*?)\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        return {
          courier_id: parsed.id || parsed.courier_id,
          courier_name: parsed.name || parsed.courier_name,
          dispatched_at: parsed.dispatched_at,
          delivered_at: parsed.delivered_at
        };
      } catch (e) {}
    }
  }
  return null;
}

async function testComplete() {
  const orderId = '24a991d0-f588-4280-9367-b9271fb04d59';
  const courierId = 'courier_1787463559124_fjan8';
  const storeSlug = 'doces-e-guloseimas';

  const { data: currentOrder, error: fErr } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  console.log("Current order:", currentOrder, "fErr:", fErr);

  const existingCourier = extractCourierFromOrder(currentOrder);
  console.log("Existing courier extracted:", existingCourier);

  const newNotes = attachCourierToNotes(currentOrder?.notes, {
    id: courierId,
    name: existingCourier?.courier_name || 'vitoria',
    delivered_at: new Date().toISOString()
  });
  console.log("New notes:", newNotes);

  const { data: upData, error: upErr } = await supabase.from('orders').update({
    status: 'entregue',
    notes: newNotes
  }).eq('id', orderId).select();

  console.log("Update result:", upData, "upErr:", upErr);

  // Now test getCourierOrders
  const { data: allOrders } = await supabase.from('orders').select('*').eq('store_slug', storeSlug);
  const mapped = allOrders?.map((o: any) => {
    const courierMeta = extractCourierFromOrder(o);
    return {
      ...o,
      courier_id: courierMeta?.courier_id || o.courier_id,
      courier_name: courierMeta?.courier_name || o.courier_name,
      delivered_at: courierMeta?.delivered_at || o.delivered_at
    };
  });

  const myOrders = mapped?.filter((o: any) => o.courier_id === courierId);
  console.log("All orders count for store:", allOrders?.length);
  console.log("My orders for courier:", myOrders?.length, myOrders);
}

testComplete();
