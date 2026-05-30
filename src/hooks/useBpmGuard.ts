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
  flagReasons: string[];        // e.g. ['flat_line', 'out_of_range']
  avgBpm: number;
  bpmVariance: number;
  minBpm: number;
  maxBpm: number;
  sampleCount: number;
}

interface BpmGuardOptions {
  // How many readings to keep in the rolling window (default: 30)
  windowSize?: number;
  // Minimum seconds before we start judging — give rPPG time to warm up (default: 20)
  warmupSeconds?: number;
  // Variance below this = suspiciously flat (default: 1.5)
  flatLineThreshold?: number;
  // BPM below this is impossible for a living adult (default: 35)
  minHumanBpm?: number;
  // BPM above this is impossible (default: 200)
  maxHumanBpm?: number;
  // Only flag flat line if confidence is already decent (default: 60)
  minConfidenceToJudge?: number;
}

// ── The hook ──────────────────────────────────────────────────────────────────

export function useBpmGuard(
  // The live BPM value coming from the rPPG system (null = not ready yet)
  liveBpm: number | null | undefined,
  // Current confidence % (0–100)
  confidencePct: number,
  // How many seconds the session has been running
  sessionSeconds: number,
  // Options to tune the detection
  options: BpmGuardOptions = {}
): BpmGuardResult {

  const {
    windowSize          = 30,
    warmupSeconds       = 20,
    flatLineThreshold   = 1.5,
    minHumanBpm         = 35,
    maxHumanBpm         = 200,
    minConfidenceToJudge = 60,
  } = options;

  // ── Rolling window of recent BPM readings ──────────────────────────────────
  // useRef means this list persists between renders without causing re-renders
  const windowRef = useRef<number[]>([]);

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
    // ── Ignore null/NaN readings ─────────────────────────────────────────────
    if (liveBpm == null || Number.isNaN(liveBpm)) return;

    // ── Add to rolling window ────────────────────────────────────────────────
    const win = windowRef.current;
    win.push(liveBpm);
    if (win.length > windowSize) win.shift(); // drop oldest reading

    // ── Not enough data yet — wait for warmup ────────────────────────────────
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

    // ── Compute stats from the window ────────────────────────────────────────
    const avg    = win.reduce((a, b) => a + b, 0) / win.length;
    const minBpm = Math.min(...win);
    const maxBpm = Math.max(...win);

    // Variance = average of squared distances from the mean
    // A real heart at rest varies by at least 2–4 BPM naturally
    const variance = win.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / win.length;

    // ── Check each flag condition ────────────────────────────────────────────
    const reasons: string[] = [];

    // 1. Flat line — only flag if confidence is decent (rules out bad lighting)
    if (variance < flatLineThreshold && confidencePct >= minConfidenceToJudge) {
      reasons.push('flat_line');
    }

    // 2. Out of human range
    if (avg < minHumanBpm) reasons.push('out_of_range_low');
    if (avg > maxHumanBpm) reasons.push('out_of_range_high');

    // 3. Zero variance with high confidence — almost certainly a static image
    if (variance === 0 && confidencePct >= minConfidenceToJudge) {
      reasons.push('zero_variance');
    }

    // ── Decide suspicion level ───────────────────────────────────────────────
    // 'high'  = two or more flags, or zero variance (very strong signal of cheating)
    // 'low'   = one flag (could be unusual but worth watching)
    // 'none'  = all clear
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
      bpmVariance: Math.round(variance * 100) / 100, // 2 decimal places
      minBpm,
      maxBpm,
      sampleCount: win.length,
    });

  }, [liveBpm, sessionSeconds]); 
  // ^ Re-runs every time a new BPM reading arrives or the timer ticks

  return result;
}