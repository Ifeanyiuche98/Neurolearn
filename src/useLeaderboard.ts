// ─── useLeaderboard.ts ────────────────────────────────────────────────────────
// Personal session leaderboard for NeuroLearn v3 Phase 2.
// Stores all quiz sessions in localStorage as separate leaderboard entries.
// Shows all-time and weekly rankings from your own sessions.
// NOTE: This is a personal best tracker until Supabase is added (Phase 2+),
// at which point entries from all users will replace localStorage data.
// ─────────────────────────────────────────────────────────────────────────────
 
import { useState, useCallback } from 'react';
 
// ── Types ─────────────────────────────────────────────────────────────────────
 
export interface LeaderboardEntry {
  id: string;           // Unique ID for this session
  moduleTitle: string;  // Which module was completed
  moduleIcon: string;   // Emoji icon for the module
  quizScore: number;    // Quiz percentage (0–100)
  focusScore: number;   // Focus score from BPM
  xpEarned: number;     // XP earned this session
  streak: number;       // Streak at time of session
  date: string;         // ISO date string
  weekKey: string;      // 'YYYY-WW' format for weekly grouping
}
 
export interface LeaderboardReturn {
  allTimeEntries: LeaderboardEntry[];   // Top 10 all-time by XP
  weeklyEntries: LeaderboardEntry[];    // Top 10 this week by XP
  personalBest: LeaderboardEntry | null;// Single best XP session ever
  totalSessions: number;
  currentWeekKey: string;
  daysUntilReset: number;               // Days until Monday weekly reset
  addEntry: (entry: Omit<LeaderboardEntry, 'id' | 'date' | 'weekKey'>) => void;
  getRank: (entry: LeaderboardEntry, type: 'allTime' | 'weekly') => number;
}
 
// ── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'neurolearn_v3_leaderboard';
 
// ── Week key helper: returns 'YYYY-WW' for any date ──────────────────────────
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday (ISO week standard)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
 
// ── Days until next Monday ────────────────────────────────────────────────────
function daysUntilMonday(): number {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday
  const daysLeft = today === 1 ? 7 : (8 - today) % 7 || 7;
  return daysLeft;
}
 
// ── Load all entries from localStorage ───────────────────────────────────────
function loadEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
 
function saveEntries(entries: LeaderboardEntry[]): void {
  try {
    // Keep max 100 entries to avoid localStorage bloat
    const trimmed = entries.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail
  }
}
 
// ── Sort and take top N by XP ─────────────────────────────────────────────────
function topByXP(entries: LeaderboardEntry[], n = 10): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.xpEarned - a.xpEarned || b.quizScore - a.quizScore)
    .slice(0, n);
}
 
// ── The hook ──────────────────────────────────────────────────────────────────
export function useLeaderboard(): LeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(loadEntries);
 
  const currentWeekKey = getWeekKey(new Date());
 
  // All-time top 10
  const allTimeEntries = topByXP(entries);
 
  // This week's top 10
  const weeklyEntries = topByXP(
    entries.filter(e => e.weekKey === currentWeekKey)
  );
 
  // Personal best session all-time
  const personalBest = allTimeEntries[0] ?? null;
 
  // Add a new session entry
  const addEntry = useCallback(
    (entry: Omit<LeaderboardEntry, 'id' | 'date' | 'weekKey'>) => {
      const now = new Date();
      const newEntry: LeaderboardEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: now.toISOString(),
        weekKey: getWeekKey(now),
      };
      setEntries(prev => {
        const updated = [newEntry, ...prev];
        saveEntries(updated);
        return updated;
      });
    },
    []
  );
 
  // Get the rank of a specific entry in the top list (1-indexed)
  const getRank = useCallback(
    (entry: LeaderboardEntry, type: 'allTime' | 'weekly'): number => {
      const list = type === 'allTime' ? allTimeEntries : weeklyEntries;
      const idx = list.findIndex(e => e.id === entry.id);
      return idx === -1 ? 999 : idx + 1;
    },
    [allTimeEntries, weeklyEntries]
  );
 
  return {
    allTimeEntries,
    weeklyEntries,
    personalBest,
    totalSessions: entries.length,
    currentWeekKey,
    daysUntilReset: daysUntilMonday(),
    addEntry,
    getRank,
  };
}
 