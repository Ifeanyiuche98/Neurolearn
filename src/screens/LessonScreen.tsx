// src/screens/LessonScreen.tsx
import type { CSSProperties } from 'react';
import type { LearningModule } from '../types';

interface LessonScreenProps {
  activeModule:   LearningModule;
  lessonPage:     number;
  setLessonPage:  (n: number | ((prev: number) => number)) => void;
  goToFlashcards: () => void;
  backToHome:     () => void;
}

const card = (accent = 'rgba(255,255,255,0.06)'): CSSProperties => ({
  background: 'var(--bg-card)',
  border: `1px solid ${accent}`,
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
});

/**
 * Turns simple **bold** markdown syntax into real <strong> elements.
 * Everything else in the text is left exactly as-is, so normal line breaks
 * (handled by whiteSpace: 'pre-line' on the parent) still work fine.
 */
function renderWithBold(text: string) {
  // Split the string on **bold** markers, keeping the markers in the array
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2); // strip the ** on both sides
      return (
        <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {boldText}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function LessonScreen({
  activeModule, lessonPage, setLessonPage, goToFlashcards, backToHome,
}: LessonScreenProps) {
  const page   = activeModule.lesson[lessonPage];
  const isLast = lessonPage === activeModule.lesson.length - 1;

  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button className="btn-ghost" onClick={backToHome}>← Modules</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeModule.color, fontSize: '0.88rem' }}>
          {activeModule.icon} {activeModule.title}
        </span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>
          {lessonPage + 1}/{activeModule.lesson.length}
        </span>
      </div>

      {/* Lesson content */}
      <div style={{ ...card(`${activeModule.color}33`), borderLeft: `3px solid ${activeModule.color}`, maxHeight: '55vh', overflowY: 'auto', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
          {page.title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: '0.88rem', whiteSpace: 'pre-line' }}>
          {renderWithBold(page.content)}
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {lessonPage > 0
          ? <button className="btn-secondary" onClick={() => setLessonPage(p => p - 1)}>Previous</button>
          : <div />}
        <div style={{ flex: 1 }} />
        {!isLast
          ? <button className="btn-primary" style={{ background: activeModule.color }} onClick={() => setLessonPage(p => p + 1)}>Next</button>
          : <button className="btn-primary" style={{ background: activeModule.color }} onClick={goToFlashcards}>Flashcards →</button>}
      </div>

      {/* Progress dots */}
      <div className="progress-dots" style={{ marginTop: '16px' }}>
        {activeModule.lesson.map((_, i) => (
          <div key={i} className={`progress-dot${i === lessonPage ? ' active' : i < lessonPage ? ' done' : ''}`} style={{ width: i === lessonPage ? '20px' : '6px' }} />
        ))}
      </div>
    </div>
  );
}
