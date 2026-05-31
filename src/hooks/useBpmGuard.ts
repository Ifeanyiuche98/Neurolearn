// ─── useBpmGuard.ts ───────────────────────────────────────────────────────────
// Watches the live BPM stream and detects suspicious signal patterns.
// Returns a suspicion level and the reasons behind it.
// Does NOT punish poor lighting or low signal quality on its own.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  windowSize?: number;
  warmupSeconds?: number;
  flatLineThreshold?: number;
  minHumanBpm?: number;
  maxHumanBpm?: number;
  minConfidenceToJudge?: number;
  // How many seconds of null BPM (after signal was good) before flagging
  nullDropoutSeconds?: number;
}

// ── The hook ──────────────────────────────────────────────────────────────────

export function useBpmGuard(
  liveBpm: number | null | undefined,
  confidencePct: number,
  sessionSeconds: number,
  options: BpmGuardOptions = {}
): BpmGuardResult {

  const {
    windowSize            = 30,
    warmupSeconds         = 0,
    flatLineThreshold     = 1.5,
    minHumanBpm           = 35,
    maxHumanBpm           = 200,
    minConfidenceToJudge  = 60,
    nullDropoutSeconds    = 15,
  } = options;

  // ── Rolling window of recent BPM readings ─────────────────────────────────
  const windowRef = useRef<number[]>([]);

  // Track how long BPM has been null after a good signal was established
  const nullStreakRef        = useRef(0);   // seconds BPM has been null
  const hadGoodSignalRef     = useRef(false); // true once confidence was decent

  const [result, setResult] = useState<BpmGuardResult>({
    suspicionLevel: 'none',
    flagReasons: [],
    avgBpm: 0,
    bpmVariance: 0,
    minBpm: 0,
    maxBpm: 0,
    sampleCount: 0,
  });

  useEffect(() => {

    // ── Track whether we ever had a good signal ───────────────────────────
    if (confidencePct >= minConfidenceToJudge) {
      hadGoodSignalRef.current = true;
    }

    // ── Handle null BPM — camera covered or signal lost ──────────────────
    if (liveBpm == null || Number.isNaN(liveBpm)) {

      // If we previously had a good signal and now have nothing — count it
      if (hadGoodSignalRef.current) {
        nullStreakRef.current += 1;
      }

      // Flag if null has persisted long enough
      if (nullStreakRef.current >= nullDropoutSeconds) {
        setResult(prev => ({
          ...prev,
          suspicionLevel: nullStreakRef.current >= nullDropoutSeconds * 2 ? 'high' : 'low',
          flagReasons: ['signal_dropout'],
        }));
      }
      return;
    }

    // BPM is back — reset the null streak
    nullStreakRef.current = 0;

    // ── Add to rolling window ─────────────────────────────────────────────
    const win = windowRef.current;
    win.push(liveBpm);
    if (win.length > windowSize) win.shift();

    // ── Not enough data yet ───────────────────────────────────────────────
    if (sessionSeconds < warmupSeconds || win.length < 10) {
      setResult({
        suspicionLevel: 'none',
        flagReasons: [],
        avgBpm: liveBpm,
        bpmVariance: 0,
        minBpm: liveBpm,
        maxBpm: liveBpm,
        sampleCount: win.length,
      });
      return;
    }

    // ── Compute stats ─────────────────────────────────────────────────────
    const avg    = win.reduce((a, b) => a + b, 0) / win.length;
    const minBpm = Math.min(...win);
    const maxBpm = Math.max(...win);
    const variance = win.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / win.length;

    // ── Check each flag condition ─────────────────────────────────────────
    const reasons: string[] = [];

    // 1. Flat line — only if confidence is decent (rules out bad lighting)
    if (variance < flatLineThreshold && confidencePct >= minConfidenceToJudge) {
      reasons.push('flat_line');
    }

    // 2. Out of human range
    if (avg < minHumanBpm) reasons.push('out_of_range_low');
    if (avg > maxHumanBpm) reasons.push('out_of_range_high');

    // 3. Perfect zero variance with good confidence — static image
    if (variance === 0 && confidencePct >= minConfidenceToJudge) {
      reasons.push('zero_variance');
    }

    // ── Decide suspicion level ────────────────────────────────────────────
    let suspicionLevel: SuspicionLevel = 'none';
    if (reasons.includes('zero_variance') || reasons.length >= 2) {
      suspicionLevel = 'high';
    } else if (reasons.length === 1) {
      suspicionLevel = 'low';
    }

    setResult({
      suspicionLevel,
      flagReasons: reasons,
      avgBpm: Math.round(avg),
      bpmVariance: Math.round(variance * 100) / 100,
      minBpm,
      maxBpm,
      sampleCount: win.length,
    });

  }, [liveBpm, confidencePct, sessionSeconds]);

  return result;
}