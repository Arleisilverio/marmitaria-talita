import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

function attachCourierToNotes(currentNotes: string | null | undefined, courierData: { id: string; name: string; dispatched_at?: string }) {
  const clean = (currentNotes || '').replace(/\[COURIER:[\s\S]*?\]/g, '').trim();
  const courierTag = `[COURIER:${JSON.stringify(courierData)}]`;
  return clean ? `${clean}\n${courierTag}` : courierTag;
}

function extractCourierFromOrder(order: any) {
  if (order.courier_name) {
    return {
      courier_id: order.courier_id,
      courier_name: order.courier_name,
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
        };
      } catch (e) {}
    }
  }
  return null;
}

async function testNotesDispatch() {
  const { data: orders } = await supabase.from('orders').select('*').limit(1);
  if (!orders || orders.length === 0) return console.log("No orders");
  
  const testOrder = orders[0];
  const notesWithCourier = attachCourierToNotes(testOrder.notes, {
    id: 'courier_123',
    name: 'Carlos Oliveira Motoboy',
    dispatched_at: new Date().toISOString()
  });

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'confirmado',
      notes: notesWithCourier
    })
    .eq('id', testOrder.id)
    .select();

  if (error) {
    console.error("Notes update error:", error);
  } else {
    console.log("Updated order with notes courier!", data);
    const extracted = extractCourierFromOrder(data[0]);
    console.log("Extracted courier:", extracted);
  }
}

testNotesDispatch();
