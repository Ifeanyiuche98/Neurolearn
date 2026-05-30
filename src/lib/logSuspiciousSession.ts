// ─── logSuspiciousSession.ts ──────────────────────────────────────────────────
// Sends flagged biosignal session data to Supabase for Elata's research dataset.
// Called once when a session ends and suspicion level is low or high.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../supabase';
import type { BpmGuardResult } from '../hooks/useBpmGuard';

// ── The data we send per flagged session ──────────────────────────────────────
export interface SuspiciousSessionPayload {
  // Who (no sensitive data — just what's already in localStorage)
  username: string;
  country: string;
  deviceType: string;

  // Session context
  sessionSeconds: number;
  moduleTitle: string;
  quizScore: number;

  // Signal data from useBpmGuard
  guard: BpmGuardResult;

  // Raw signal quality metrics
  avgConfidence: number;
  avgQuality: number;
}

// ── The function ──────────────────────────────────────────────────────────────
export async function logSuspiciousSession(
  payload: SuspiciousSessionPayload
): Promise<void> {

  // Only log if there is actually something suspicious
  if (payload.guard.suspicionLevel === 'none') return;

  try {
    const { error } = await supabase
      .from('suspicious_sessions')
      .insert({
        // Who
        username:    payload.username,
        country:     payload.country,
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
      // Silent fail — never crash the app over a logging error
      console.warn('[BpmGuard] Failed to log suspicious session:', error.message);
    } else {
      console.log('[BpmGuard] Flagged session logged to Supabase:', payload.guard.flagReasons);
    }

  } catch (err) {
    // Network error etc — again, silent fail
    console.warn('[BpmGuard] Unexpected error logging session:', err);
  }
}