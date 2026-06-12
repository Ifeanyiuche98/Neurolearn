// src/screens/ResultsScreen.tsx
import type { CSSProperties } from 'react';
import type { LearningModule } from '../types';
import type { UseStreakReturn }  from '../useStreak';
import type { UseTokensReturn }  from '../useTokens';

interface SessionSummary { duration: number; avgBpm: number | null; }

interface ResultsScreenProps {
  activeModule:    LearningModule;
  quizScore:       number;
  sessionSummary:  SessionSummary | null;
  streakData:      UseStreakReturn;
  tokenData:       UseTokensReturn;
  totalQuizXP:     number;
  backToHome:      () => void;
  setScreen:       (s: 'leaderboard') => void;
}

function getFocusScore(avgBpm: number | null) {
  if (avgBpm == null) return { score: 0,  label: 'No data collected',   color: '#7a9db0' };
  if (avgBpm < 65)    return { score: 98, label: 'Exceptional Focus',   color: '#22c55e' };
  if (avgBpm < 75)    return { score: 90, label: 'Strong Focus',        color: '#22c55e' };
  if (avgBpm < 85)    return { score: 78, label: 'Good Focus',          color: '#00e5cc' };
  if (avgBpm < 95)    return { score: 62, label: 'Moderate Focus',      color: '#f59e0b' };
  return                   { score: 45, label: 'High Stress Detected', color: '#ef4444' };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const card = (accent = 'rgba(255,255,255,0.06)'): CSSProperties => ({
  background: 'var(--bg-card)',
  border: `1px solid ${accent}`,
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
});

export default function ResultsScreen({
  activeModule, quizScore, sessionSummary, streakData, tokenData, totalQuizXP, backToHome, setScreen,
}: ResultsScreenProps) {
  const focusScore = getFocusScore(sessionSummary?.avgBpm ?? null);
  const quizPct    = Math.round((quizScore / activeModule.quiz.length) * 100);

  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          {activeModule.title} Complete!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Here is your session breakdown</p>
      </div>

      {/* Quiz + Focus scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div style={card()}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Quiz Score</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '2px' }}>{quizPct}%</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '8px' }}>{quizScore}/{activeModule.quiz.length} correct</p>
          <p style={{ color: quizPct >= 80 ? '#22c55e' : quizPct >= 60 ? '#f59e0b' : '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>
            {quizPct >= 80 ? 'Excellent!' : quizPct >= 60 ? 'Good effort!' : 'Keep practicing'}
          </p>
        </div>
        <div style={{ ...card(`${focusScore.color}22`) }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Focus Score</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: focusScore.color, letterSpacing: '-0.04em', marginBottom: '2px' }}>{focusScore.score}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '8px' }}>{focusScore.label}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Avg BPM: {sessionSummary?.avgBpm != null ? Math.round(sessionSummary.avgBpm) : 'N/A'}
          </p>
        </div>
      </div>

      {/* XP this session */}
      <div style={{ ...card('var(--pulse-border)'), marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>XP This Session</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#00e5cc', letterSpacing: '-0.04em' }}>+{totalQuizXP.toLocaleString()}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Multiplier</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#a855f7' }}>{streakData.xpMultiplier.toFixed(1)}x</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{streakData.getStreakLabel()}</p>
        </div>
      </div>

      {/* ELTA row */}
      <div style={{ ...card('rgba(245,158,11,0.2)'), background: 'rgba(245,158,11,0.04)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Pending ELTA</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>
            {tokenData.claimableTokens > 0 ? `${tokenData.claimableTokens} ready to claim! 🎉` : `${tokenData.pendingXP.toLocaleString()} XP pending`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Balance</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{tokenData.balance} ELTA</p>
        </div>
      </div>

      {/* Lifetime XP + Study time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ ...card(), textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Lifetime XP</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{streakData.totalXP.toLocaleString()}</p>
        </div>
        <div style={{ ...card(), textAlign: 'center' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Study Time</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {sessionSummary ? formatTime(sessionSummary.duration) : '—'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setScreen('leaderboard')}
          style={{ flex: 1, minHeight: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', color: '#00e5cc', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          🏆 Leaderboard
        </button>
        <button className="btn-primary" onClick={backToHome} style={{ flex: 2, background: activeModule.color, color: '#020408' }}>
          Back to Modules
        </button>
      </div>
    </div>
  );
}