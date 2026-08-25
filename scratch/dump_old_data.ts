import { createClient } from '@supabase/supabase-js';

const OLD_CONFIG = {
  url: "https://zsqxlekvopvmbjfebyrt.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcXhsZWt2b3B2bWJqZmVieXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ4MDksImV4cCI6MjA5MjM4MDgwOX0.mn_SBxCd9XVs09uOamjGT9oANn0KZ1OnzjHvdU0ocbs"
};

const oldSupabase = createClient(OLD_CONFIG.url, OLD_CONFIG.key);

async function dump() {
  const { data: admins } = await oldSupabase.from('app_admins').select('*');
  const { data: settings } = await oldSupabase.from('store_settings').select('*');

  console.log("--- ADMINS ---");
  console.log(JSON.stringify(admins, null, 2));
  console.log("--- SETTINGS ---");
  console.log(JSON.stringify(settings, null, 2));
}

dump();
