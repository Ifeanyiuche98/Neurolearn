// src/screens/FlashcardScreen.tsx
import type { LearningModule } from '../types';

interface FlashcardScreenProps {
  activeModule:    LearningModule;
  flashcardIndex:  number;
  cardFlipped:     boolean;
  setCardFlipped:  (v: boolean | ((prev: boolean) => boolean)) => void;
  nextFlashcard:   () => void;
  setScreen:       (s: 'lesson') => void;
}

export default function FlashcardScreen({
  activeModule, flashcardIndex, cardFlipped, setCardFlipped, nextFlashcard, setScreen,
}: FlashcardScreenProps) {
  const card2  = activeModule.flashcards[flashcardIndex];
  const isLast = flashcardIndex === activeModule.flashcards.length - 1;

  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button className="btn-ghost" onClick={() => setScreen('lesson')}>← Lesson</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeModule.color, fontSize: '0.88rem' }}>
          {activeModule.icon} Flashcards
        </span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>
          {flashcardIndex + 1}/{activeModule.flashcards.length}
        </span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '12px', textAlign: 'center' }}>
        {cardFlipped ? 'Answer revealed — ready for next?' : 'Tap the card to reveal the answer'}
      </p>

      {/* Flip card */}
      <div
        onClick={() => setCardFlipped(f => !f)}
        style={{ background: cardFlipped ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)', border: `1px solid ${cardFlipped ? 'rgba(34, 197, 94, 0.3)' : activeModule.color + '44'}`, borderRadius: 'var(--radius-xl)', padding: '40px 24px', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', marginBottom: '16px', transition: 'all 0.3s', boxShadow: cardFlipped ? '0 0 30px rgba(34,197,94,0.08)' : 'var(--shadow-card)' }}
      >
        <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
          {cardFlipped ? 'ANSWER' : 'QUESTION'}
        </p>
        <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
          {cardFlipped ? card2.back : card2.front}
        </p>
      </div>

      {/* Next button — only visible after flip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {cardFlipped && (
          <button className="btn-primary" style={{ background: activeModule.color }} onClick={nextFlashcard}>
            {isLast ? 'Take Quiz →' : 'Next Card →'}
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="progress-dots">
        {activeModule.flashcards.map((_, i) => (
          <div key={i} className={`progress-dot${i === flashcardIndex ? ' active' : i < flashcardIndex ? ' done' : ''}`} style={{ width: i === flashcardIndex ? '20px' : '6px' }} />
        ))}
      </div>
    </div>
  );
}