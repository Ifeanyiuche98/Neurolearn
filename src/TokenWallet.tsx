// ─── TokenWallet.tsx ──────────────────────────────────────────────────────────
// Displays the user's simulated ELT token wallet on the home screen.
// Shows balance, pending XP, claimable tokens, and real contract address.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react';
import type { TokenReturn } from './useTokens';
import { TOKEN_CONFIG } from './useTokens';

interface TokenWalletProps {
  tokenData: TokenReturn;
}

export default function TokenWallet({ tokenData }: TokenWalletProps) {
  const {
    balance,
    lifetimeClaimed,
    pendingXP,
    claimableTokens,
    claimTokens,
    formatAddress,
  } = tokenData;

  const [justClaimed, setJustClaimed] = useState(0);
  const [showClaimed, setShowClaimed] = useState(false);

  const xpIntoCurrentToken = pendingXP % TOKEN_CONFIG.XP_PER_TOKEN;
  const progressPct = Math.round((xpIntoCurrentToken / TOKEN_CONFIG.XP_PER_TOKEN) * 100);

  const handleClaim = () => {
    const claimed = claimTokens();
    if (claimed > 0) {
      setJustClaimed(claimed);
      setShowClaimed(true);
      setTimeout(() => setShowClaimed(false), 3000);
    }
  };

  const cardStyle: CSSProperties = {
    background: '#0f0f1a',
    border: '1px solid #1e1e30',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const labelStyle: CSSProperties = {
    color: '#555',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const valueStyle = (color: string): CSSProperties => ({
    color,
    fontSize: '1.3rem',
    fontWeight: 'bold',
  });

  const addressStyle: CSSProperties = {
    background: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const claimBtnStyle: CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    cursor: claimableTokens > 0 ? 'pointer' : 'not-allowed',
    fontWeight: 'bold',
    fontSize: '0.88rem',
    background: claimableTokens > 0 ? '#FF9800' : '#1a1a2e',
    color: claimableTokens > 0 ? '#fff' : '#444',
    transition: 'all 0.2s',
  };

  const progressTrackStyle: CSSProperties = {
    height: '6px',
    background: '#1a1a2e',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px',
  };

  const claimedToastStyle: CSSProperties = {
    position: 'fixed',
    top: '72px',
    left: '50%',
    transform: `translateX(-50%) translateY(${showClaimed ? '0' : '-12px'})`,
    opacity: showClaimed ? 1 : 0,
    transition: 'all 0.35s ease',
    background: '#1a1a2e',
    border: '1px solid #FF980066',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#fff',
    fontSize: '0.88rem',
    fontWeight: 600,
    boxShadow: '0 8px 32px #00000088',
    zIndex: 999,
    pointerEvents: 'none',
  };

  return (
    <>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '1.2rem' }}>🪙</span>
          <span style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {TOKEN_CONFIG.name}
          </span>
          <span style={{ marginLeft: 'auto', background: '#FF980022', border: '1px solid #FF980044', borderRadius: '20px', padding: '2px 10px', color: '#FF9800', fontSize: '0.7rem' }}>
            Beta · Simulated
          </span>
        </div>

        <div style={rowStyle}>
          <div>
            <p style={labelStyle}>Token Balance</p>
            <p style={valueStyle('#FF9800')}>{balance.toLocaleString()} {TOKEN_CONFIG.symbol}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={labelStyle}>Lifetime Claimed</p>
            <p style={valueStyle('#888')}>{lifetimeClaimed.toLocaleString()} {TOKEN_CONFIG.symbol}</p>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={labelStyle}>XP toward next token</span>
            <span style={{ color: '#888', fontSize: '0.72rem' }}>
              {xpIntoCurrentToken.toLocaleString()} / {TOKEN_CONFIG.XP_PER_TOKEN.toLocaleString()} XP
            </span>
          </div>
          <div style={progressTrackStyle}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: '#FF9800',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }} />
          </div>
          {claimableTokens > 0 && (
            <p style={{ color: '#FF9800', fontSize: '0.75rem', marginTop: '2px' }}>
              🎉 {claimableTokens} token{claimableTokens > 1 ? 's' : ''} ready to claim!
            </p>
          )}
          {pendingXP > 0 && claimableTokens === 0 && (
            <p style={{ color: '#555', fontSize: '0.72rem', marginTop: '2px' }}>
              {TOKEN_CONFIG.XP_PER_TOKEN - xpIntoCurrentToken} more XP needed for next token
            </p>
          )}
        </div>

        <div style={addressStyle}>
          <div>
            <p style={{ ...labelStyle, marginBottom: '2px' }}>Token Contract</p>
            <p style={{ color: '#aaa', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              {formatAddress(TOKEN_CONFIG.contractAddress)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ ...labelStyle, marginBottom: '2px' }}>Network</p>
            <p style={{ color: '#555', fontSize: '0.7rem' }}>Elata (Beta)</p>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={claimableTokens === 0}
          style={claimBtnStyle}
        >
          {claimableTokens > 0
            ? `Claim ${claimableTokens} ${TOKEN_CONFIG.symbol} Token${claimableTokens > 1 ? 's' : ''}`
            : `Complete quizzes to earn ${TOKEN_CONFIG.symbol} tokens`}
        </button>

        <p style={{ color: '#333', fontSize: '0.7rem', textAlign: 'center', marginTop: '8px' }}>
          {TOKEN_CONFIG.XP_PER_TOKEN} XP = 1 {TOKEN_CONFIG.symbol} · On-chain redemption active at Elata launch
        </p>
      </div>

      {showClaimed && (
        <div style={claimedToastStyle}>
          🎉 {justClaimed} {TOKEN_CONFIG.symbol} token{justClaimed > 1 ? 's' : ''} claimed!
        </div>
      )}
    </>
  );
}