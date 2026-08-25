import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testNewClientProfile() {
  console.log("Testando inserção de perfil de novo cliente...");

  // Criar ID de teste de um novo cliente
  const fakeUserId = "99999999-9999-4999-9999-999999999999";

  const { data, error } = await supabase.from('profiles').upsert({
    id: fakeUserId,
    email: "cliente_novo@teste.com",
    full_name: "Cliente Teste Silva",
    phone: "11988887777",
    address: "Rua dos Espetinhos, 123 - Vila da Quebrada",
    avatar_url: "",
    updated_at: new Date().toISOString()
  }).select();

  if (error) {
    console.error("❌ ERRO AO SALVAR PERFIL DO NOVO CLIENTE:", error);
    console.log("👉 O script SQL fix_profiles_table.sql precisa ser executado no painel do Supabase!");
  } else {
    console.log("✅ SUCESSO! Perfil do novo cliente salvo com perfeição:", data);
    // Limpar o teste
    await supabase.from('profiles').delete().eq('id', fakeUserId);
  }
}

testNewClientProfile();
