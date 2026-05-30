import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Debug check — remove after confirming connection works ───────────────────
console.log('[NeuroLearn] Supabase URL loaded:', supabaseUrl ? '✅ Found' : '❌ MISSING');
console.log('[NeuroLearn] Supabase Key loaded:', supabaseAnonKey ? '✅ Found' : '❌ MISSING');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);