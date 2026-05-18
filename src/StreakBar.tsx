// ─── StreakBar.tsx ────────────────────────────────────────────────────────────
// Displays the user's streak, XP, freeze tokens, and XP multiplier.
// Lives at the top of the home screen, just below the header.
// Also renders the bonus toast (milestone/comeback messages).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, type CSSProperties } from 'react';
import type { StreakReturn } from './useStreak';

interface StreakBarProps {
  streakData: StreakReturn;
}

export default function StreakBar({ streakData }: StreakBarProps) {
  const {
    streak,
    totalXP,
    freezeTokens,
    xpMultiplier,
    bonusMessage,
    dismissBonus,
    getStreakLabel,
  } = streakData;

  // Auto-dismiss bonus toast after 4 seconds
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bonusMessage) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissBonus, 400);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [bonusMessage, dismissBonus]);

  // ── Styles ────────────────────────────────────────────────────────────────────

  const barStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#0f0f1a',
    border: '1px solid #1e1e30',
    borderRadius: '12px',
    padding: '10px 16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  };

  const chipStyle = (color: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: '#1a1a2e',
    border: `1px solid ${color}33`,
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '0.78rem',
    color,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  });

  const dividerStyle: CSSProperties = {
    width: '1px',
    height: '18px',
    background: '#2a2a3a',
    flexShrink: 0,
  };

  const toastStyle: CSSProperties = {
    position: 'fixed',
    top: '72px',
    left: '50%',
    transform: `translateX(-50%) translateY(${visible ? '0' : '-12px'})`,
    opacity: visible ? 1 : 0,
    transition: 'all 0.35s ease',
    background: '#1a1a2e',
    border: '1px solid #4CAF5066',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#fff',
    fontSize: '0.88rem',
    fontWeight: 600,
    boxShadow: '0 8px 32px #00000088',
    zIndex: 999,
    cursor: 'pointer',
    maxWidth: '90vw',
    textAlign: 'center',
    pointerEvents: visible ? 'auto' : 'none',
  };

  // ── Streak flame colour: more days = hotter ────────────────────────────────
  const streakColor =
    streak === 0   ? '#555' :
    streak < 3     ? '#FF9800' :
    streak < 7     ? '#FF6B00' :
    streak < 30    ? '#FF4500' : '#FF0000';

  // ── Multiplier label: only show if > 1x ───────────────────────────────────
  const multiplierStr = xpMultiplier > 1
    ? `${xpMultiplier.toFixed(1)}x`
    : null;

  return (
    <>
      {/* ── Streak bar ─────────────────────────────────────────────────────── */}
      <div style={barStyle} role="status" aria-label="Your learning streak and XP">

        {/* Streak count */}
        <div style={chipStyle(streakColor)}>
          <span aria-hidden="true">{streak > 0 ? '🔥' : '💤'}</span>
          <span>{getStreakLabel()}</span>
        </div>

        <div style={dividerStyle} />

        {/* Total XP */}
        <div style={chipStyle('#2196F3')}>
          <span aria-hidden="true">⚡</span>
          <span>{totalXP.toLocaleString()} XP</span>
        </div>

        {/* XP Multiplier — only show when streak is active */}
        {multiplierStr && (
          <>
            <div style={dividerStyle} />
            <div style={chipStyle('#9C27B0')}>
              <span aria-hidden="true">✨</span>
              <span>{multiplierStr} Multiplier</span>
            </div>
          </>
        )}

        <div style={dividerStyle} />

        {/* Freeze tokens */}
        <div style={chipStyle('#00BCD4')} title="Freeze tokens protect your streak if you miss a day">
          <span aria-hidden="true">❄️</span>
          <span>{freezeTokens} Freeze{freezeTokens !== 1 ? 's' : ''}</span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Streak tip — only when streak is 0 */}
        {streak === 0 && (
          <span style={{ color: '#555', fontSize: '0.72rem' }}>
            Complete a module to start your streak
          </span>
        )}
      </div>

      {/* ── Bonus toast (milestone / comeback messages) ─────────────────────── */}
      {bonusMessage && (
        <div
          style={toastStyle}
          onClick={() => { setVisible(false); setTimeout(dismissBonus, 400); }}
          role="alert"
          aria-live="polite"
        >
          {bonusMessage}
          <span style={{ display: 'block', color: '#555', fontSize: '0.7rem', marginTop: '4px' }}>
            Tap to dismiss
          </span>
        </div>
      )}
    </>
  );
}