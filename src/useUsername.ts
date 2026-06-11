import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// ── Detect device type ────────────────────────────────────────────────────────
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

// ── Detect country via free IP geolocation ────────────────────────────────────
async function getCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      return data.country_name || 'Unknown';
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// ── Register user in Supabase and store UUID in localStorage ──────────────────
async function registerUser(username: string): Promise<void> {
  // Step 1 — Get country safely
  let country = 'Unknown';
  try {
    country = await getCountry();
  } catch {
    country = 'Unknown';
  }

  const device_type = getDeviceType();

  try {
    // Step 2 — Check if username already exists in Supabase
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (lookupError) {
      console.error('[NeuroLearn] User lookup error:', lookupError.message);
    }

    if (existing?.id) {
      // User already registered — just store the UUID locally
      localStorage.setItem('neurolearn_user_id', existing.id);
      console.log('[NeuroLearn] Existing user found, UUID stored:', existing.id);
      return;
    }

    // Step 3 — New user — insert and capture the returned UUID
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({ username, country, device_type })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Race condition — duplicate insert — look up the existing UUID
        const { data: retry } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        if (retry?.id) {
          localStorage.setItem('neurolearn_user_id', retry.id);
          console.log('[NeuroLearn] UUID stored after duplicate race:', retry.id);
        }
      } else {
        console.error('[NeuroLearn] Supabase insert error:', insertError.code, insertError.message);
      }
    } else if (inserted?.id) {
      // Store the new UUID in localStorage
      localStorage.setItem('neurolearn_user_id', inserted.id);
      console.log('[NeuroLearn] User registered successfully:', username, '|', country, '|', device_type, '| UUID:', inserted.id);
    }

  } catch (err) {
    console.error('[NeuroLearn] Registration failed unexpectedly:', err);
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useUsername() {
  const [username, setUsername] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('neurolearn_username');
    if (saved) {
      setUsername(saved);

      // If we have a username but no UUID yet, fetch it from Supabase
      const savedId = localStorage.getItem('neurolearn_user_id');
      if (!savedId) {
        supabase
          .from('users')
          .select('id')
          .eq('username', saved)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.id) {
              localStorage.setItem('neurolearn_user_id', data.id);
              console.log('[NeuroLearn] UUID backfilled for existing user:', data.id);
            }
          });
      }
    } else {
      // No username found — show the prompt
      setShowPrompt(true);
    }
  }, []);

  const submitUsername = async (name: string) => {
    const cleaned = name.trim().slice(0, 20);
    if (!cleaned) return;

    // Save locally first — app works even if Supabase is unreachable
    localStorage.setItem('neurolearn_username', cleaned);
    setUsername(cleaned);
    setShowPrompt(false);

    // Register in Supabase and store UUID in background
    await registerUser(cleaned);
  };

  return { username, showPrompt, submitUsername };
}
