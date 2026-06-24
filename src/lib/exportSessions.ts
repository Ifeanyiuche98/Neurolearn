// src/lib/exportSessions.ts
// Builds a CSV of the user's session history by combining two Supabase tables:
//   1. leaderboard         — every session (score, focus, XP, streak)
//   2. suspicious_sessions — only flagged sessions (BPM detail, suspicion level)
//
// v3.2.1 — Self-healing user_id: if localStorage is missing or stale,
// looks up the correct user_id from Supabase using the username, since
// username + user_id were both written together at signup time.

import { supabase } from '../supabase';

export interface ExportRow {
  session_id:      string;
  username:        string;
  module_title:    string;
  quiz_score_pct:  number;
  focus_score:     number;
  xp_earned:       number;
  streak_at_time:  number;
  avg_bpm:         string;
  bpm_variance:    string;
  suspicion_level: string;
  created_at:      string;
}

// ── Resolve a trustworthy user_id ──────────────────────────────────────────────
async function resolveUserId(): Promise<string | null> {
  const storedUserId = localStorage.getItem('neurolearn_user_id');
  if (storedUserId) return storedUserId;

  const username = localStorage.getItem('neurolearn_username');
  if (!username) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.warn('[Export] Could not recover user_id for username:', username, error?.message);
    return null;
  }

  localStorage.setItem('neurolearn_user_id', data.id);
  console.log('[Export] Recovered and saved user_id for', username);

  return data.id;
}

// ── Fetch and merge ────────────────────────────────────────────────────────────
export async function fetchSessionExportRows(): Promise<ExportRow[]> {
  const userId = await resolveUserId();

  if (!userId) {
    throw new Error(
      'Could not identify your account on this device. Try re-entering your username, then export again.'
    );
  }

  const { data: leaderboardRows, error: lbError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (lbError) {
    throw new Error(`Failed to fetch leaderboard data: ${lbError.message}`);
  }

  let finalRows = leaderboardRows ?? [];

  // Fallback for legacy rows that predate user_id linking
  if (finalRows.length === 0) {
    const username = localStorage.getItem('neurolearn_username');
    if (username) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', username)
        .is('user_id', null)
        .order('created_at', { ascending: false });

      if (!legacyError && legacyRows) {
        finalRows = legacyRows;
        console.log('[Export] Recovered', legacyRows.length, 'legacy unlinked session(s) by username');
      }
    }
  }

  const { data: suspiciousRows, error: ssError } = await supabase
    .from('suspicious_sessions')
    .select('*')
    .eq('user_id', userId);

  if (ssError) {
    console.warn('[Export] Could not fetch suspicious_sessions:', ssError.message);
  }

  const flaggedList = suspiciousRows ?? [];

  function findMatchingFlag(moduleTitle: string, createdAt: string) {
    const targetTime = new Date(createdAt).getTime();
    const FIVE_MIN = 5 * 60 * 1000;
    return flaggedList.find(flag => {
      if (flag.module_title !== moduleTitle) return false;
      const flagTime = new Date(flag.created_at).getTime();
      return Math.abs(flagTime - targetTime) <= FIVE_MIN;
    });
  }

  const rows: ExportRow[] = finalRows.map(lb => {
    const flag = findMatchingFlag(lb.module_title, lb.created_at);
    return {
      session_id:      String(lb.id),
      username:        String(lb.username ?? 'Anonymous'),
      module_title:    String(lb.module_title ?? ''),
      quiz_score_pct:  Number(lb.score ?? 0),
      focus_score:     Number(lb.focus_score ?? 0),
      xp_earned:       Number(lb.xp_earned ?? 0),
      streak_at_time:  Number(lb.streak ?? 0),
      avg_bpm:         flag ? String(flag.avg_bpm)      : '',
      bpm_variance:    flag ? String(flag.bpm_variance) : '',
      suspicion_level: flag ? String(flag.suspicion_level) : 'none',
      created_at:      String(lb.created_at),
    };
  });

  return rows;
}

export function rowsToCSV(rows: ExportRow[]): string {
  if (rows.length === 0) {
    return 'No session data available.\n';
  }

  const headers: (keyof ExportRow)[] = [
    'session_id', 'username', 'module_title', 'quiz_score_pct',
    'focus_score', 'xp_earned', 'streak_at_time',
    'avg_bpm', 'bpm_variance', 'suspicion_level', 'created_at',
  ];

  function escapeCSV(value: string | number): string {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headerLine = headers.join(',');
  const dataLines = rows.map(row => headers.map(h => escapeCSV(row[h])).join(','));

  return [headerLine, ...dataLines].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportMySessionsAsCSV(): Promise<{ success: boolean; rowCount: number; error?: string }> {
  try {
    const rows = await fetchSessionExportRows();
    const csv  = rowsToCSV(rows);

    const username = localStorage.getItem('neurolearn_username') || 'user';
    const dateStr   = new Date().toISOString().slice(0, 10);
    const filename  = `neurolearn_sessions_${username}_${dateStr}.csv`;

    downloadCSV(csv, filename);

    return { success: true, rowCount: rows.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown export error';
    console.error('[Export] Failed:', message);
    return { success: false, rowCount: 0, error: message };
  }
}