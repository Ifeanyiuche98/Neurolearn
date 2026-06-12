// src/screens/HomeScreen.tsx
import type { CSSProperties } from 'react';
import type { LearningModule } from '../types';
import type { Screen }         from '../types';
import type { StreakReturn }      from '../useStreak';
import type { TokenReturn }       from '../useTokens';
import type { LeaderboardReturn } from '../useLeaderboard';
import { useTiers }               from '../useTiers';

interface HomeScreenProps {
  modules:         LearningModule[];
  tierData:        ReturnType<typeof useTiers>;
  streakData:      StreakReturn;
  tokenData:       TokenReturn;
  leaderboardData: LeaderboardReturn;
  username:        string | null;
  startModule:     (mod: LearningModule, index: number) => void;
  setScreen:       (s: Screen) => void;
}

const pill = (bg: string, color: string): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: bg, color,
  borderRadius: 'var(--radius-pill)',
  padding: '3px 12px',
  fontSize: '0.72rem', fontWeight: 600,
  whiteSpace: 'nowrap' as const,
  border: `1px solid ${color}44`,
});

export default function HomeScreen({
  modules, tierData, streakData, tokenData, leaderboardData, username, startModule, setScreen,
}: HomeScreenProps) {
  void streakData;
  void tokenData;

  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid rgba(32,210,155,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Tier</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: tierData.getTierByName(tierData.currentTier).color }}>
            {tierData.getTierByName(tierData.currentTier).label}
          </span>
        </div>
        {tierData.nextTier && (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {tierData.eltaNeeded > 0
              ? `${tierData.eltaNeeded} ELTA to ${tierData.nextTier.label}`
              : `Ready to unlock ${tierData.nextTier.label}!`}
          </span>
        )}
      </div>

      <button
        onClick={() => setScreen('leaderboard')}
        style={{ width: '100%', marginBottom: '20px', minHeight: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', color: '#00e5cc', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
      >
        🏆 View Leaderboard
        {leaderboardData.totalSessions > 0 && (
          <span style={pill('rgba(0,229,204,0.08)', '#00e5cc')}>
            {leaderboardData.totalSessions} session{leaderboardData.totalSessions !== 1 ? 's' : ''}
          </span>
        )}
      </button>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        Choose a Module
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
        NeuroLearn tracks your focus as you learn.
      </p>

      <div className="module-grid">
        {modules.map((mod, index) => (
          <button
            key={mod.id}
            onClick={() => startModule(mod, index)}
            className="module-card"
            style={{ '--accent': mod.color } as CSSProperties}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '10px', lineHeight: 1 }}>{mod.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: mod.color, marginBottom: '6px', letterSpacing: '-0.01em' }}>
              {mod.title}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '8px' }}>
              {mod.description}
            </div>
            {!tierData.canAccessModule(index) && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', color: '#f59e0b', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                🔒 Locked
              </div>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span>{mod.lesson.length} lessons</span>
              <span>·</span>
              <span>{mod.flashcards.length} cards</span>
              <span>·</span>
              <span>{mod.quiz.length} questions</span>
            </div>
          </button>
        ))}
      </div>

      {username && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '20px', fontFamily: 'var(--font-mono)' }}>
          Playing as <span style={{ color: '#20d29b', fontWeight: 700 }}>{username}</span>
        </p>
      )}
    </div>
  );
}