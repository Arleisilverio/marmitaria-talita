const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

async function testSqlApi() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log("Status RPC exec_sql:", res.status, await res.text());
  } catch (e: any) {
    console.log("Erro:", e.message);
  }
}

testSqlApi();
