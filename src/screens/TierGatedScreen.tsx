// src/screens/TierGatedScreen.tsx
// Previously showed the ELTA token payment gate.
// Now shows a progress-based lock message: "complete Module X to unlock this".
// REMOVED: import TierGate, useTiers, token spend logic

import type { LearningModule } from '../types';
import type { useProgress } from '../hooks/useProgress';

interface TierGatedScreenProps {
  activeModule: LearningModule;
  moduleIndex:  number;
  progressData: ReturnType<typeof useProgress>;
  backToHome:   () => void;
}

export default function TierGatedScreen({
  activeModule, moduleIndex, progressData, backToHome,
}: TierGatedScreenProps) {
  const prereqIndex = progressData.getPrerequisite(moduleIndex);

  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <button className="btn-ghost" onClick={backToHome}>← Modules</button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '28px 20px', textAlign: 'center', marginTop: '12px' }}>

        {/* Lock icon */}
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>

        {/* Module being locked */}
        <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{activeModule.icon}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: activeModule.color, marginBottom: '6px' }}>
          {activeModule.title}
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          This module is currently locked.
        </p>

        {/* What to do */}
        {prereqIndex !== null && (
          <div style={{ background: 'rgba(32,210,155,0.06)', border: '1px solid rgba(32,210,155,0.15)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Complete the quiz in{' '}
              <strong style={{ color: '#20d29b' }}>Module {prereqIndex + 1}</strong>{' '}
              to unlock this module.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', fontSize: '0.75rem' }}>
              <span style={{ background: 'rgba(32,210,155,0.1)', border: '1px solid rgba(32,210,155,0.2)', borderRadius: '20px', padding: '3px 10px', color: '#20d29b', fontFamily: 'var(--font-mono)' }}>
                Module {prereqIndex + 1} quiz
              </span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '3px 10px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                Module {moduleIndex + 1} unlocks
              </span>
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: '100%', fontSize: '0.88rem', minHeight: '44px' }}
          onClick={backToHome}
        >
          Back to Modules
        </button>

        <p style={{ marginTop: '12px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Your XP and streak are safe — keep going!
        </p>
      </div>
    </div>
  );
}