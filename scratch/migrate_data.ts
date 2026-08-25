import { createClient } from '@supabase/supabase-js';

const OLD_CONFIG = {
  url: "https://zsqxlekvopvmbjfebyrt.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcXhsZWt2b3B2bWJqZmVieXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ4MDksImV4cCI6MjA5MjM4MDgwOX0.mn_SBxCd9XVs09uOamjGT9oANn0KZ1OnzjHvdU0ocbs"
};

const NEW_CONFIG = {
  url: "https://kigindzghkbkwgzljrdz.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ2luZHpnaGtia3dnemxqcmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjA4MzQsImV4cCI6MjA5MzMzNjgzNH0.aRPE1ez64r6UuivehA3rQJHPEdZrOmKdyLrTcAlL5J4"
};

const oldSupabase = createClient(OLD_CONFIG.url, OLD_CONFIG.key);
const newSupabase = createClient(NEW_CONFIG.url, NEW_CONFIG.key);

async function migrate() {
  console.log("🚀 Iniciando migração de dados...");

  // 1. Migrar app_admins
  console.log("📦 Copiando app_admins...");
  const { data: admins, error: adminsError } = await oldSupabase
    .from('app_admins')
    .select('*');

  if (adminsError) {
    console.error("❌ Erro ao ler admins do banco antigo:", adminsError.message);
  } else if (admins && admins.length > 0) {
    // Filtrar apenas o que parece ser da Marmitaria (pelo slug ou nome)
    // No caso, o usuário disse que as tabelas estavam lá por engano, 
    // então provavelmente tudo em app_admins lá é da marmitaria ou relacionado.
    console.log(`✅ Lidos ${admins.length} administradores.`);
    
    // Remover IDs para deixar o novo banco gerar novos (ou manter se preferir, mas melhor deixar gerar)
    const cleanAdmins = admins.map(({ id, ...rest }) => rest);
    
    const { error: insertAdminsError } = await newSupabase
      .from('app_admins')
      .upsert(cleanAdmins, { onConflict: 'email' });

    if (insertAdminsError) {
      console.error("❌ Erro ao inserir admins no banco novo:", insertAdminsError.message);
    } else {
      console.log("✨ Admins migrados com sucesso!");
    }
  }

  // 2. Migrar store_settings
  console.log("📦 Copiando store_settings...");
  const { data: settings, error: settingsError } = await oldSupabase
    .from('store_settings')
    .select('*');

  if (settingsError) {
    console.error("❌ Erro ao ler settings do banco antigo:", settingsError.message);
  } else if (settings && settings.length > 0) {
    console.log(`✅ Lidas ${settings.length} configurações de loja.`);
    
    const cleanSettings = settings.map(({ id, ...rest }) => rest);
    
    const { error: insertSettingsError } = await newSupabase
      .from('store_settings')
      .upsert(cleanSettings, { onConflict: 'store_slug' });

    if (insertSettingsError) {
      console.error("❌ Erro ao inserir settings no banco novo:", insertSettingsError.message);
    } else {
      console.log("✨ Store settings migrados com sucesso!");
    }
  }

  console.log("🏁 Migração finalizada!");
}

migrate();
