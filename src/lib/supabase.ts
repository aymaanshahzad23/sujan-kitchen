import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn(
    'Supabase env vars missing. Copy .env.example to .env.local and add your project credentials.',
  );
}

// Untyped client — row types are asserted in hooks via src/types/database.ts
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
);

export const isSupabaseConfigured = Boolean(url && key);
