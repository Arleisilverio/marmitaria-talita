import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://eiqapzziyejicnhfsjdy.supabase.co",
  process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjg3MjYsImV4cCI6MjA5NDcwNDcyNn0.6v2K9-ntBJ1ozCetZMRsNtrgBlBmkXOc23CYRiqB4s8"
);

async function fixStoreNames() {
  console.log("🔄 Atualizando nomes de lojas no banco de dados para Da Quebrada...");

  // 1. Atualizar store_settings para marmitaria-talita -> da-quebrada
  const { data: marmitariaOld } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', 'marmitaria-talita')
    .maybeSingle();

  if (marmitariaOld) {
    const updatedMenu = {
      ...marmitariaOld.menu_data,
      title: "Marmitaria da Quebrada",
      description: "Marmitas caseiras fresquinhas, feitas com carinho e o melhor tempero da quebrada.",
      store_slug: "da-quebrada"
    };

    // Inserir ou atualizar com o novo slug 'da-quebrada'
    await supabase.from('store_settings').upsert({
      store_slug: 'da-quebrada',
      menu_data: updatedMenu,
      updated_at: new Date().toISOString()
    }, { onConflict: 'store_slug' });

    // Atualizar também o antigo para não exibir o nome velho caso seja acessado
    await supabase.from('store_settings').update({
      menu_data: updatedMenu
    }).eq('store_slug', 'marmitaria-talita');

    console.log("✅ Marmitaria da Quebrada atualizada no banco!");
  } else {
    // Se não existir, cria a loja principal da-quebrada
    await supabase.from('store_settings').upsert({
      store_slug: 'da-quebrada',
      menu_data: {
        title: "Marmitaria da Quebrada",
        description: "Marmitas caseiras fresquinhas, feitas com carinho e o melhor tempero da quebrada.",
        isOpen: true,
        niche: "marmitaria",
        hasDelivery: true,
        deliveryFee: 5,
        prepTime: 30,
        prices: { p: 15, m: 20, g: 25 },
        meats: [
          { name: "Carne de Panela com Batata", available: true },
          { name: "Frango Grelhado Suculento", available: true },
          { name: "Bife Acebolado", available: true }
        ],
        drinks: [
          { name: "Coca-Cola Lata 350ml", price: 6, available: true },
          { name: "Guaraná Antarctica Lata", price: 6, available: true },
          { name: "Suco Natural de Laranja 500ml", price: 8, available: true }
        ]
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'store_slug' });
    console.log("✅ Marmitaria da Quebrada criada!");
  }

  // 2. Atualizar talita-bolos-doces para doces-da-quebrada
  const { data: docesOld } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', 'talita-bolos-doces')
    .maybeSingle();

  if (docesOld) {
    const updatedDoces = {
      ...docesOld.menu_data,
      title: "Bolos & Doces da Quebrada",
      description: "Deliciosos bolos caseiros, fatias recheadas, tortas e doces artesanais da quebrada.",
      store_slug: "doces-da-quebrada"
    };

    await supabase.from('store_settings').upsert({
      store_slug: 'doces-da-quebrada',
      menu_data: updatedDoces,
      updated_at: new Date().toISOString()
    }, { onConflict: 'store_slug' });

    await supabase.from('store_settings').update({
      menu_data: updatedDoces
    }).eq('store_slug', 'talita-bolos-doces');

    console.log("✅ Bolos & Doces da Quebrada atualizados no banco!");
  }

  // 3. Garantir admin principal para arleisilverio41@gmail.com
  const { data: existingAdmin } = await supabase
    .from('app_admins')
    .select('*')
    .eq('email', 'arleisilverio41@gmail.com')
    .maybeSingle();

  if (existingAdmin) {
    await supabase.from('app_admins').update({
      store_name: 'Marmitaria da Quebrada',
      slug: 'da-quebrada',
      status: 'active'
    }).eq('id', existingAdmin.id);
    console.log("✅ Admin atualizado para Marmitaria da Quebrada!");
  } else {
    await supabase.from('app_admins').insert({
      email: 'arleisilverio41@gmail.com',
      store_name: 'Marmitaria da Quebrada',
      slug: 'da-quebrada',
      status: 'active'
    });
    console.log("✅ Admin cadastrado!");
  }

  console.log("🎉 Todas as lojas no banco agora são Da Quebrada!");
}

fixStoreNames();
