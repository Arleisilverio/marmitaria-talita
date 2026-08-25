import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

inspectProfiles();
