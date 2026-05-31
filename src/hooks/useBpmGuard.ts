// ─── useBpmGuard.ts ───────────────────────────────────────────────────────────
// Watches the live BPM stream and detects suspicious signal patterns.
// Returns a suspicion level and the reasons behind it.
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
  windowSize?: number;
  warmupSeconds?: number;
  flatLineThreshold?: number;
  minHumanBpm?: number;
  maxHumanBpm?: number;
  minConfidenceToJudge?: number;
  nullDropoutSeconds?: number;
}

export function useBpmGuard(
  liveBpm: number | null | undefined,
  confidencePct: number,
  sessionSeconds: number,
  options: BpmGuardOptions = {}
): BpmGuardResult {

  const {
    windowSize           = 30,
    warmupSeconds        = 0,
    flatLineThreshold    = 1.5,
    minHumanBpm          = 35,
    maxHumanBpm          = 200,
    minConfidenceToJudge = 60,
    nullDropoutSeconds   = 8,
  } = options;

  const windowRef         = useRef<number[]>([]);
  const nullCountRef      = useRef(0);   // total null ticks accumulated
  const validCountRef     = useRef(0);   // consecutive valid BPM ticks
  const hadGoodSignalRef  = useRef(false);

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

    // Track whether we ever had a good signal
    if (confidencePct >= minConfidenceToJudge) {
      hadGoodSignalRef.current = true;
    }

    if (liveBpm == null || Number.isNaN(liveBpm)) {
      // Only count dropout if signal was previously good
      if (hadGoodSignalRef.current) {
        nullCountRef.current += 1;
        validCountRef.current = 0; // reset valid streak
      }
    } else {
      // Valid BPM came in — only clear dropout after 5 consecutive valid readings
      // This prevents a single rogue reading from resetting the dropout counter
      validCountRef.current += 1;
      if (validCountRef.current >= 5) {
        nullCountRef.current = 0;
      }
    }

    // ── Dropout detection ─────────────────────────────────────────────────
    if (hadGoodSignalRef.current && nullCountRef.current > 0) {
      let dropoutLevel: SuspicionLevel = 'none';
      if (nullCountRef.current >= nullDropoutSeconds * 2) {
        dropoutLevel = 'high';
      } else if (nullCountRef.current >= nullDropoutSeconds) {
        dropoutLevel = 'low';
      }

      if (dropoutLevel !== 'none') {
        setResult(prev => ({
          ...prev,
          suspicionLevel: dropoutLevel,
          flagReasons: ['signal_dropout'],
        }));
        return;
      }
    }

    // ── Flat line detection (when BPM is present) ─────────────────────────
    if (liveBpm == null || Number.isNaN(liveBpm)) return;

    const win = windowRef.current;
    win.push(liveBpm);
    if (win.length > windowSize) win.shift();

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

    const avg      = win.reduce((a, b) => a + b, 0) / win.length;
    const minBpm   = Math.min(...win);
    const maxBpm   = Math.max(...win);
    const variance = win.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / win.length;

    const reasons: string[] = [];
    if (variance < flatLineThreshold && confidencePct >= minConfidenceToJudge) reasons.push('flat_line');
    if (avg < minHumanBpm) reasons.push('out_of_range_low');
    if (avg > maxHumanBpm) reasons.push('out_of_range_high');
    if (variance === 0 && confidencePct >= minConfidenceToJudge) reasons.push('zero_variance');

    let suspicionLevel: SuspicionLevel = 'none';
    if (reasons.includes('zero_variance') || reasons.length >= 2) suspicionLevel = 'high';
    else if (reasons.length === 1) suspicionLevel = 'low';

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