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
          {page.content}
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