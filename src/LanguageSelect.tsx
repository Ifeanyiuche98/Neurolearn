// ─── LanguageSelect.tsx ───────────────────────────────────────────────────────
// Full-screen language picker shown ONCE before any other screen.
// Stores selection in localStorage so user never sees it again after first pick.

import { useState } from 'react';

export interface Language {
  code: string;       // Google Translate language code
  name: string;       // Name in that language (so non-English speakers can find it)
  englishName: string;
  flag: string;       // Emoji flag
  rtl?: boolean;      // Right-to-left script
}

export const LANGUAGES: Language[] = [
  { code: 'en',  name: 'English',          englishName: 'English',    flag: '🌍' },
  { code: 'fr',  name: 'Français',         englishName: 'French',     flag: '🇫🇷' },
  { code: 'de',  name: 'Deutsch',          englishName: 'German',     flag: '🇩🇪' },
  { code: 'ha',  name: 'Hausa',            englishName: 'Hausa',      flag: '🇳🇬' },
  { code: 'pt',  name: 'Português',        englishName: 'Portuguese', flag: '🇧🇷' },
  { code: 'sw',  name: 'Kiswahili',        englishName: 'Swahili',    flag: '🌍' },
  { code: 'zh',  name: '中文',              englishName: 'Mandarin',   flag: '🇨🇳' },
  { code: 'hy',  name: 'Հայերեն',          englishName: 'Armenian',   flag: '🇦🇲' },
  { code: 'ig',  name: 'Igbo',             englishName: 'Igbo',       flag: '🇳🇬' },
  { code: 'yo',  name: 'Yorùbá',           englishName: 'Yoruba',     flag: '🇳🇬' },
  { code: 'ar',  name: 'العربية',          englishName: 'Arabic',     flag: '🌍', rtl: true },
  { code: 'es',  name: 'Español',          englishName: 'Spanish',    flag: '🌎' },
  { code: 'hi',  name: 'हिन्दी',           englishName: 'Hindi',      flag: '🇮🇳' },
];

const STORAGE_KEY = 'neurolearn_language';

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = LANGUAGES.find(l => l.code === stored);
      if (found) return found;
    }
  } catch {}
  return LANGUAGES[0]; // Default to English
}

export function storeLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang.code);
  } catch {}
}

export function hasStoredLanguage(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

// ── Translation utility ───────────────────────────────────────────────────────
// Uses Google Translate free endpoint. No API key needed for basic usage.
// Cache translations in sessionStorage to avoid redundant calls.

const translationCache = new Map<string, string>();

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en') return text;
  if (!text.trim()) return text;

  const cacheKey = `${targetLang}::${text.substring(0, 50)}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    // Google returns array of arrays — join all translated segments
    const translated = data[0]
      ?.map((segment: [string]) => segment[0])
      .join('') ?? text;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch {
    return text; // Fallback to original on any error
  }
}

// Translate multiple strings in parallel
export async function translateBatch(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (targetLang === 'en') return texts;
  return Promise.all(texts.map(t => translateText(t, targetLang)));
}

// ── LanguageSelect component ──────────────────────────────────────────────────

interface LanguageSelectProps {
  onSelect: (lang: Language) => void;
}

export default function LanguageSelect({ onSelect }: LanguageSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handlePick = (lang: Language) => {
    setSelected(lang.code);
  };

  const handleConfirm = () => {
    const lang = LANGUAGES.find(l => l.code === selected);
    if (!lang) return;
    setConfirming(true);
    storeLanguage(lang);
    setTimeout(() => onSelect(lang), 400);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-base, #020408)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      overflowY: 'auto',
      padding: '0 0 40px 0',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: '480px',
        padding: '48px 24px 24px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: '56px', height: '56px',
          background: 'radial-gradient(circle at 40% 40%, #00e5cc, #3d9eff)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 32px rgba(0,229,204,0.3)',
          fontSize: '24px',
        }}>🧠</div>

        <h1 style={{
          fontFamily: '"Syne", "Space Grotesk", system-ui, sans-serif',
          fontWeight: 800,
          fontSize: '1.6rem',
          color: '#ffffff',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          NeuroLearn
        </h1>

        {/* Tagline in multiple languages */}
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.82rem',
          marginBottom: '6px',
          lineHeight: 1.6,
        }}>
          Choose your language · Choisissez votre langue
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.76rem',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          اختر لغتك · 选择语言 · Chọn ngôn ngữ · Selecciona tu idioma
        </p>
      </div>

      {/* Language grid */}
      <div style={{
        width: '100%', maxWidth: '480px',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {LANGUAGES.map(lang => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handlePick(lang)}
              style={{
                background: isSelected
                  ? 'rgba(0,229,204,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? '#00e5cc' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                padding: '16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: isSelected ? '0 0 16px rgba(0,229,204,0.15)' : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{lang.flag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: '"Syne", system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: isSelected ? '#00e5cc' : '#ffffff',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  direction: lang.rtl ? 'rtl' : 'ltr',
                }}>
                  {lang.name}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: isSelected ? 'rgba(0,229,204,0.7)' : 'rgba(255,255,255,0.35)',
                  fontFamily: 'system-ui',
                }}>
                  {lang.englishName}
                </div>
              </div>
              {isSelected && (
                <div style={{
                  width: '18px', height: '18px',
                  borderRadius: '50%',
                  background: '#00e5cc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '10px',
                  color: '#020408',
                  fontWeight: 800,
                }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div style={{
        width: '100%', maxWidth: '480px',
        padding: '24px 16px 0',
      }}>
        <button
          onClick={handleConfirm}
          disabled={!selected || confirming}
          style={{
            width: '100%',
            minHeight: '52px',
            background: selected
              ? 'linear-gradient(135deg, #00e5cc, #3d9eff)'
              : 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '14px',
            color: selected ? '#020408' : 'rgba(255,255,255,0.25)',
            fontFamily: '"Syne", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: selected ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            letterSpacing: '-0.01em',
            opacity: confirming ? 0.7 : 1,
          }}
        >
          {confirming ? '...' : selected ? '→ Continue' : 'Select a language'}
        </button>

        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.68rem',
          marginTop: '16px',
          lineHeight: 1.6,
        }}>
          You can change this later in settings · Vous pouvez changer cela plus tard
        </p>
      </div>
    </div>
  );
}
