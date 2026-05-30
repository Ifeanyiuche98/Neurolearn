// ─── Analytics.tsx ────────────────────────────────────────────────────────────
// Hidden analytics dashboard for NeuroLearn v3.
// Shows aggregate numbers only — no personal data, no names.
// Accessed by tapping the NeuroLearn logo 5 times in the header.
// Safe to screenshot and share with Andreas, Andrew, or partners.
// ─────────────────────────────────────────────────────────────────────────────

import { type CSSProperties } from 'react';
import { useAnalytics } from './useAnalytics';

interface AnalyticsProps {
  onBack: () => void;
}

export default function Analytics({ onBack }: AnalyticsProps) {
  const data = useAnalytics();

  // ── Styles ──────────────────────────────────────────────────────────────────

  const backBtnStyle: CSSProperties = {
    background: 'transparent', color: '#666', border: '1px solid #333',
    borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
    fontSize: '0.8rem', marginBottom: '20px',
  };

  const sectionLabel: CSSProperties = {
    color: '#555', fontSize: '0.7rem', textTransform: 'uppercase',
    letterSpacing: '1px', marginBottom: '10px', marginTop: '20px',
  };

  const grid2: CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
    marginBottom: '10px',
  };

  const grid4: CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px',
    marginBottom: '10px',
  };

  const statCard = (accent: string): CSSProperties => ({
    background: '#1a1a2e', borderRadius: '10px', padding: '14px',
    border: `1px solid ${accent}33`, textAlign: 'center',
  });

  const bigNum = (color: string): CSSProperties => ({
    color, fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2px',
  });

  const statLabel: CSSProperties = {
    color: '#555', fontSize: '0.68rem', textTransform: 'uppercase',
    letterSpacing: '0.8px',
  };

  const moduleRow: CSSProperties = {
    background: '#1a1a2e', borderRadius: '10px', padding: '12px 14px',
    marginBottom: '8px', border: '1px solid #2a2a3a',
    display: 'flex', alignItems: 'center', gap: '12px',
  };

  const barTrack: CSSProperties = {
    flex: 1, height: '6px', background: '#0f0f1a',
    borderRadius: '3px', overflow: 'hidden',
  };

  const recentRow: CSSProperties = {
    background: '#1a1a2e', borderRadius: '8px', padding: '10px 12px',
    marginBottom: '6px', border: '1px solid #2a2a3a',
    display: 'flex', alignItems: 'center', gap: '10px',
  };

  // ── Score distribution bar widths ────────────────────────────────────────────
  const total = data.totalSessions || 1;
  const excellentPct = Math.round((data.excellentSessions / total) * 100);
  const goodPct      = Math.round((data.goodSessions / total) * 100);
  const practicePct  = Math.round((data.practiceSessions / total) * 100);

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Header */}
      <button onClick={onBack} style={backBtnStyle}>← Back to Modules</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>Analytics Dashboard</h2>
          <p style={{ color: '#444', fontSize: '0.72rem', margin: 0 }}>
            Aggregate data only · No personal information
          </p>
        </div>
        <div style={{ marginLeft: 'auto', background: '#1a1a2e', borderRadius: '8px', padding: '6px 12px', border: '1px solid #2a2a3a', textAlign: 'right' }}>
          <p style={{ color: '#555', fontSize: '0.65rem', marginBottom: '2px' }}>First session</p>
          <p style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 600 }}>{data.firstSessionDate}</p>
        </div>
      </div>

      {/* ── Core metrics ──────────────────────────────────────────────────────── */}
      <p style={sectionLabel}>Core metrics</p>
      <div style={grid4}>
        <div style={statCard('#2196F3')}>
          <p style={bigNum('#2196F3')}>{data.totalSessions}</p>
          <p style={statLabel}>Total sessions</p>
        </div>
        <div style={statCard('#4CAF50')}>
          <p style={bigNum('#4CAF50')}>{data.avgQuizScore}%</p>
          <p style={statLabel}>Avg quiz score</p>
        </div>
        <div style={statCard('#9C27B0')}>
          <p style={bigNum('#9C27B0')}>{data.avgFocusScore}</p>
          <p style={statLabel}>Avg focus score</p>
        </div>
        <div style={statCard('#FF9800')}>
          <p style={bigNum('#FF9800')}>{data.daysActive}</p>
          <p style={statLabel}>Days active</p>
        </div>
      </div>

      {/* ── XP + Token metrics ────────────────────────────────────────────────── */}
      <p style={sectionLabel}>XP & token activity</p>
      <div style={grid2}>
        <div style={statCard('#2196F3')}>
          <p style={bigNum('#2196F3')}>{data.totalXPEarned.toLocaleString()}</p>
          <p style={statLabel}>Total XP earned</p>
        </div>
        <div style={statCard('#FF9800')}>
          <p style={bigNum('#FF9800')}>{data.totalTokensClaimed}</p>
          <p style={statLabel}>ELTA tokens claimed</p>
        </div>
        <div style={statCard('#4CAF50')}>
          <p style={bigNum('#4CAF50')}>{data.avgXP.toLocaleString()}</p>
          <p style={statLabel}>Avg XP per session</p>
        </div>
        <div style={statCard('#FF9800')}>
          <p style={bigNum('#FF9800')}>{data.pendingXP.toLocaleString()}</p>
          <p style={statLabel}>Pending XP (unclaimed)</p>
        </div>
      </div>

      {/* ── Streak & retention ────────────────────────────────────────────────── */}
      <p style={sectionLabel}>Streak & retention signals</p>
      <div style={grid2}>
        <div style={statCard('#FF6B00')}>
          <p style={bigNum('#FF6B00')}>{data.currentStreak}</p>
          <p style={statLabel}>Current streak (days)</p>
        </div>
        <div style={statCard('#FF4500')}>
          <p style={bigNum('#FF4500')}>{data.longestStreak}</p>
          <p style={statLabel}>Longest streak (days)</p>
        </div>
        <div style={statCard('#2196F3')}>
          <p style={bigNum('#2196F3')}>{data.day7ReturnRate}%</p>
          <p style={statLabel}>Activity last 7 days</p>
        </div>
        <div style={statCard('#9C27B0')}>
          <p style={bigNum('#9C27B0')}>{data.avgStreakLength}</p>
          <p style={statLabel}>Avg streak length</p>
        </div>
      </div>

      {/* ── Score distribution ────────────────────────────────────────────────── */}
      <p style={sectionLabel}>Quiz score distribution</p>
      <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #2a2a3a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ color: '#4CAF50', fontSize: '0.8rem', minWidth: '90px' }}>🏆 Excellent (80%+)</span>
          <div style={barTrack}>
            <div style={{ height: '100%', width: `${excellentPct}%`, background: '#4CAF50', borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
          <span style={{ color: '#4CAF50', fontSize: '0.8rem', minWidth: '40px', textAlign: 'right' }}>{data.excellentSessions}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ color: '#FF9800', fontSize: '0.8rem', minWidth: '90px' }}>👍 Good (60–79%)</span>
          <div style={barTrack}>
            <div style={{ height: '100%', width: `${goodPct}%`, background: '#FF9800', borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
          <span style={{ color: '#FF9800', fontSize: '0.8rem', minWidth: '40px', textAlign: 'right' }}>{data.goodSessions}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#F44336', fontSize: '0.8rem', minWidth: '90px' }}>📖 Practice (&lt;60%)</span>
          <div style={barTrack}>
            <div style={{ height: '100%', width: `${practicePct}%`, background: '#F44336', borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
          <span style={{ color: '#F44336', fontSize: '0.8rem', minWidth: '40px', textAlign: 'right' }}>{data.practiceSessions}</span>
        </div>
      </div>

      {/* ── Module breakdown ──────────────────────────────────────────────────── */}
      <p style={sectionLabel}>Module popularity</p>
      {data.moduleStats.length === 0 ? (
        <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '20px', textAlign: 'center', border: '1px solid #2a2a3a' }}>
          <p style={{ color: '#444', fontSize: '0.85rem' }}>No sessions recorded yet. Share the app link to start collecting data.</p>
        </div>
      ) : (
        data.moduleStats.map((mod, i) => (
          <div key={mod.title} style={moduleRow}>
            <div style={{ minWidth: '28px', textAlign: 'center', fontSize: '1.1rem' }}>{mod.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{mod.title}</span>
                <span style={{ color: '#555', fontSize: '0.72rem' }}>{mod.sessions} session{mod.sessions !== 1 ? 's' : ''}</span>
              </div>
              <div style={barTrack}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((mod.sessions / (data.moduleStats[0]?.sessions || 1)) * 100)}%`,
                  background: ['#2196F3','#9C27B0','#00BCD4','#FF9800'][i % 4],
                  borderRadius: '3px', transition: 'width 0.4s',
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ color: '#4CAF50', fontSize: '0.78rem', fontWeight: 600 }}>{mod.avgQuizScore}%</p>
              <p style={{ color: '#555', fontSize: '0.68rem' }}>avg score</p>
            </div>
          </div>
        ))
      )}

      {/* ── Recent sessions ───────────────────────────────────────────────────── */}
      {data.recentSessions.length > 0 && (
        <>
          <p style={sectionLabel}>Recent sessions</p>
          {data.recentSessions.map((s, i) => (
            <div key={s.id} style={recentRow}>
              <span style={{ color: '#555', fontSize: '0.75rem', minWidth: '20px' }}>#{i + 1}</span>
              <span style={{ fontSize: '1rem' }}>{s.moduleIcon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1px' }}>{s.moduleTitle}</p>
                <p style={{ color: '#555', fontSize: '0.68rem' }}>
                  {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ background: '#4CAF5022', border: '1px solid #4CAF5044', borderRadius: '20px', padding: '2px 8px', color: '#4CAF50', fontSize: '0.7rem' }}>
                  📝 {s.quizScore}%
                </span>
                <span style={{ background: '#2196F322', border: '1px solid #2196F344', borderRadius: '20px', padding: '2px 8px', color: '#2196F3', fontSize: '0.7rem' }}>
                  ⚡ {s.xpEarned.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Footer — honest data disclosure ───────────────────────────────────── */}
      <div style={{
        background: 'rgba(0, 229, 204, 0.04)',
        border: '1px solid rgba(0, 229, 204, 0.2)',
        borderRadius: '12px',
        padding: '18px 20px',
        marginTop: '20px',
        textAlign: 'center',
      }}>
        <p style={{
          color: '#00e5cc',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '6px',
          letterSpacing: '0.01em',
        }}>
          NeuroLearn v3 · Powered by Elata Biosciences · Analytics Dashboard
        </p>
        <p style={{
          color: '#7a9db0',
          fontSize: '0.75rem',
          lineHeight: 1.6,
        }}>
          Biosignal &amp; focus data · Device only · Never uploaded
        </p>
        <p style={{
          color: '#4a6a7a',
          fontSize: '0.7rem',
          lineHeight: 1.6,
          marginTop: '4px',
        }}>
          Quiz scores shared globally for leaderboard · Username chosen by you
        </p>
      </div>

    </div>
  );
}
