// ─── logSuspiciousSession.ts ──────────────────────────────────────────────────
// Sends flagged biosignal session data to Supabase for research dataset.
// Called when a session ends and suspicion level is low or high.
//
// Duplicate prevention: uses a module+username+timestamp window to avoid
// logging the same session twice when both the mid-session useEffect AND
// the stopSession function fire close together.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../supabase';
import type { BpmGuardResult } from '../hooks/useBpmGuard';

// ── The data we send per flagged session ──────────────────────────────────────
export interface SuspiciousSessionPayload {
  username: string;
  country: string;
  deviceType: string;
  sessionSeconds: number;
  moduleTitle: string;
  quizScore: number;
  guard: BpmGuardResult;
  avgConfidence: number;
  avgQuality: number;
}

// ── Duplicate prevention ──────────────────────────────────────────────────────
// Tracks the last logged session key (username + moduleTitle + approx minute).
// If the same key is seen within 60 seconds, the second log is suppressed.
let lastLoggedKey = '';
let lastLoggedAt  = 0;
const DEDUPE_WINDOW_MS = 60_000; // 60 seconds

// ── The function ──────────────────────────────────────────────────────────────
export async function logSuspiciousSession(
  payload: SuspiciousSessionPayload
): Promise<void> {

  // Only log if there is actually something suspicious
  if (payload.guard.suspicionLevel === 'none') return;

  // ── Duplicate prevention check ────────────────────────────────────────────
  const sessionKey = `${payload.username}|${payload.moduleTitle}|${payload.guard.suspicionLevel}`;
  const now        = Date.now();

  if (sessionKey === lastLoggedKey && now - lastLoggedAt < DEDUPE_WINDOW_MS) {
    console.log('[BpmGuard] Duplicate session suppressed within dedupe window:', sessionKey);
    return;
  }

  // Mark this session as logged
  lastLoggedKey = sessionKey;
  lastLoggedAt  = now;

  // ── Bug 1 fix: convert empty/placeholder country to null ──────────────────
  const countryValue =
    payload.country &&
    payload.country.trim() !== '' &&
    payload.country !== 'EMPTY' &&
    payload.country !== 'Unknown'
      ? payload.country.trim()
      : null;

  // ── Read user_id from localStorage ───────────────────────────────────────
  const userId = localStorage.getItem('neurolearn_user_id') || null;

  try {
    const { error } = await supabase
      .from('suspicious_sessions')
      .insert({
        // Who
        username:    payload.username,
        user_id:     userId,           // now properly linked
        country:     countryValue,     // null instead of '' or 'EMPTY'
        device_type: payload.deviceType,

        // Session context
        session_seconds: payload.sessionSeconds,
        module_title:    payload.moduleTitle,
        quiz_score:      payload.quizScore,

        // Signal stats
        avg_bpm:        payload.guard.avgBpm,
        bpm_variance:   payload.guard.bpmVariance,
        min_bpm:        payload.guard.minBpm,
        max_bpm:        payload.guard.maxBpm,
        avg_confidence: payload.avgConfidence,
        avg_quality:    payload.avgQuality,

        // Verdict
        suspicion_level: payload.guard.suspicionLevel,
        flag_reasons:    payload.guard.flagReasons,
      });

    if (error) {
      console.warn('[BpmGuard] Failed to log suspicious session:', error.message);
    } else {
      console.log('[BpmGuard] Flagged session logged to Supabase:', payload.guard.flagReasons);
    }

  } catch (err) {
    console.warn('[BpmGuard] Unexpected error logging session:', err);
  }
}
