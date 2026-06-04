// ─── useTranslation.ts ────────────────────────────────────────────────────────
// Hook that translates a block of text to the user's chosen language.
// Caches results so each lesson is only translated once per session.
// Shows a loading state while translation is in progress.
 
import { useState, useEffect, useRef } from 'react';
import { translateText } from './LanguageSelect';
 
interface TranslationState {
  text: string;
  loading: boolean;
  error: boolean;
}
 
// Session-level cache: survives re-renders but resets on page refresh.
// Key = `${langCode}::${text.substring(0,80)}`
const sessionCache = new Map<string, string>();
 
export function useTranslation(originalText: string, langCode: string): TranslationState {
  const [state, setState] = useState<TranslationState>({
    text: originalText,
    loading: langCode !== 'en',
    error: false,
  });
 
  // Track the last text+lang combo so we don't re-run when other state changes
  const lastKeyRef = useRef('');
 
  useEffect(() => {
    const key = `${langCode}::${originalText.substring(0, 80)}`;
 
    // English — return immediately, no API call
    if (langCode === 'en') {
      setState({ text: originalText, loading: false, error: false });
      lastKeyRef.current = key;
      return;
    }
 
    // Same key as last render — no work needed
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
 
    // Already in cache
    if (sessionCache.has(key)) {
      setState({ text: sessionCache.get(key)!, loading: false, error: false });
      return;
    }
 
    // Show loading state with original text underneath
    setState({ text: originalText, loading: true, error: false });
 
    let cancelled = false;
 
    translateText(originalText, langCode)
      .then(translated => {
        if (cancelled) return;
        sessionCache.set(key, translated);
        setState({ text: translated, loading: false, error: false });
      })
      .catch(() => {
        if (cancelled) return;
        // On error, show original English — never break the lesson
        setState({ text: originalText, loading: false, error: true });
      });
 
    return () => { cancelled = true; };
  }, [originalText, langCode]);
 
  return state;
}
 
// ── Batch translation hook ────────────────────────────────────────────────────
// For translating arrays of strings (flashcard fronts/backs, quiz options).
 
interface BatchTranslationState {
  texts: string[];
  loading: boolean;
}
 
export function useBatchTranslation(
  originals: string[],
  langCode: string
): BatchTranslationState {
  const [state, setState] = useState<BatchTranslationState>({
    texts: originals,
    loading: langCode !== 'en',
  });
 
  const lastKeyRef = useRef('');
 
  useEffect(() => {
    const key = `batch::${langCode}::${originals.join('|').substring(0, 120)}`;
 
    if (langCode === 'en') {
      setState({ texts: originals, loading: false });
      lastKeyRef.current = key;
      return;
    }
 
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
 
    // Check if all are cached
    const allCached = originals.every(t => {
      const k = `${langCode}::${t.substring(0, 80)}`;
      return sessionCache.has(k);
    });
 
    if (allCached) {
      const translated = originals.map(t => {
        const k = `${langCode}::${t.substring(0, 80)}`;
        return sessionCache.get(k)!;
      });
      setState({ texts: translated, loading: false });
      return;
    }
 
    setState({ texts: originals, loading: true });
 
    let cancelled = false;
 
    Promise.all(
      originals.map(async t => {
        const k = `${langCode}::${t.substring(0, 80)}`;
        if (sessionCache.has(k)) return sessionCache.get(k)!;
        const translated = await translateText(t, langCode);
        sessionCache.set(k, translated);
        return translated;
      })
    )
      .then(results => {
        if (cancelled) return;
        setState({ texts: results, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ texts: originals, loading: false });
      });
 
    return () => { cancelled = true; };
  }, [originals.join('|'), langCode]);
 
  return state;
}
 