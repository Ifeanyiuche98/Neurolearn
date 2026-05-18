// ─── useStreak.ts ─────────────────────────────────────────────────────────────
// Manages the daily streak system for NeuroLearn v3.
// All data is saved in localStorage so it persists between sessions.
// ─────────────────────────────────────────────────────────────────────────────
 
import { useState, useEffect, useCallback } from 'react';
 
// ── Shape of the streak data we save ────────────────────────────────────────
 
export interface StreakData {
  currentStreak: number;   // How many consecutive days the user has visited
  longestStreak: number;   // Their all-time best streak (for future leaderboard)
  lastVisitDate: string;   // Date of last visit in 'YYYY-MM-DD' format
  totalXP: number;         // Lifetime XP earned across all sessions
  freezeTokens: number;    // Tokens that can protect a streak when a day is missed
}
 
// ── What the hook returns to any component that uses it ─────────────────────
 
export interface StreakReturn {
  streak: number;
  longestStreak: number;
  totalXP: number;
  freezeTokens: number;
  xpMultiplier: number;      // e.g. 1.3 for a 3-day streak (10% per day, max 2.5x)
  bonusMessage: string | null; // Toast message shown on special events
  dismissBonus: () => void;
  addXP: (baseAmount: number) => number; // Adds XP with multiplier, returns actual XP added
  getStreakLabel: () => string;          // e.g. '🔥 7 day streak'
}
 
// ── Constants ────────────────────────────────────────────────────────────────
 
const STORAGE_KEY = 'neurolearn_v3_streak';
 
const DEFAULTS: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastVisitDate: '',
  totalXP: 0,
  freezeTokens: 1, // Everyone starts with 1 freeze token
};
 
// ── Helper: today and N days ago as 'YYYY-MM-DD' strings ─────────────────────
 
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}
 
function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
 
// ── Helper: load and save to localStorage ────────────────────────────────────
 
function loadData(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
 
function saveData(data: StreakData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing, etc.) — silent fail
  }
}
 
// ── The hook ─────────────────────────────────────────────────────────────────
 
export function useStreak(): StreakReturn {
  const [data, setData] = useState<StreakData>(loadData);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
 
  // ── On first load: check if streak needs updating ──────────────────────────
  useEffect(() => {
    const stored = loadData();
    const today = todayStr();
    const yesterday = daysAgoStr(1);
    const twoDaysAgo = daysAgoStr(2);
 
    // Already visited today — nothing to do
    if (stored.lastVisitDate === today) {
      setData(stored);
      return;
    }
 
    let newStreak = stored.currentStreak;
    let newFreeze = stored.freezeTokens;
    let bonusXP = 0;
    let bonus: string | null = null;
 
    // ── Determine what happened since last visit ──────────────────────────────
 
    if (stored.lastVisitDate === '') {
      // Very first visit ever
      newStreak = 1;
      bonus = '🎉 Your journey starts today! Streak started.';
 
    } else if (stored.lastVisitDate === yesterday) {
      // Perfect consecutive day — increment streak
      newStreak = stored.currentStreak + 1;
 
      // Milestone bonuses
      if (newStreak === 3)  { bonusXP = 100;   bonus = '🔥 3-Day Streak! +100 Bonus XP'; }
      if (newStreak === 7)  { bonusXP = 300;   bonus = '🔥 7-Day Streak! +300 Bonus XP'; }
      if (newStreak === 14) { bonusXP = 500;   bonus = '🔥 14-Day Streak! +500 Bonus XP'; }
      if (newStreak === 30) { bonusXP = 1000;  bonus = '🏆 30-Day Streak! +1,000 Bonus XP!'; }
      if (newStreak === 100){ bonusXP = 5000;  bonus = '👑 100-Day Streak! LEGENDARY! +5,000 XP!'; }
 
    } else if (stored.lastVisitDate === twoDaysAgo && newFreeze > 0) {
      // Missed exactly ONE day but has a freeze token — save the streak!
      newFreeze -= 1;
      bonus = `❄️ Streak Freeze used! Your ${stored.currentStreak}-day streak is protected.`;
      // streak stays the same
 
    } else {
      // Streak is broken — start fresh with comeback bonus
      newStreak = 1;
      bonusXP = 50;
      bonus = '💪 Welcome back! +50 Comeback XP. New streak started!';
    }
 
    // Every 10-day streak milestone earns a bonus freeze token (max 3)
    if (newStreak > 0 && newStreak % 10 === 0 && newFreeze < 3) {
      newFreeze = Math.min(3, newFreeze + 1);
      bonus = (bonus ? bonus + ' ' : '') + '❄️ Freeze Token earned!';
    }
 
    // Build the updated object
    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, stored.longestStreak),
      lastVisitDate: today,
      totalXP: stored.totalXP + bonusXP,
      freezeTokens: newFreeze,
    };
 
    saveData(updated);
    setData(updated);
    if (bonus) setBonusMessage(bonus);
  }, []); // runs once on mount
 
  // ── XP multiplier: 10% bonus per streak day, capped at 2.5x ─────────────────
  const xpMultiplier = Math.min(2.5, 1 + data.currentStreak * 0.1);
 
  // ── addXP: applies the streak multiplier and saves ───────────────────────────
  const addXP = useCallback((baseAmount: number): number => {
    const multiplier = Math.min(2.5, 1 + data.currentStreak * 0.1);
    const actual = Math.round(baseAmount * multiplier);
    setData(prev => {
      const updated = { ...prev, totalXP: prev.totalXP + actual };
      saveData(updated);
      return updated;
    });
    return actual;
  }, [data.currentStreak]);
 
  // ── Dismiss the bonus toast message ─────────────────────────────────────────
  const dismissBonus = useCallback(() => setBonusMessage(null), []);
 
  // ── Human-readable streak label ──────────────────────────────────────────────
  const getStreakLabel = useCallback((): string => {
    const s = data.currentStreak;
    if (s === 0) return 'No streak yet';
    if (s === 1) return '1 day streak';
    if (s < 7)   return `🔥 ${s} day streak`;
    if (s < 30)  return `🔥🔥 ${s} day streak`;
    return `🔥🔥🔥 ${s} day streak`;
  }, [data.currentStreak]);
 
  return {
    streak: data.currentStreak,
    longestStreak: data.longestStreak,
    totalXP: data.totalXP,
    freezeTokens: data.freezeTokens,
    xpMultiplier,
    bonusMessage,
    dismissBonus,
    addXP,
    getStreakLabel,
  };
}
 