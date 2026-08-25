import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminUser() {
  const email = "arleisilverio41@gmail.com";
  const password = "admin123456"; // Senha padrão fácil e segura para o primeiro acesso

  console.log(`Configurando usuário admin no Supabase Auth: ${email}...`);

  // 1. Verificar se usuário já existe
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  
  const existing = (users as any[])?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`Usuário encontrado com ID: ${existing.id}. Atualizando senha...`);
    const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password: password,
      email_confirm: true
    });

    if (updateErr) {
      console.error("Erro ao atualizar senha:", updateErr.message);
    } else {
      console.log("✅ Senha atualizada com sucesso!");
    }
  } else {
    console.log("Criando novo usuário admin confirmado...");
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'superadmin',
        full_name: 'Arlei Silvério'
      }
    });

    if (createErr) {
      console.error("Erro ao criar usuário:", createErr.message);
    } else {
      console.log(`✅ Usuário criado com sucesso com ID: ${created.user?.id}`);
    }
  }
}

setupAdminUser();
