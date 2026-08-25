import { createClient } from '@supabase/supabase-js';

// Usamos as variáveis de ambiente com fallback seguro do projeto para evitar tela preta na Vercel
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "https://eiqapzziyejicnhfsjdy.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjg3MjYsImV4cCI6MjA5NDcwNDcyNn0.6v2K9-ntBJ1ozCetZMRsNtrgBlBmkXOc23CYRiqB4s8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});