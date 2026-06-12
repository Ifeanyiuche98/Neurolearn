// src/screens/QuizScreen.tsx
import type { CSSProperties } from 'react';
import type { LearningModule } from '../types';
import { useQuizTimer }        from '../useQuizTimer';

interface QuizScreenProps {
  activeModule:   LearningModule;
  quizIndex:      number;
  selectedAnswer: number | null;
  lastQuestionXP: number;
  quizTimer:      ReturnType<typeof useQuizTimer>;
  handleAnswer:   (idx: number) => void;
  nextQuestion:   () => void;
  setScreen:      (s: 'flashcard') => void;
}

const card = (accent = 'rgba(255,255,255,0.06)'): CSSProperties => ({
  background: 'var(--bg-card)',
  border: `1px solid ${accent}`,
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
});

const pill = (bg: string, color: string): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: bg, color,
  borderRadius: 'var(--radius-pill)',
  padding: '3px 12px',
  fontSize: '0.72rem', fontWeight: 600,
  whiteSpace: 'nowrap' as const,
  border: `1px solid ${color}44`,
});

export default function QuizScreen({
  activeModule, quizIndex, selectedAnswer, lastQuestionXP,
  quizTimer, handleAnswer, nextQuestion, setScreen,
}: QuizScreenProps) {
  const q        = activeModule.quiz[quizIndex];
  const answered = selectedAnswer !== null;
  const isUrgent  = quizTimer.timeLeft <= 5  && !answered;
  const isWarning = quizTimer.timeLeft <= 10 && !answered;

  const RADIUS         = 28;
  const CIRCUMFERENCE  = 2 * Math.PI * RADIUS;
  const strokeDashoffset = answered ? 0 : CIRCUMFERENCE * (1 - quizTimer.timerPercent / 100);
  const circleColor    = answered ? '#22c55e' : quizTimer.timerColor;

  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <button className="btn-ghost" onClick={() => setScreen('flashcard')}>← Flashcards</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeModule.color, fontSize: '0.88rem' }}>
          {activeModule.icon} Quiz
        </span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>
          Q{quizIndex + 1}/{activeModule.quiz.length}
        </span>
      </div>

      {/* Timer bar */}
      <div style={{ background: 'var(--bg-card)', border: `1px solid ${answered ? 'rgba(34,197,94,0.25)' : isUrgent ? 'rgba(239,68,68,0.4)' : isWarning ? 'rgba(245,158,11,0.3)' : 'var(--pulse-border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color 0.3s', boxShadow: isUrgent ? '0 0 20px rgba(239,68,68,0.1)' : 'var(--shadow-card)' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {isUrgent && (
            <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2px solid rgba(239,68,68,0.5)', animation: 'pulse 0.8s ease-in-out infinite' }} />
          )}
          <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="var(--bg-surface)" strokeWidth="6" />
            <circle cx="36" cy="36" r={RADIUS} fill="none" stroke={circleColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: answered ? '1.4rem' : '1.2rem', fontWeight: 800, color: circleColor }}>
            {answered ? '✓' : quizTimer.timeLeft}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: answered ? '#22c55e' : isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#00e5cc' }}>
              {answered ? '✅ Answered' : isUrgent ? '⚡ Hurry up!' : isWarning ? '⏳ Running low...' : '🕐 Time remaining'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {answered ? 'Next →' : `${quizTimer.timeLeft}s`}
            </span>
          </div>
          <div style={{ height: '12px', background: 'var(--bg-surface)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ height: '100%', width: `${answered ? 100 : quizTimer.timerPercent}%`, background: answered ? '#22c55e' : isUrgent ? 'linear-gradient(90deg,#ef4444,#ff6b6b)' : isWarning ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#00e5cc,#3d9eff)', borderRadius: '6px', transition: 'width 0.9s linear, background 0.3s' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {quizTimer.comboCount > 1 && <span style={pill('rgba(245,158,11,0.1)', '#f59e0b')}>🔗 {quizTimer.comboCount}x Combo</span>}
            {lastQuestionXP > 0 && answered && <span style={pill('rgba(0,229,204,0.1)', '#00e5cc')}>+{lastQuestionXP} XP</span>}
            {!answered && quizTimer.comboCount > 0 && <span style={{ ...pill('rgba(34,197,94,0.06)', '#22c55e88'), border: 'none' }}>{quizTimer.comboCount} in a row</span>}
          </div>
        </div>
      </div>

      {/* Time expired notice */}
      {selectedAnswer === -1 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#ef4444', fontSize: '0.82rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏱</span>
          <span>Time's up! The correct answer is highlighted below.</span>
        </div>
      )}

      {/* Question + options */}
      <div style={{ ...card(), marginBottom: '14px' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '18px', fontWeight: 500 }}>
          {q.question}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {q.options.map((opt, idx) => {
            let bg     = 'var(--bg-input)';
            let border = 'rgba(255,255,255,0.06)';
            let color  = 'var(--text-secondary)';
            if (answered) {
              if (idx === q.correct)                               { bg = 'rgba(34,197,94,0.08)';  border = 'rgba(34,197,94,0.4)';  color = '#22c55e'; }
              else if (idx === selectedAnswer && selectedAnswer !== -1) { bg = 'rgba(239,68,68,0.08)'; border = 'rgba(239,68,68,0.35)'; color = '#ef4444'; }
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', padding: '13px 16px', color, cursor: answered ? 'default' : 'pointer', textAlign: 'left', fontSize: '0.88rem', transition: 'all 0.2s', fontFamily: 'var(--font-body)', minHeight: '48px' }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginRight: '10px', opacity: 0.5 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next button */}
      {answered && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" style={{ background: activeModule.color, color: '#020408' }} onClick={nextQuestion}>
            {quizIndex < activeModule.quiz.length - 1 ? 'Next Question →' : 'See Results 🎉'}
          </button>
        </div>
      )}

      {/* Progress dots */}
      <div className="progress-dots">
        {activeModule.quiz.map((_, i) => (
          <div key={i} className={`progress-dot${i === quizIndex ? ' active' : i < quizIndex ? ' done' : ''}`} style={{ width: i === quizIndex ? '20px' : '6px' }} />
        ))}
      </div>

      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.2);opacity:.3}}`}</style>
    </div>
  );
}