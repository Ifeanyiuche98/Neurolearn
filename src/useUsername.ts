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
    // Geolocation blocked or failed — continue anyway
    return 'Unknown';
  }
}

// ── Register user in Supabase ─────────────────────────────────────────────────
async function registerUser(username: string): Promise<void> {
  // Step 1 — Get country safely. If this fails, we still continue.
  let country = 'Unknown';
  try {
    country = await getCountry();
  } catch {
    country = 'Unknown';
  }

  const device_type = getDeviceType();

  // Step 2 — Upsert into Supabase (insert if new, update if exists)
  // This replaces the old select+insert pattern which was failing
  // because .single() throws an error when zero rows are found
  try {
    const { error } = await supabase.from('users').upsert(
      { username, country, device_type },
      { onConflict: 'username' }
    );

    if (error) {
      console.error('[NeuroLearn] Supabase upsert error:', error.message);
    } else {
      console.log('[NeuroLearn] User registered:', username, '|', country, '|', device_type);
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
    } else {
      // No username found — show the prompt
      setShowPrompt(true);
    }
  }, []);

  const submitUsername = async (name: string) => {
    const cleaned = name.trim().slice(0, 20); // max 20 characters
    if (!cleaned) return;

    // Save locally first — app works even if Supabase is unreachable
    localStorage.setItem('neurolearn_username', cleaned);
    setUsername(cleaned);
    setShowPrompt(false);

    // Register in Supabase in the background
    await registerUser(cleaned);
  };

  return { username, showPrompt, submitUsername };
}