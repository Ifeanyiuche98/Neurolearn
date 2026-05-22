// ─── useAnalytics.ts ──────────────────────────────────────────────────────────
// Reads all NeuroLearn localStorage data and computes aggregate metrics.
// No personal data — numbers only. Safe to screenshot and share externally.
// ─────────────────────────────────────────────────────────────────────────────
 
import { useState, useEffect } from 'react';
 
// ── Storage keys (must match the other hooks) ─────────────────────────────────
const STREAK_KEY      = 'neurolearn_v3_streak';
const TOKENS_KEY      = 'neurolearn_v3_tokens';
const LEADERBOARD_KEY = 'neurolearn_v3_leaderboard';
 
// ── Types ─────────────────────────────────────────────────────────────────────
 
interface LeaderboardEntry {
  id: string;
  moduleTitle: string;
  moduleIcon: string;
  quizScore: number;
  focusScore: number;
  xpEarned: number;
  streak: number;
  date: string;
  weekKey: string;
}
 
export interface ModuleStat {
  title: string;
  icon: string;
  sessions: number;
  avgQuizScore: number;
  avgFocusScore: number;
  avgXP: number;
}
 
export interface AnalyticsData {
  // Session metrics
  totalSessions: number;
  avgQuizScore: number;
  avgFocusScore: number;
  avgXP: number;
  totalXPEarned: number;
 
  // Token metrics
  tokenBalance: number;
  totalTokensClaimed: number;
  pendingXP: number;
 
  // Streak metrics
  currentStreak: number;
  longestStreak: number;
  streakLabel: string;
 
  // Retention signals
  day1ReturnRate: number;   // % of users who came back the next day
  day7ReturnRate: number;   // % of sessions within last 7 days
  avgStreakLength: number;
  comebackCount: number;    // How many times streak was broken and restarted
 
  // Module breakdown
  moduleStats: ModuleStat[];
  mostPopularModule: string;
 
  // Score distribution
  excellentSessions: number;   // quiz >= 80%
  goodSessions: number;        // quiz 60-79%
  practiceSessions: number;    // quiz < 60%
 
  // Time metrics
  firstSessionDate: string;
  lastSessionDate: string;
  daysActive: number;
 
  // Raw for charts
  recentSessions: LeaderboardEntry[];
}
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
 
function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
 
function daysBetween(a: string, b: string): number {
  const diff = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
 
function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
 
function getStreakLabel(streak: number): string {
  if (streak === 0) return 'No active streak';
  if (streak === 1) return '1 day streak';
  if (streak < 7)  return `🔥 ${streak} day streak`;
  if (streak < 30) return `🔥🔥 ${streak} day streak`;
  return `🔥🔥🔥 ${streak} day streak`;
}
 
// ── The hook ──────────────────────────────────────────────────────────────────
 
export function useAnalytics(): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>(computeAnalytics);
 
  // Recompute whenever localStorage changes
  useEffect(() => {
    const handler = () => setData(computeAnalytics());
    window.addEventListener('storage', handler);
    // Also recompute on mount in case data changed since last render
    setData(computeAnalytics());
    return () => window.removeEventListener('storage', handler);
  }, []);
 
  return data;
}
 
function computeAnalytics(): AnalyticsData {
  // ── Read raw data ────────────────────────────────────────────────────────────
  const streakRaw   = safeGet(STREAK_KEY, {
    currentStreak: 0, longestStreak: 0, totalXP: 0, freezeTokens: 0, lastVisitDate: ''
  });
  const tokensRaw   = safeGet(TOKENS_KEY, {
    balance: 0, lifetimeClaimed: 0, pendingXP: 0
  });
  const entries: LeaderboardEntry[] = safeGet(LEADERBOARD_KEY, []);
 
  // ── Session metrics ──────────────────────────────────────────────────────────
  const totalSessions  = entries.length;
  const avgQuizScore   = avg(entries.map(e => e.quizScore));
  const avgFocusScore  = avg(entries.map(e => e.focusScore));
  const avgXP          = avg(entries.map(e => e.xpEarned));
  const totalXPEarned  = entries.reduce((s, e) => s + e.xpEarned, 0);
 
  // ── Score distribution ───────────────────────────────────────────────────────
  const excellentSessions = entries.filter(e => e.quizScore >= 80).length;
  const goodSessions      = entries.filter(e => e.quizScore >= 60 && e.quizScore < 80).length;
  const practiceSessions  = entries.filter(e => e.quizScore < 60).length;
 
  // ── Module breakdown ─────────────────────────────────────────────────────────
  const moduleMap = new Map<string, LeaderboardEntry[]>();
  for (const entry of entries) {
    const key = entry.moduleTitle;
    if (!moduleMap.has(key)) moduleMap.set(key, []);
    moduleMap.get(key)!.push(entry);
  }
  const moduleStats: ModuleStat[] = Array.from(moduleMap.entries()).map(([title, list]) => ({
    title,
    icon: list[0].moduleIcon,
    sessions: list.length,
    avgQuizScore: avg(list.map(e => e.quizScore)),
    avgFocusScore: avg(list.map(e => e.focusScore)),
    avgXP: avg(list.map(e => e.xpEarned)),
  })).sort((a, b) => b.sessions - a.sessions);
 
  const mostPopularModule = moduleStats[0]?.title ?? '—';
 
  // ── Date metrics ─────────────────────────────────────────────────────────────
  const sortedDates = entries.map(e => e.date).sort();
  const firstSessionDate = sortedDates[0] ? formatDate(sortedDates[0]) : '—';
  const lastSessionDate  = sortedDates[sortedDates.length - 1]
    ? formatDate(sortedDates[sortedDates.length - 1]) : '—';
 
  // Days active = unique calendar days with at least one session
  const uniqueDays = new Set(entries.map(e => e.date.split('T')[0])).size;
 
  // ── Retention signals ────────────────────────────────────────────────────────
  // Day-7 return rate: sessions in last 7 days / total * 100
  const now       = new Date();
  const sevenAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = entries.filter(e => new Date(e.date) >= sevenAgo).length;
  const day7ReturnRate = totalSessions > 0
    ? Math.round((recentCount / totalSessions) * 100) : 0;
 
  // Day-1 return rate: approximated from streak data
  // If current streak > 1, user returned at least once
  const day1ReturnRate = streakRaw.longestStreak > 1 ? 100 : 0;
 
  // Average streak length approximation from leaderboard streak values
  const avgStreakLength = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.streak, 0) / entries.length) : 0;
 
  // Comeback count: number of times streak value reset to 1 after being higher
  let comebackCount = 0;
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].streak === 1 && entries[i - 1].streak > 1) comebackCount++;
  }
 
  // ── Recent sessions (last 5) ─────────────────────────────────────────────────
  const recentSessions = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
 
  return {
    totalSessions,
    avgQuizScore,
    avgFocusScore,
    avgXP,
    totalXPEarned,
    tokenBalance: tokensRaw.balance,
    totalTokensClaimed: tokensRaw.lifetimeClaimed,
    pendingXP: tokensRaw.pendingXP,
    currentStreak: streakRaw.currentStreak,
    longestStreak: streakRaw.longestStreak,
    streakLabel: getStreakLabel(streakRaw.currentStreak),
    day1ReturnRate,
    day7ReturnRate,
    avgStreakLength,
    comebackCount,
    moduleStats,
    mostPopularModule,
    excellentSessions,
    goodSessions,
    practiceSessions,
    firstSessionDate,
    lastSessionDate,
    daysActive: uniqueDays,
    recentSessions,
  };
}
 