// ─── useQuizTimer.ts ──────────────────────────────────────────────────────────
// Manages the timed quiz engine for NeuroLearn v3.
// Handles: countdown per question, speed XP bonus, combo streak tracking.
// ─────────────────────────────────────────────────────────────────────────────
 
import { useState, useEffect, useRef, useCallback } from 'react';
 
// ── Configuration ─────────────────────────────────────────────────────────────
 
export const TIMER_SECONDS = 20;   // Seconds allowed per question
const BASE_XP_CORRECT   = 100;    // XP for a correct answer (before bonuses)
const BASE_XP_WRONG     = 0;      // XP for a wrong answer
const SPEED_BONUS_MAX   = 50;     // Extra XP for answering instantly
const COMBO_BONUS_PER   = 25;     // Extra XP per combo level (e.g. 3-combo = +75 XP)
const MAX_COMBO_BONUS   = 200;    // Cap on combo bonus XP
 
// ── Types ─────────────────────────────────────────────────────────────────────
 
export interface QuizTimerReturn {
  timeLeft: number;            // Seconds remaining (counts down from TIMER_SECONDS)
  timeExpired: boolean;        // True when timer hits 0 without an answer
  comboCount: number;          // Consecutive correct answers in this quiz
  totalQuizXP: number;         // XP earned so far in this quiz session
  timerPercent: number;        // 0–100, used to drive the timer bar width
  timerColor: string;          // Green → Orange → Red as time runs out
  startTimer: () => void;      // Call this when a new question appears
  stopTimer: () => void;       // Call this when the user picks an answer
  resetQuiz: () => void;       // Call this when starting a brand-new quiz
  calcXP: (correct: boolean) => number; // Returns XP earned for this answer
}
 
// ── The hook ──────────────────────────────────────────────────────────────────
 
export function useQuizTimer(): QuizTimerReturn {
  const [timeLeft, setTimeLeft]       = useState(TIMER_SECONDS);
  const [timeExpired, setTimeExpired] = useState(false);
  const [comboCount, setComboCount]   = useState(0);
  const [totalQuizXP, setTotalQuizXP] = useState(0);
 
  // We use a ref for the interval so we can clear it from anywhere
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
 
  // We also track when the question started so we can calculate speed bonus
  const questionStartRef = useRef<number>(Date.now());
 
  // ── Clear the running interval safely ────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
 
  // ── Start: called whenever a new question is shown ───────────────────────────
  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(TIMER_SECONDS);
    setTimeExpired(false);
    questionStartRef.current = Date.now();
 
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimeExpired(true);
          // A time-out counts as a wrong answer — reset combo
          setComboCount(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);
 
  // ── Stop: called as soon as the user taps an answer ──────────────────────────
  const stopTimer = useCallback(() => {
    clearTimer();
  }, [clearTimer]);
 
  // ── Reset: called when starting a completely new quiz ────────────────────────
  const resetQuiz = useCallback(() => {
    clearTimer();
    setTimeLeft(TIMER_SECONDS);
    setTimeExpired(false);
    setComboCount(0);
    setTotalQuizXP(0);
  }, [clearTimer]);
 
  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);
 
  // ── XP Calculator ─────────────────────────────────────────────────────────────
  // Call this AFTER stopTimer, passing whether the answer was correct.
  // Returns the XP earned so the parent can pass it to addXP() from useStreak.
  const calcXP = useCallback((correct: boolean): number => {
    if (!correct) {
      // Wrong answer — reset combo, no XP
      setComboCount(0);
      return BASE_XP_WRONG;
    }
 
    // ── Speed bonus: how much time is left as a percentage? ──────────────────
    // Full bonus if answered in first 5 seconds, zero bonus if took all 20s
    const speedRatio = timeLeft / TIMER_SECONDS; // 1.0 = instant, 0.0 = last second
    const speedBonus = Math.round(SPEED_BONUS_MAX * speedRatio);
 
    // ── Combo bonus ──────────────────────────────────────────────────────────
    const newCombo = comboCount + 1;
    const comboBonus = Math.min(MAX_COMBO_BONUS, newCombo * COMBO_BONUS_PER);
 
    // ── Total XP for this question ───────────────────────────────────────────
    const earned = BASE_XP_CORRECT + speedBonus + comboBonus;
 
    // Update state
    setComboCount(newCombo);
    setTotalQuizXP(prev => prev + earned);
 
    return earned;
  }, [timeLeft, comboCount]);
 
  // ── Derived UI values ─────────────────────────────────────────────────────────
 
  // Timer bar: fills from 100% down to 0%
  const timerPercent = Math.round((timeLeft / TIMER_SECONDS) * 100);
 
  // Color: green (safe) → orange (hurry) → red (urgent)
  let timerColor = '#4CAF50';
  if (timerPercent <= 50) timerColor = '#FF9800';
  if (timerPercent <= 25) timerColor = '#F44336';
 
  return {
    timeLeft,
    timeExpired,
    comboCount,
    totalQuizXP,
    timerPercent,
    timerColor,
    startTimer,
    stopTimer,
    resetQuiz,
    calcXP,
  };
}
 