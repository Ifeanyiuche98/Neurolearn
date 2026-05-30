// ─── useLeaderboard.ts ────────────────────────────────────────────────────────
// Leaderboard for NeuroLearn v3 — now with Supabase global integration.
// Writes every session to both localStorage (local) and Supabase (global).
// Reads global leaderboard from Supabase for the All Time and Weekly tabs.
// Falls back to localStorage gracefully if Supabase is unreachable.
// ─────────────────────────────────────────────────────────────────────────────
 
import { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabase';
 
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
  username?: string;    // Display name (from Supabase global entries)
}
 
export interface LeaderboardReturn {
  allTimeEntries: LeaderboardEntry[];    // Top 10 all-time by XP
  weeklyEntries: LeaderboardEntry[];     // Top 10 this week by XP
  globalAllTime: LeaderboardEntry[];     // Global top 10 all-time
  globalWeekly: LeaderboardEntry[];      // Global top 10 this week
  personalBest: LeaderboardEntry | null; // Single best XP session ever
  totalSessions: number;
  currentWeekKey: string;
  daysUntilReset: number;
  isLoadingGlobal: boolean;
  addEntry: (entry: Omit<LeaderboardEntry, 'id' | 'date' | 'weekKey'>) => void;
  getRank: (entry: LeaderboardEntry, type: 'allTime' | 'weekly') => number;
}
 
// ── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'neurolearn_v3_leaderboard';
 
// ── Week key helper: returns 'YYYY-WW' for any date ──────────────────────────
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
 
// ── Days until next Monday ────────────────────────────────────────────────────
function daysUntilMonday(): number {
  const today = new Date().getDay();
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
 
// ── Post session to Supabase global leaderboard ───────────────────────────────
async function postToSupabase(entry: LeaderboardEntry): Promise<void> {
  const username = localStorage.getItem('neurolearn_username') || 'Anonymous';
  try {
    const { error } = await supabase.from('leaderboard').insert({
      username,
      module_id:    entry.moduleTitle.toLowerCase().replace(/\s+/g, '_'),
      module_title: entry.moduleTitle,
      score:        entry.quizScore,
      xp_earned:    entry.xpEarned,
    });
    if (error) {
      console.error('[NeuroLearn] Leaderboard post error:', error.message);
    } else {
      console.log('[NeuroLearn] Score posted to global leaderboard:', username, entry.xpEarned, 'XP');
    }
  } catch (err) {
    console.error('[NeuroLearn] Leaderboard post failed:', err);
  }
}
 
// ── Fetch global leaderboard from Supabase ────────────────────────────────────
async function fetchGlobalLeaderboard(): Promise<{
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
}> {
  try {
    // All time — top 10 by XP
    const { data: allTimeData, error: allTimeError } = await supabase
      .from('leaderboard')
      .select('*')
      .order('xp_earned', { ascending: false })
      .limit(10);
 
    if (allTimeError) throw allTimeError;
 
    // Weekly — filter by current week
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday
 
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('leaderboard')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .order('xp_earned', { ascending: false })
      .limit(10);
 
    if (weeklyError) throw weeklyError;
 
    // Map Supabase rows to LeaderboardEntry shape
    const mapRow = (row: Record<string, unknown>): LeaderboardEntry => ({
      id:          String(row.id),
      moduleTitle: String(row.module_title),
      moduleIcon:  '🏆',
      quizScore:   Number(row.score),
      focusScore:  0,
      xpEarned:    Number(row.xp_earned),
      streak:      0,
      date:        String(row.created_at),
      weekKey:     getWeekKey(new Date(String(row.created_at))),
      username:    String(row.username),
    });
 
    return {
      allTime: (allTimeData ?? []).map(mapRow),
      weekly:  (weeklyData  ?? []).map(mapRow),
    };
  } catch (err) {
    console.error('[NeuroLearn] Failed to fetch global leaderboard:', err);
    return { allTime: [], weekly: [] };
  }
}
 
// ── The hook ──────────────────────────────────────────────────────────────────
export function useLeaderboard(): LeaderboardReturn {
  const [entries, setEntries]           = useState<LeaderboardEntry[]>(loadEntries);
  const [globalAllTime, setGlobalAllTime] = useState<LeaderboardEntry[]>([]);
  const [globalWeekly, setGlobalWeekly]   = useState<LeaderboardEntry[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true);
 
  const currentWeekKey = getWeekKey(new Date());
 
  // Fetch global leaderboard on mount
  useEffect(() => {
    setIsLoadingGlobal(true);
    fetchGlobalLeaderboard().then(({ allTime, weekly }) => {
      setGlobalAllTime(allTime);
      setGlobalWeekly(weekly);
      setIsLoadingGlobal(false);
      console.log('[NeuroLearn] Global leaderboard loaded:', allTime.length, 'entries');
    });
  }, []);
 
  // Local all-time top 10
  const allTimeEntries = topByXP(entries);
 
  // Local this week's top 10
  const weeklyEntries = topByXP(
    entries.filter(e => e.weekKey === currentWeekKey)
  );
 
  // Personal best session all-time
  const personalBest = allTimeEntries[0] ?? null;
 
  // Add a new session entry — writes to localStorage AND Supabase
  const addEntry = useCallback(
    (entry: Omit<LeaderboardEntry, 'id' | 'date' | 'weekKey'>) => {
      const now = new Date();
      const newEntry: LeaderboardEntry = {
        ...entry,
        id:      `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date:    now.toISOString(),
        weekKey: getWeekKey(now),
      };
 
      // Save locally
      setEntries(prev => {
        const updated = [newEntry, ...prev];
        saveEntries(updated);
        return updated;
      });
 
      // Post to Supabase global leaderboard in the background
      postToSupabase(newEntry).then(() => {
        // Refresh global leaderboard after posting
        fetchGlobalLeaderboard().then(({ allTime, weekly }) => {
          setGlobalAllTime(allTime);
          setGlobalWeekly(weekly);
        });
      });
    },
    []
  );
 
  // Get the rank of a specific entry in the local top list (1-indexed)
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
    globalAllTime,
    globalWeekly,
    personalBest,
    totalSessions:   entries.length,
    currentWeekKey,
    daysUntilReset:  daysUntilMonday(),
    isLoadingGlobal,
    addEntry,
    getRank,
  };
}
 