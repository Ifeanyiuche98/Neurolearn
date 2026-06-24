// src/lib/exportSessions.ts
// Builds a CSV of the user's session history by combining two Supabase tables:
//   1. leaderboard         — every session (score, focus, XP, streak)
//   2. suspicious_sessions — only flagged sessions (BPM detail, suspicion level)
//
// Most sessions are never flagged, so BPM detail columns will be blank for them.
// That is expected and correct — it reflects what data actually exists.

import { supabase } from '../supabase';

// ── The shape of one exported row ─────────────────────────────────────────────
export interface ExportRow {
  session_id:        string;
  username:           string;
  module_title:        string;
  quiz_score_pct:      number;
  focus_score:         number;
  xp_earned:           number;
  streak_at_time:      number;
  avg_bpm:             string;   // blank if session was never flagged
  bpm_variance:        string;   // blank if session was never flagged
  suspicion_level:     string;   // 'none' if never flagged
  created_at:          string;
}

// ── Fetch and merge ────────────────────────────────────────────────────────────
export async function fetchSessionExportRows(): Promise<ExportRow[]> {
  const userId = localStorage.getItem('neurolearn_user_id');

  if (!userId) {
    throw new Error('No user_id found. Cannot export sessions for an unidentified user.');
  }

  // 1. Fetch all leaderboard rows for this user (every session)
  const { data: leaderboardRows, error: lbError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (lbError) {
    throw new Error(`Failed to fetch leaderboard data: ${lbError.message}`);
  }

  // 2. Fetch all suspicious_sessions rows for this user (flagged sessions only)
  const { data: suspiciousRows, error: ssError } = await supabase
    .from('suspicious_sessions')
    .select('*')
    .eq('user_id', userId);

  if (ssError) {
    // Non-fatal — we can still export without BPM detail
    console.warn('[Export] Could not fetch suspicious_sessions:', ssError.message);
  }

  // 3. Build a lookup of flagged sessions by approximate time + module
  //    (suspicious_sessions doesn't share a direct foreign key with leaderboard,
  //    so we match on module_title + closest timestamp within a 5-minute window)
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

  // 4. Merge into final export rows
  const rows: ExportRow[] = (leaderboardRows ?? []).map(lb => {
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

// ── Convert rows to a CSV string ───────────────────────────────────────────────
export function rowsToCSV(rows: ExportRow[]): string {
  if (rows.length === 0) {
    return 'No session data available.\n';
  }

  const headers: (keyof ExportRow)[] = [
    'session_id', 'username', 'module_title', 'quiz_score_pct',
    'focus_score', 'xp_earned', 'streak_at_time',
    'avg_bpm', 'bpm_variance', 'suspicion_level', 'created_at',
  ];

  // Escape a value for safe CSV output (handles commas, quotes, newlines)
  function escapeCSV(value: string | number): string {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headerLine = headers.join(',');
  const dataLines = rows.map(row =>
    headers.map(h => escapeCSV(row[h])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

// ── Trigger a browser download of the CSV ──────────────────────────────────────
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

// ── The full export flow — call this from a button click ───────────────────────
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