// ─── useTokens.ts ─────────────────────────────────────────────────────────────
// Simulated ELT token wallet for NeuroLearn v3 Phase 2.
// Stores token balance in localStorage. References the real contract address
// so the UI already shows live contract details even before on-chain is live.
// One config variable swap connects this to the real chain when Elata launches.
// ─────────────────────────────────────────────────────────────────────────────
 
import { useState, useCallback } from 'react';
 
// ── Token config — real contract details, simulated balance ──────────────────
export const TOKEN_CONFIG = {
  name:              'NeuroLearn Token',
  symbol:            'ELTA',
  contractAddress:   '0x3c02fbab968542f5aeda45ed90075cb970590ede',
  ownerWallet:       '0xa65ec2f67349c8c06912cbf7b2fb9e2cf54a0b58',
  contributorWallet: '0x98bd9420e82a2ed7e7c85845120bb7c52ef81704',
  onChainAppId:      144,
  network:           'Elata Ecosystem (Beta — EVM on launch)',
  XP_PER_TOKEN:      500, // 500 XP = 1 ELT token
};
 
// ── Shape of token data saved to localStorage ─────────────────────────────────
interface TokenData {
  balance: number;        // Current ELT token balance (simulated)
  lifetimeClaimed: number;// Total tokens ever claimed
  pendingXP: number;      // XP accumulated but not yet converted to tokens
  lastClaimDate: string;  // ISO date of last claim
}
 
// ── What the hook returns ─────────────────────────────────────────────────────
export interface TokenReturn {
  balance: number;
  lifetimeClaimed: number;
  pendingXP: number;
  claimableTokens: number;     // How many full tokens can be claimed right now
  addPendingXP: (xp: number) => void; // Called after a quiz session ends
  claimTokens: () => number;   // Converts pending XP to tokens, returns amount claimed
  formatAddress: (addr: string) => string; // Shortens 0x address for display
}
 
// ── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'neurolearn_v3_tokens';
 
const DEFAULTS: TokenData = {
  balance: 0,
  lifetimeClaimed: 0,
  pendingXP: 0,
  lastClaimDate: '',
};
 
function loadData(): TokenData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
 
function saveData(data: TokenData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silent fail for private browsing
  }
}
 
// ── The hook ──────────────────────────────────────────────────────────────────
export function useTokens(): TokenReturn {
  const [data, setData] = useState<TokenData>(loadData);
 
  // How many full tokens can be claimed from pending XP right now
  const claimableTokens = Math.floor(data.pendingXP / TOKEN_CONFIG.XP_PER_TOKEN);
 
  // Called at the end of each quiz session with the XP earned
  const addPendingXP = useCallback((xp: number) => {
    setData(prev => {
      const updated = { ...prev, pendingXP: prev.pendingXP + xp };
      saveData(updated);
      return updated;
    });
  }, []);
 
  // Converts claimable pending XP into tokens, returns number of tokens claimed
  const claimTokens = useCallback((): number => {
    const tokens = Math.floor(data.pendingXP / TOKEN_CONFIG.XP_PER_TOKEN);
    if (tokens === 0) return 0;
 
    const usedXP = tokens * TOKEN_CONFIG.XP_PER_TOKEN;
    const updated: TokenData = {
      balance: data.balance + tokens,
      lifetimeClaimed: data.lifetimeClaimed + tokens,
      pendingXP: data.pendingXP - usedXP, // Leftover XP carries forward
      lastClaimDate: new Date().toISOString(),
    };
    saveData(updated);
    setData(updated);
    return tokens;
  }, [data]);
 
  // Shortens a wallet address for display: 0xa65e...0b58
  const formatAddress = useCallback((addr: string): string => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);
 
  return {
    balance: data.balance,
    lifetimeClaimed: data.lifetimeClaimed,
    pendingXP: data.pendingXP,
    claimableTokens,
    addPendingXP,
    claimTokens,
    formatAddress,
  };
}
 