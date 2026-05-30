// ─── Leaderboard.tsx ──────────────────────────────────────────────────────────
// Global leaderboard for NeuroLearn v3 — powered by Supabase.
// Shows global scores from all users worldwide alongside personal bests.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react';
import type { LeaderboardReturn, LeaderboardEntry } from './useLeaderboard';

interface LeaderboardProps {
  leaderboardData: LeaderboardReturn;
  onBack: () => void;
}

type Tab = 'allTime' | 'weekly';
type View = 'global' | 'personal';

export default function Leaderboard({ leaderboardData, onBack }: LeaderboardProps) {
  const {
    allTimeEntries,
    weeklyEntries,
    globalAllTime,
    globalWeekly,
    personalBest,
    totalSessions,
    daysUntilReset,
    isLoadingGlobal,
  } = leaderboardData;

  const [activeTab, setActiveTab] = useState<Tab>('allTime');
  const [activeView, setActiveView] = useState<View>('global');

  // Pick the right entries based on tab and view
  const entries = activeView === 'global'
    ? (activeTab === 'allTime' ? globalAllTime : globalWeekly)
    : (activeTab === 'allTime' ? allTimeEntries : weeklyEntries);

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
    flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.85rem',
    background: active ? '#2196F3' : 'transparent',
    color: active ? '#fff' : '#666',
    transition: 'all 0.2s',
  });

  const viewTabStyle = (active: boolean): CSSProperties => ({
    flex: 1, padding: '7px', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.78rem',
    background: active ? 'rgba(0,229,204,0.15)' : 'transparent',
    color: active ? '#00e5cc' : '#555',
    transition: 'all 0.2s',
  });

  const entryStyle = (rank: number): CSSProperties => ({
    background: rank === 1 ? '#1a1a10' : '#1a1a2e',
    border: `1px solid ${rank === 1 ? '#FF980044' : '#2a2a3a'}`,
    borderRadius: '10px', padding: '12px 14px', marginBottom: '8px',
    display: 'flex', alignItems: 'center', gap: '12px',
  });

  const statChipStyle = (color: string): CSSProperties => ({
    background: `${color}22`, border: `1px solid ${color}44`,
    borderRadius: '20px', padding: '2px 8px', color,
    fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
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

  function renderLoading() {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⏳</p>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>Loading global scores...</p>
      </div>
    );
  }

  function renderEntry(entry: LeaderboardEntry, rank: number) {
    const isGlobal = activeView === 'global';
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
          {/* Username row — shown for global entries */}
          {isGlobal && entry.username && (
            <p style={{
              color: '#00e5cc', fontSize: '0.78rem', fontWeight: 700,
              marginBottom: '3px', fontFamily: 'monospace',
            }}>
              {entry.username}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1rem' }}>{entry.moduleIcon}</span>
            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
              {entry.moduleTitle}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <span style={statChipStyle('#2196F3')}>⚡ {entry.xpEarned.toLocaleString()} XP</span>
            <span style={statChipStyle('#4CAF50')}>📝 {entry.quizScore}%</span>
            {!isGlobal && (
              <>
                <span style={statChipStyle('#9C27B0')}>🧠 {entry.focusScore}</span>
                {entry.streak > 0 && (
                  <span style={statChipStyle('#FF9800')}>🔥 {entry.streak}d</span>
                )}
              </>
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

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🏆</div>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '4px' }}>Leaderboard</h2>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>
          {totalSessions} session{totalSessions !== 1 ? 's' : ''} recorded · Global scores live
        </p>
      </div>

      {/* Personal best banner */}
      {personalBest && (
        <div style={{
          background: '#0f0f1a', border: '1px solid #FF980033',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.7rem', marginBottom: '2px' }}>Your best session</p>
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

      {/* Global / Personal toggle */}
      <div style={{
        display: 'flex', gap: '4px', background: '#0f0f1a',
        borderRadius: '8px', padding: '3px', marginBottom: '10px',
        border: '1px solid rgba(0,229,204,0.1)',
      }}>
        <button onClick={() => setActiveView('global')} style={viewTabStyle(activeView === 'global')}>
          🌍 Global
        </button>
        <button onClick={() => setActiveView('personal')} style={viewTabStyle(activeView === 'personal')}>
          👤 My Sessions
        </button>
      </div>

      {/* All Time / Weekly tab */}
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

      {/* Entries */}
      {activeView === 'global' && isLoadingGlobal
        ? renderLoading()
        : entries.length === 0
          ? renderEmpty()
          : entries.map((entry, i) => renderEntry(entry, i + 1))
      }

      {/* Footer — honest data notice */}
      <p style={{ color: '#333', fontSize: '0.7rem', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
        Biosignal data · Device only · Never uploaded
        <br />
        <span style={{ color: '#2a2a2a' }}>Quiz scores &amp; username shared globally for this leaderboard</span>
      </p>
    </div>
  );
}
