import type { CSSProperties } from 'react';
import { useState } from 'react';
import { TIERS, type Tier, type TierName, type TierData } from './useTiers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierGateProps {
  tierData: TierData;
  moduleIndex: number;
  moduleTitle: string;
  moduleIcon: string;
  moduleColor: string;
  onUnlockSuccess: () => void;
}

interface TierBadgeProps {
  tier: Tier;
  isCurrent: boolean;
  isUnlocked: boolean;
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier, isCurrent, isUnlocked }: TierBadgeProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '10px',
      background: isCurrent
        ? `${tier.color}15`
        : isUnlocked
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
      border: `1px solid ${isCurrent ? tier.color + '44' : 'rgba(255,255,255,0.06)'}`,
      opacity: isUnlocked ? 1 : 0.4,
    }}>
      <span style={{
        fontSize: '10px',
        color: isCurrent ? tier.color : '#4a8070',
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
      }}>
        {tier.label}
      </span>
      {isCurrent && (
        <span style={{
          fontSize: '9px',
          background: tier.color,
          color: '#051a12',
          padding: '1px 6px',
          borderRadius: '4px',
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ACTIVE
        </span>
      )}
      {!isCurrent && isUnlocked && (
        <span style={{ fontSize: '10px', color: '#22c55e' }}>✓</span>
      )}
      {!isUnlocked && (
        <span style={{ fontSize: '10px', color: '#4a8070' }}>🔒</span>
      )}
    </div>
  );
}

// ─── Main TierGate Component ──────────────────────────────────────────────────

export default function TierGate({
  tierData,
  moduleIndex,
  moduleTitle,
  moduleIcon,
  moduleColor,
  onUnlockSuccess,
}: TierGateProps) {

  const [isUpgrading, setIsUpgrading]   = useState(false);
  const [resultMsg, setResultMsg]       = useState<string | null>(null);
  const [resultType, setResultType]     = useState<'success' | 'error' | null>(null);

  // Find which tier unlocks this module
  const requiredTier = TIERS.find(t => t.unlockedModules > moduleIndex) ??
    TIERS.find(t => t.unlockedModules === moduleIndex + 1) ??
    TIERS[moduleIndex];

  const currentTierIndex = TIERS.findIndex(t => t.name === tierData.currentTier);
  const requiredTierIndex = TIERS.findIndex(t => t.name === requiredTier?.name);

  // How many tiers away is the user
  const tiersAway = requiredTierIndex - currentTierIndex;
  const isNextTier = tiersAway === 1;

  const handleUpgrade = () => {
    if (!isNextTier) return;
    setIsUpgrading(true);
    setResultMsg(null);

    setTimeout(() => {
      const result = tierData.unlockNextTier();
      setIsUpgrading(false);

      if (result === 'success') {
        setResultType('success');
        setResultMsg(`${tierData.nextTier?.label ?? 'Next tier'} unlocked! You can now access ${moduleTitle}.`);
        setTimeout(() => onUnlockSuccess(), 1800);
      } else if (result === 'insufficient_funds') {
        setResultType('error');
        setResultMsg(`Not enough ELTA. You need ${tierData.eltaNeeded} more ELTA to unlock ${tierData.nextTier?.label}.`);
      }
    }, 600);
  };

  const nextTier    = tierData.nextTier;
  const eltaNeeded  = tierData.eltaNeeded;
  const canUpgrade  = tierData.canUpgrade && isNextTier;

  return (
    <>
      <style>{`
        @keyframes nlLockPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes nlShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        minHeight: '480px',
      }}>

        {/* Lock icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `${moduleColor}10`,
          border: `1.5px solid ${moduleColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          animation: 'nlLockPulse 2.5s ease-in-out infinite',
          boxShadow: `0 0 0 8px ${moduleColor}08`,
        }}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
        </div>

        {/* Module info */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: moduleColor,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '8px',
          opacity: 0.8,
        }}>
          {moduleIcon} {moduleTitle}
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '20px',
          fontWeight: 700,
          color: '#f0faf6',
          lineHeight: 1.3,
          marginBottom: '10px',
          margin: '0 0 10px 0',
        }}>
          This module is locked
        </h2>

        <p style={{
          fontSize: '13px',
          lineHeight: 1.7,
          color: '#8ab5a3',
          maxWidth: '280px',
          marginBottom: '24px',
        }}>
          {isNextTier
            ? `Unlock ${nextTier?.label} tier with ${nextTier?.cost} ELTA to access ${moduleTitle}.`
            : `Complete the previous tier first before unlocking ${moduleTitle}.`}
        </p>

        {/* Tier progress ladder */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%',
          maxWidth: '260px',
          marginBottom: '24px',
        }}>
          {TIERS.map((tier, i) => (
            <TierBadge
              key={tier.name}
              tier={tier}
              isCurrent={tier.name === tierData.currentTier}
              isUnlocked={i <= currentTierIndex}
            />
          ))}
        </div>

        {/* ELTA progress bar — only show if this is the next tier */}
        {isNextTier && nextTier && (
          <div style={{
            width: '100%',
            maxWidth: '280px',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#4a8070',
              }}>
                ELTA progress
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: canUpgrade ? '#20d29b' : '#f59e0b',
              }}>
                {canUpgrade
                  ? 'Ready to unlock!'
                  : `${eltaNeeded} more needed`}
              </span>
            </div>
            <div style={{
              height: '8px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, ((nextTier.cost - eltaNeeded) / nextTier.cost) * 100)}%`,
                background: canUpgrade
                  ? 'linear-gradient(90deg, #20d29b, #26e8ac)'
                  : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: '4px',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}

        {/* Result message */}
        {resultMsg && (
          <div style={{
            background: resultType === 'success'
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
            border: `1px solid ${resultType === 'success'
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
            color: resultType === 'success' ? '#22c55e' : '#ef4444',
            marginBottom: '16px',
            maxWidth: '280px',
            animation: resultType === 'error' ? 'nlShake 0.4s ease' : 'none',
          }}>
            {resultType === 'success' ? '✅ ' : '⚠️ '}{resultMsg}
          </div>
        )}

        {/* Unlock button */}
        {isNextTier && (
          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade || isUpgrading}
            style={{
              width: '100%',
              maxWidth: '280px',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: canUpgrade
                ? '#20d29b'
                : 'rgba(255,255,255,0.06)',
              color: canUpgrade ? '#051a12' : '#4a8070',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: isUpgrading ? 0.7 : 1,
            } as CSSProperties}
          >
            {isUpgrading
              ? 'Unlocking…'
              : canUpgrade
                ? `Unlock ${nextTier?.label} — ${nextTier?.cost} ELTA`
                : `Need ${eltaNeeded} more ELTA`}
          </button>
        )}

        {/* Not next tier message */}
        {!isNextTier && (
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#f59e0b',
            maxWidth: '280px',
            lineHeight: 1.6,
          }}>
            🔓 Unlock the previous tier first to continue your journey.
          </div>
        )}

      </div>
    </>
  );
}
