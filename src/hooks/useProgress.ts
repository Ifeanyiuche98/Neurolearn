// src/hooks/useProgress.ts
// Replaces useTiers.ts and the ELTA unlock system entirely.
// Progress-based unlocking: complete a module's quiz → next module opens.
// All data stored in localStorage — no tokens, no backend needed.

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'neurolearn_completed_modules';

// Which module must be completed before each module unlocks.
// null means always unlocked (Module 1).
// Keys are moduleIndex (0-based, matching how modules are used in App.tsx).
const PREREQUISITES: Record<number, number | null> = {
  0: null, // Blockchain Basics — always open
  1: 0,    // Wallets & Security — needs Module 0 done
  2: 1,    // DeFi Fundamentals — needs Module 1 done
  3: 2,    // NFTs & Tokens — needs Module 2 done
  4: 3,    // Trading & Careers — needs Module 3 done
  5: 4,    // AI x Crypto — needs Module 4 done
};

function loadCompleted(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveCompleted(completed: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed)));
}

export function useProgress() {
  const [completed, setCompleted] = useState<Set<number>>(loadCompleted);

  // Call this when a quiz finishes — pass the 0-based module index
  const markCompleted = useCallback((moduleIndex: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(moduleIndex);
      saveCompleted(next);
      return next;
    });
  }, []);

  // Returns true if the module is available to start
  const canAccessModule = useCallback((moduleIndex: number): boolean => {
    const prereq = PREREQUISITES[moduleIndex];
    if (prereq === null) return true;
    return completed.has(prereq);
  }, [completed]);

  // Returns true if the module quiz has been finished
  const isCompleted = useCallback((moduleIndex: number): boolean => {
    return completed.has(moduleIndex);
  }, [completed]);

  // Returns the prerequisite module index, or null if none
  const getPrerequisite = useCallback((moduleIndex: number): number | null => {
    return PREREQUISITES[moduleIndex] ?? null;
  }, []);

  // How many modules are done (for a progress bar)
  const completedCount = completed.size;

  return { canAccessModule, isCompleted, markCompleted, getPrerequisite, completedCount };
}