// ─── NeuroLearn Premium Tier System ──────────────────────────────────────────
// Manages tier state, ELTA unlock flow, and access control
// Sequential unlocking only — Free → Scholar → Expert → Pro
 
// ─── Tier Cost Config ─────────────────────────────────────────────────────────
// UPDATE THESE when Elata mainnet tokenomics are confirmed.
// This is the only place you need to change costs — everything else updates automatically.
 
export const TIER_COSTS = {
  scholar: 100,  // ELTA to unlock Scholar (placeholder — update at mainnet)
  expert:  250,  // ELTA to unlock Expert  (placeholder — update at mainnet)
  pro:     500,  // ELTA to unlock Pro      (placeholder — update at mainnet)
};
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type TierName = 'free' | 'scholar' | 'expert' | 'pro';
 
export interface Tier {
  name: TierName;
  label: string;
  description: string;
  color: string;
  unlockedModules: number;   // how many modules this tier can access (1–4)
  cost: number;              // ELTA cost to unlock (0 for free)
  features: string[];        // feature list shown in upgrade UI
}
 
export interface TierData {
  currentTier: TierName;
  tiers: Tier[];
  canAccessModule: (moduleIndex: number) => boolean;
  canUpgrade: boolean;
  nextTier: Tier | null;
  eltaNeeded: number;
  unlockNextTier: () => 'success' | 'insufficient_funds' | 'already_max';
  getTierByName: (name: TierName) => Tier;
}
 
// ─── Tier Definitions ─────────────────────────────────────────────────────────
 
export const TIERS: Tier[] = [
  {
    name: 'free',
    label: 'Free',
    description: 'Start your Web3 journey',
    color: '#7a9db0',
    unlockedModules: 1,
    cost: 0,
    features: [
      'Blockchain Basics — full access',
      'Lessons, flashcards & quiz',
      'Focus Score tracking',
      'Daily streak system',
    ],
  },
  {
    name: 'scholar',
    label: 'Scholar',
    description: 'Build real blockchain literacy',
    color: '#3d9eff',
    unlockedModules: 2,
    cost: TIER_COSTS.scholar,
    features: [
      'Everything in Free',
      'Wallets & Security — full access',
      'Extended flashcard sets',
      'Speed bonus XP multiplier',
    ],
  },
  {
    name: 'expert',
    label: 'Expert',
    description: 'Go deep into DeFi and beyond',
    color: '#a855f7',
    unlockedModules: 3,
    cost: TIER_COSTS.expert,
    features: [
      'Everything in Scholar',
      'DeFi Fundamentals — full access',
      'Hidden analytics dashboard',
      'Combo multiplier boosts',
    ],
  },
  {
    name: 'pro',
    label: 'Pro ✦',
    description: 'Full access. Full focus. Full leaderboard.',
    color: '#20d29b',
    unlockedModules: 4,
    cost: TIER_COSTS.pro,
    features: [
      'Everything in Expert',
      'NFTs & Tokens — full access',
      'Global leaderboard access',
      'All future modules included',
    ],
  },
];
 
// ─── localStorage key ─────────────────────────────────────────────────────────
 
const TIER_KEY = 'neurolearn_tier';
 
// ─── Helper ───────────────────────────────────────────────────────────────────
 
function getTierIndex(name: TierName): number {
  return TIERS.findIndex(t => t.name === name);
}
 
// ─── Hook ─────────────────────────────────────────────────────────────────────
 
import { useState } from 'react';
 
export function useTiers(currentBalance: number, spendTokens: (amount: number) => boolean): TierData {
 
  const [currentTier, setCurrentTier] = useState<TierName>(() => {
    const stored = localStorage.getItem(TIER_KEY) as TierName | null;
    return stored && TIERS.find(t => t.name === stored) ? stored : 'free';
  });
 
  const currentIndex = getTierIndex(currentTier);
  const isMaxTier    = currentIndex === TIERS.length - 1;
  const nextTier     = isMaxTier ? null : TIERS[currentIndex + 1];
  const eltaNeeded   = nextTier ? Math.max(0, nextTier.cost - currentBalance) : 0;
  const canUpgrade   = !isMaxTier && nextTier !== null && currentBalance >= nextTier.cost;
 
  const canAccessModule = (moduleIndex: number): boolean => {
    // moduleIndex is 0-based (0 = Blockchain, 1 = Wallets, 2 = DeFi, 3 = NFTs)
    const tierDef = TIERS[currentIndex];
    return moduleIndex < tierDef.unlockedModules;
  };
 
  const unlockNextTier = (): 'success' | 'insufficient_funds' | 'already_max' => {
    if (isMaxTier) return 'already_max';
    if (!nextTier)  return 'already_max';
    if (currentBalance < nextTier.cost) return 'insufficient_funds';
 
    const spent = spendTokens(nextTier.cost);
    if (!spent) return 'insufficient_funds';
 
    const newTier = nextTier.name;
    localStorage.setItem(TIER_KEY, newTier);
    setCurrentTier(newTier);
    return 'success';
  };
 
  const getTierByName = (name: TierName): Tier => {
    return TIERS.find(t => t.name === name) ?? TIERS[0];
  };
 
  return {
    currentTier,
    tiers: TIERS,
    canAccessModule,
    canUpgrade,
    nextTier,
    eltaNeeded,
    unlockNextTier,
    getTierByName,
  };
}
 