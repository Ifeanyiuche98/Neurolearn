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
    const data = await res.json();
    return data.country_name || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// ── Register user in Supabase ─────────────────────────────────────────────────
async function registerUser(username: string): Promise<void> {
  const country = await getCountry();
  const device_type = getDeviceType();

  // Check if username already exists first
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  // Only insert if username is new
  if (!existing) {
    await supabase.from('users').insert({
      username,
      country,
      device_type,
    });
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

    localStorage.setItem('neurolearn_username', cleaned);
    setUsername(cleaned);
    setShowPrompt(false);

    // Register in Supabase in the background
    await registerUser(cleaned);
  };

  return { username, showPrompt, submitUsername };
}