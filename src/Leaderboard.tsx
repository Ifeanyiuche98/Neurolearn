// ─── Leaderboard.tsx ──────────────────────────────────────────────────────────
// Personal session leaderboard for NeuroLearn v3 Phase 2.
// Shows all-time and weekly top sessions ranked by XP.
// NOTE: Personal sessions only until Supabase multi-user support is added.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react';
import type { LeaderboardReturn, LeaderboardEntry } from './useLeaderboard';

interface LeaderboardProps {
  leaderboardData: LeaderboardReturn;
  onBack: () => void;
}

type Tab = 'allTime' | 'weekly';

export default function Leaderboard({ leaderboardData, onBack }: LeaderboardProps) {
  const {
    allTimeEntries,
    weeklyEntries,
    personalBest,
    totalSessions,
    daysUntilReset,
  } = leaderboardData;

  const [activeTab, setActiveTab] = useState<Tab>('allTime');
  const entries = activeTab === 'allTime' ? allTimeEntries : weeklyEntries;

  function getMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  const backBtnStyle: CSSProperties = {
    background: 'transparent', color: '#666', border: '1px solid #333',
    borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem',
    marginBottom: '20px',
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.85rem',
    background: active ? '#2196F3' : 'transparent',
    color: active ? '#fff' : '#666',
    transition: 'all 0.2s',
  });

  const entryStyle = (rank: number): CSSProperties => ({
    background: rank === 1 ? '#1a1a10' : '#1a1a2e',
    border: `1px solid ${rank === 1 ? '#FF980044' : '#2a2a3a'}`,
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  });

  const statChipStyle = (color: string): CSSProperties => ({
    background: `${color}22`,
    border: `1px solid ${color}44`,
    borderRadius: '20px',
    padding: '2px 8px',
    color,
    fontSize: '0.7rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  });

  function renderEmpty() {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444' }}>
        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🏆</p>
        <p style={{ fontSize: '0.9rem', marginBottom: '6px', color: '#666' }}>
          {activeTab === 'weekly' ? 'No sessions this week yet.' : 'No sessions recorded yet.'}
        </p>
        <p style={{ fontSize: '0.8rem' }}>Complete a module quiz to appear here!</p>
      </div>
    );
  }

  function renderEntry(entry: LeaderboardEntry, rank: number) {
    return (
      <div key={entry.id} style={entryStyle(rank)}>
        <div style={{
          minWidth: '36px', textAlign: 'center',
          fontSize: rank <= 3 ? '1.2rem' : '0.85rem',
          fontWeight: 'bold',
          color: rank <= 3 ? '#fff' : '#555',
        }}>
          {getMedal(rank)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1rem' }}>{entry.moduleIcon}</span>
            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
              {entry.moduleTitle}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <span style={statChipStyle('#2196F3')}>⚡ {entry.xpEarned.toLocaleString()} XP</span>
            <span style={statChipStyle('#4CAF50')}>📝 {entry.quizScore}%</span>
            <span style={statChipStyle('#9C27B0')}>🧠 {entry.focusScore}</span>
            {entry.streak > 0 && (
              <span style={statChipStyle('#FF9800')}>🔥 {entry.streak}d</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: '#444', fontSize: '0.7rem' }}>{formatDate(entry.date)}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <button onClick={onBack} style={backBtnStyle}>← Back to Modules</button>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🏆</div>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '4px' }}>Leaderboard</h2>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>
          {totalSessions} session{totalSessions !== 1 ? 's' : ''} recorded · Your personal bests
        </p>
      </div>

      {personalBest && (
        <div style={{
          background: '#0f0f1a', border: '1px solid #FF980033',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.7rem', marginBottom: '2px' }}>All-time best session</p>
            <p style={{ color: '#FF9800', fontSize: '1.1rem', fontWeight: 'bold' }}>
              ⚡ {personalBest.xpEarned.toLocaleString()} XP
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#555', fontSize: '0.7rem', marginBottom: '2px' }}>Weekly reset in</p>
            <p style={{ color: '#2196F3', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', gap: '4px', background: '#0f0f1a',
        borderRadius: '10px', padding: '4px', marginBottom: '16px',
      }}>
        <button onClick={() => setActiveTab('allTime')} style={tabStyle(activeTab === 'allTime')}>
          🏆 All Time
        </button>
        <button onClick={() => setActiveTab('weekly')} style={tabStyle(activeTab === 'weekly')}>
          📅 This Week
        </button>
      </div>

      {entries.length === 0
        ? renderEmpty()
        : entries.map((entry, i) => renderEntry(entry, i + 1))
      }

      <p style={{ color: '#333', fontSize: '0.7rem', textAlign: 'center', marginTop: '16px' }}>
        🌍 Global multi-user leaderboard coming when Elata launches
      </p>
    </div>
  );
}