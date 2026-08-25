import { createClient } from '@supabase/supabase-js';

const OLD_CONFIG = {
  url: "https://zsqxlekvopvmbjfebyrt.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcXhsZWt2b3B2bWJqZmVieXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ4MDksImV4cCI6MjA5MjM4MDgwOX0.mn_SBxCd9XVs09uOamjGT9oANn0KZ1OnzjHvdU0ocbs"
};

const oldSupabase = createClient(OLD_CONFIG.url, OLD_CONFIG.key);

async function inspect() {
  // Query to list tables in public schema
  const { data, error } = await oldSupabase.rpc('get_tables_info'); 
  // If RPC is not available, we can try to guess or use standard queries if we had service role
  // But since we have anon, we can only query tables we have access to.
  
  const tables = ['app_admins', 'store_settings', 'orders', 'profiles'];
  for (const table of tables) {
    const { data: rows, error } = await oldSupabase.from(table).select('*');
    console.log(`Table ${table}: ${rows?.length || 0} rows`);
    if (error) console.log(`Error on ${table}: ${error.message}`);
  }
}

inspect();
