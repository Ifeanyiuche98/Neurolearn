// ─── logSuspiciousSession.ts ──────────────────────────────────────────────────
// Sends flagged biosignal session data to Supabase for Elata's research dataset.
// Called once when a session ends and suspicion level is low or high.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../supabase';
import type { BpmGuardResult } from '../hooks/useBpmGuard';

// ── The data we send per flagged session ──────────────────────────────────────
export interface SuspiciousSessionPayload {
  username: string;
  country: string;       // can be empty string — we convert to null below
  deviceType: string;
  sessionSeconds: number;
  moduleTitle: string;
  quizScore: number;
  guard: BpmGuardResult;
  avgConfidence: number;
  avgQuality: number;
}

// ── The function ──────────────────────────────────────────────────────────────
export async function logSuspiciousSession(
  payload: SuspiciousSessionPayload
): Promise<void> {

  // Only log if there is actually something suspicious
  if (payload.guard.suspicionLevel === 'none') return;

  // ── Bug 1 fix: convert empty/placeholder country to null ──────────────────
  const countryValue =
    payload.country && payload.country.trim() !== '' && payload.country !== 'EMPTY'
      ? payload.country.trim()
      : null;

  try {
    const { error } = await supabase
      .from('suspicious_sessions')
      .insert({
        // Who
        username:    payload.username,
        country:     countryValue,          // null instead of '' or 'EMPTY'
        device_type: payload.deviceType,

        // Session context
        session_seconds: payload.sessionSeconds,
        module_title:    payload.moduleTitle,
        quiz_score:      payload.quizScore, // Bug 2 fix: now receives real score

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