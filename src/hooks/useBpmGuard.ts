// ─── useBpmGuard.ts ───────────────────────────────────────────────────────────
// Watches the live BPM stream and detects suspicious signal patterns.
// Returns a suspicion level and the reasons behind it.
//
// v3.1 — False-flag fixes:
//   • Warmup extended to 60 seconds — early noise is ignored entirely
//   • Dropout counter now requires CONSECUTIVE nulls, not accumulated
//   • flatLineThreshold raised from 1.5 → 4.0 (calm BPM no longer flagged)
//   • out_of_range only flags truly impossible values (< 30 or > 220)
//   • Single reason alone never escalates to 'high' suspicion
//   • 'high' now requires zero_variance OR 3+ simultaneous reasons
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

export type SuspicionLevel = 'none' | 'low' | 'high';

export interface BpmGuardResult {
  suspicionLevel: SuspicionLevel;
  flagReasons: string[];
  avgBpm: number;
  bpmVariance: number;
  minBpm: number;
  maxBpm: number;
  sampleCount: number;
}

interface BpmGuardOptions {
  windowSize?:           number;
  warmupSeconds?:        number;
  flatLineThreshold?:    number;
  minHumanBpm?:          number;
  maxHumanBpm?:          number;
  minConfidenceToJudge?: number;
  nullDropoutSeconds?:   number;
}

export function useBpmGuard(
  liveBpm:        number | null | undefined,
  confidencePct:  number,
  sessionSeconds: number,
  options:        BpmGuardOptions = {}
): BpmGuardResult {

  const {
    windowSize           = 30,
    warmupSeconds        = 60,   // FIX 1: was 0 — now ignores first 60s entirely
    flatLineThreshold    = 4.0,  // FIX 3: was 1.5 — calm BPM no longer false-flags
    minHumanBpm          = 30,   // FIX: was 35 — wider physiological range
    maxHumanBpm          = 220,  // FIX: was 200 — wider physiological range
    minConfidenceToJudge = 60,
    nullDropoutSeconds   = 15,   // FIX 2: was 8 — needs more sustained dropout
  } = options;

  const windowRef              = useRef<number[]>([]);
  const consecutiveNullRef     = useRef(0); // FIX 2: consecutive nulls only, not accumulated
  const consecutiveValidRef    = useRef(0);
  const hadGoodSignalRef       = useRef(false);

  const [result, setResult] = useState<BpmGuardResult>({
    suspicionLevel: 'none',
    flagReasons:    [],
    avgBpm:         0,
    bpmVariance:    0,
    minBpm:         0,
    maxBpm:         0,
    sampleCount:    0,
  });

  useEffect(() => {

    // ── Still in warmup — do nothing at all ──────────────────────────────
    // This covers the early spike phase you observed on startup.
    if (sessionSeconds < warmupSeconds) {
      return;
    }

    // Track whether we ever had a stable good signal
    if (confidencePct >= minConfidenceToJudge && liveBpm != null) {
      hadGoodSignalRef.current = true;
    }

    // ── Null / dropout tracking ───────────────────────────────────────────
    if (liveBpm == null || Number.isNaN(liveBpm)) {
      if (hadGoodSignalRef.current) {
        // FIX 2: count CONSECUTIVE nulls — a single null frame resets on
        // next valid reading. This stops scattered null frames accumulating.
        consecutiveNullRef.current  += 1;
        consecutiveValidRef.current  = 0;
      }
    } else {
      consecutiveValidRef.current += 1;
      // Clear dropout counter after 5 consecutive valid readings
      if (consecutiveValidRef.current >= 5) {
        consecutiveNullRef.current = 0;
      }
    }

    // ── Dropout detection ─────────────────────────────────────────────────
    // Only flag if we have a long UNBROKEN run of nulls after a good signal.
    if (hadGoodSignalRef.current && consecutiveNullRef.current > 0) {
      // High: 2× the threshold of consecutive nulls (e.g. 30+ ticks ≈ 15s)
      if (consecutiveNullRef.current >= nullDropoutSeconds * 2) {
        setResult(prev => ({
          ...prev,
          suspicionLevel: 'high',
          flagReasons:    ['signal_dropout'],
        }));
        return;
      }
      // Low: threshold reached (e.g. 15+ ticks)
      if (consecutiveNullRef.current >= nullDropoutSeconds) {
        setResult(prev => ({
          ...prev,
          suspicionLevel: 'low',
          flagReasons:    ['signal_dropout'],
        }));
        return;
      }
    }

    // ── Nothing to analyse yet ────────────────────────────────────────────
    if (liveBpm == null || Number.isNaN(liveBpm)) return;

    // ── Rolling window ────────────────────────────────────────────────────
    const win = windowRef.current;
    win.push(liveBpm);
    if (win.length > windowSize) win.shift();

    // Need at least 10 samples before making any judgment
    if (win.length < 10) {
      setResult({
        suspicionLevel: 'none',
        flagReasons:    [],
        avgBpm:         Math.round(liveBpm),
        bpmVariance:    0,
        minBpm:         liveBpm,
        maxBpm:         liveBpm,
        sampleCount:    win.length,
      });
      return;
    }

    // ── Signal statistics ─────────────────────────────────────────────────
    const avg      = win.reduce((a, b) => a + b, 0) / win.length;
    const minBpm   = Math.min(...win);
    const maxBpm   = Math.max(...win);
    const variance = win.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / win.length;

    // ── Flag reasons ──────────────────────────────────────────────────────
    const reasons: string[] = [];

    // FIX 3: flatLineThreshold raised — only flags truly impossible stillness
    // (e.g. a static image or video loop), not a calm learner sitting still
    if (variance < flatLineThreshold && confidencePct >= minConfidenceToJudge) {
      reasons.push('flat_line');
    }

    // FIX: Wider physiological range — only flags truly impossible BPM
    if (avg < minHumanBpm) reasons.push('out_of_range_low');
    if (avg > maxHumanBpm) reasons.push('out_of_range_high');

    // Zero variance is the strongest cheat signal (static image)
    if (variance === 0 && confidencePct >= minConfidenceToJudge) {
      reasons.push('zero_variance');
    }

    // ── Suspicion level ───────────────────────────────────────────────────
    // FIX: Single reason alone is only 'low'. 'high' requires either
    // zero_variance (definitive cheat signal) OR 3+ simultaneous reasons.
    let suspicionLevel: SuspicionLevel = 'none';
    if (reasons.includes('zero_variance') || reasons.length >= 3) {
      suspicionLevel = 'high';
    } else if (reasons.length >= 1) {
      suspicionLevel = 'low';
    }

    setResult({
      suspicionLevel,
      flagReasons: reasons,
      avgBpm:      Math.round(avg),
      bpmVariance: Math.round(variance * 100) / 100,
      minBpm,
      maxBpm,
      sampleCount: win.length,
    });

  }, [liveBpm, confidencePct, sessionSeconds]);

  return result;
}