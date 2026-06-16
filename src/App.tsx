// src/App.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createRppgSession,
  type Metrics,
  type RppgSession,
  type RppgSessionDiagnostics,
} from '@elata-biosciences/rppg-web';
import rppgWasmJsUrl     from '@elata-biosciences/rppg-web/pkg/rppg_wasm.js?url';
import rppgWasmBinaryUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm_bg.wasm?url';

// ── v3 imports ────────────────────────────────────────────────────────────────
import { useStreak }      from './useStreak';
import { useQuizTimer }   from './useQuizTimer';
import { useProgress }    from './hooks/useProgress';   // ← REPLACES useTokens + useTiers
import { useLeaderboard } from './useLeaderboard';
import StreakBar           from './StreakBar';
import Leaderboard         from './Leaderboard';
import Analytics           from './Analytics';
import BpmIndicator        from './BpmIndicator';
import Onboarding, { useOnboarding } from './Onboarding';
// REMOVED: import { useTokens } from './useTokens';
// REMOVED: import { useTiers }  from './useTiers';
// REMOVED: import TokenWallet   from './TokenWallet';

// ── Supabase username ─────────────────────────────────────────────────────────
import { useUsername }    from './useUsername';
import UsernamePrompt     from './UsernamePrompt';

// ── Cheat detection ───────────────────────────────────────────────────────────
import { useBpmGuard }          from './hooks/useBpmGuard';
import { logSuspiciousSession } from './lib/logSuspiciousSession';

// ── Screen components ─────────────────────────────────────────────────────────
import HomeScreen       from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import FlashcardScreen  from './screens/FlashcardScreen';
import QuizScreen       from './screens/QuizScreen';
import ResultsScreen    from './screens/ResultsScreen';
import TierGatedScreen  from './screens/TierGatedScreen';

// ── Types ─────────────────────────────────────────────────────────────────────
import type { Screen, LearningModule } from './types';
import { MODULES } from './modules';

// ─── Helper Functions ─────────────────────────────────────────────────────────
const EMPTY_METRICS: Metrics = { bpm: null, confidence: 0, signal_quality: 0 };

function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}
function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
function getFocusState(bpm: number | null | undefined) {
  if (bpm == null) return { label: 'Warming up...', message: 'Stay still and face the camera to begin.',            color: '#7a9db0' };
  if (bpm < 65)    return { label: 'Very Calm',      message: 'You are very relaxed. Great state for absorbing new knowledge!', color: '#22c55e' };
  if (bpm < 80)    return { label: 'Focused',        message: 'Optimal focus zone! Keep learning — you are in the zone.',      color: '#00e5cc' };
  if (bpm < 95)    return { label: 'Elevated',       message: 'Slightly elevated. Take a slow breath and continue.',           color: '#f59e0b' };
  return                 { label: 'Stressed',        message: 'High stress detected. Consider a short break before continuing.', color: '#ef4444' };
}
function getStatusMessage(diagnostics: RppgSessionDiagnostics | null): string {
  if (!diagnostics) return 'Starting session…';
  if (diagnostics.lastError) return diagnostics.lastError.message;
  if (diagnostics.backendMode !== 'wasm') return 'WASM backend not active.';
  if (diagnostics.issues.includes('no_samples_yet') || diagnostics.issues.includes('insufficient_window'))
    return 'Warming up — hold still, face the camera.';
  return 'Monitoring your focus…';
}
function getStatusTone(diagnostics: RppgSessionDiagnostics | null): 'live' | 'warn' | 'error' {
  if (diagnostics?.lastError) return 'error';
  if (!diagnostics || diagnostics.backendMode !== 'wasm' || !diagnostics.estimationAvailable) return 'warn';
  return 'live';
}
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function getFocusScore(avgBpm: number | null) {
  if (avgBpm == null) return { score: 0,  label: 'No data collected',   color: '#7a9db0' };
  if (avgBpm < 65)    return { score: 98, label: 'Exceptional Focus',   color: '#22c55e' };
  if (avgBpm < 75)    return { score: 90, label: 'Strong Focus',        color: '#22c55e' };
  if (avgBpm < 85)    return { score: 78, label: 'Good Focus',          color: '#00e5cc' };
  if (avgBpm < 95)    return { score: 62, label: 'Moderate Focus',      color: '#f59e0b' };
  return                   { score: 45, label: 'High Stress Detected', color: '#ef4444' };
}

// ─── App Component ────────────────────────────────────────────────────────────
export default function App() {

  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { username, showPrompt, submitUsername } = useUsername();

  const streakData      = useStreak();
  const quizTimer       = useQuizTimer();
  const progressData    = useProgress();        // ← REPLACES tokenData + tierData
  const leaderboardData = useLeaderboard();
  const [lastQuestionXP, setLastQuestionXP] = useState(0);

  // ── Logo tap easter egg ───────────────────────────────────────────────────
  const [logoTaps, setLogoTaps] = useState(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = () => {
    const next = logoTaps + 1;
    if (next >= 5) { setLogoTaps(0); setScreen('analytics'); return; }
    setLogoTaps(next);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => setLogoTaps(0), 3000);
  };

  // ── rPPG state ────────────────────────────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const sessionRef  = useRef<RppgSession | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [status, setStatus]           = useState('Requesting camera…');
  const [metrics, setMetrics]         = useState<Metrics>(EMPTY_METRICS);
  const [diagnostics, setDiagnostics] = useState<RppgSessionDiagnostics | null>(null);
  const [sessionActive, setSessionActive]   = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<{ duration: number; avgBpm: number | null } | null>(null);
  const bpmReadingsRef = useRef<number[]>([]);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Screen / module state ─────────────────────────────────────────────────
  const [screen, setScreen]               = useState<Screen>('home');
  const [activeModule, setActiveModule]   = useState<LearningModule | null>(null);
  const [lessonPage, setLessonPage]       = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [cardFlipped, setCardFlipped]     = useState(false);
  const [quizIndex, setQuizIndex]         = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore]         = useState(0);

  // ── rPPG sync ─────────────────────────────────────────────────────────────
  const syncFromSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const d = session.getDiagnostics();
    const m = session.getMetrics();
    setMetrics(m); setDiagnostics(d); setStatus(getStatusMessage(d));
    if (m.bpm != null) bpmReadingsRef.current.push(m.bpm);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    async function init() {
      const video = videoRef.current;
      if (!video) return;
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
        });
      } catch { setStatus('Camera unavailable — allow access and reload.'); return; }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      const sampleRate = stream.getVideoTracks()[0]?.getSettings().frameRate ?? 30;
      setStatus('Starting rPPG…');
      try {
        const session = await createRppgSession({
          video, sampleRate, backend: 'auto', faceMesh: 'auto',
          wasmJsUrl: rppgWasmJsUrl, wasmBinaryUrl: rppgWasmBinaryUrl,
          enableTracker: { minBpm: 55, maxBpm: 150, numParticles: 200 },
          roiSmoothingAlpha: 0.25, useSkinMask: true,
          onDiagnostics: () => syncFromSession(),
          onError: error => setStatus(error.message),
        });
        if (cancelled) { await session.dispose(); return; }
        sessionRef.current = session;
        syncFromSession();
        intervalId = setInterval(syncFromSession, 400);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Could not start the rPPG session.');
      }
    }
    void init();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (sessionRef.current) { void sessionRef.current.dispose(); sessionRef.current = null; }
      if (streamRef.current)  { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [syncFromSession]);

  // ── Session control ───────────────────────────────────────────────────────
  const startSession = () => {
    bpmReadingsRef.current = [];
    setSessionSeconds(0); setSessionSummary(null); setSessionActive(true);
    timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
  };

  // ── Derived signal values ─────────────────────────────────────────────────
  const statusTone     = getStatusTone(diagnostics);
  const readinessLabel = diagnostics?.estimationAvailable && metrics.bpm != null ? 'Ready' : 'Warm-up';
  const confidencePct  = Math.round(clamp01(metrics.confidence) * 100);
  const qualityPct     = Math.round(clamp01(metrics.signal_quality) * 100);
  const focusState     = getFocusState(metrics.bpm);

  // ── Cheat detection ───────────────────────────────────────────────────────
  const guard = useBpmGuard(metrics.bpm, confidencePct, sessionSeconds);

  const qualityHistoryRef = useRef<number[]>([]);
  if (qualityPct > 0) {
    qualityHistoryRef.current.push(qualityPct);
    if (qualityHistoryRef.current.length > 60) qualityHistoryRef.current.shift();
  }
  const avgQuality = qualityHistoryRef.current.length > 0
    ? Math.round(qualityHistoryRef.current.reduce((a, b) => a + b, 0) / qualityHistoryRef.current.length)
    : 0;

  const hasLoggedHighRef = useRef(false);
  useEffect(() => {
    if (!sessionActive && hasLoggedHighRef.current) { hasLoggedHighRef.current = false; return; }
    if (guard.suspicionLevel === 'high' && !hasLoggedHighRef.current) {
      hasLoggedHighRef.current = true;
      void logSuspiciousSession({ username: username ?? 'anonymous', country: '', deviceType: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop', sessionSeconds, moduleTitle: activeModule?.title ?? 'unknown', quizScore: activeModule ? Math.round((quizScore / activeModule.quiz.length) * 100) : 0, guard, avgConfidence: confidencePct, avgQuality });
    }
  }, [guard.suspicionLevel, sessionActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSession = (mod: LearningModule | null, score: number, sessionXP: number, focusScoreValue: number) => {
    setSessionActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const readings = bpmReadingsRef.current;
    const avgBpm   = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
    setSessionSummary({ duration: sessionSeconds, avgBpm });
    if (mod) {
      const quizPct = Math.round((score / mod.quiz.length) * 100);
      // REMOVED: tokenData.addPendingXP(sessionXP)  — no more token conversion
      leaderboardData.addEntry({ moduleTitle: mod.title, moduleIcon: mod.icon, quizScore: quizPct, focusScore: focusScoreValue, xpEarned: sessionXP, streak: streakData.streak });
    }
    if (guard.suspicionLevel !== 'none') {
      void logSuspiciousSession({ username: username ?? 'anonymous', country: '', deviceType: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop', sessionSeconds, moduleTitle: mod?.title ?? 'unknown', quizScore: mod ? Math.round((score / mod.quiz.length) * 100) : 0, guard, avgConfidence: confidencePct, avgQuality });
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const startModule = (mod: LearningModule, moduleIndex: number) => {
    // CHANGED: was tierData.canAccessModule — now uses progressData.canAccessModule
    if (!progressData.canAccessModule(moduleIndex)) {
      setActiveModule(mod);
      setScreen('tiergated');
      return;
    }
    setActiveModule(mod); setLessonPage(0); setFlashcardIndex(0);
    setCardFlipped(false); setQuizIndex(0); setSelectedAnswer(null); setQuizScore(0);
    setScreen('lesson');
    if (!sessionActive) startSession();
  };

  const goToFlashcards = () => { setFlashcardIndex(0); setCardFlipped(false); setScreen('flashcard'); };

  const nextFlashcard = () => {
    if (!activeModule) return;
    if (flashcardIndex < activeModule.flashcards.length - 1) {
      setFlashcardIndex(i => i + 1); setCardFlipped(false);
    } else { quizTimer.resetQuiz(); setScreen('quiz'); }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    quizTimer.stopTimer();
    const isCorrect = activeModule !== null && idx === activeModule.quiz[quizIndex].correct;
    if (isCorrect) setQuizScore(s => s + 1);
    const rawXP    = quizTimer.calcXP(isCorrect);
    const actualXP = streakData.addXP(rawXP);
    setLastQuestionXP(actualXP);
    setSelectedAnswer(idx);
  };

  const nextQuestion = () => {
    if (!activeModule) return;
    if (quizIndex < activeModule.quiz.length - 1) {
      setQuizIndex(i => i + 1); setSelectedAnswer(null); setLastQuestionXP(0); quizTimer.startTimer();
    } else {
      const readings = bpmReadingsRef.current;
      const avgBpm   = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
      const fs       = getFocusScore(avgBpm);
      const finalScore = quizScore + (activeModule && selectedAnswer === activeModule.quiz[quizIndex].correct ? 1 : 0);
      const moduleIndex = MODULES.findIndex(m => m.id === activeModule.id);
      // ADDED: mark module completed so next one unlocks
      progressData.markCompleted(moduleIndex);
      stopSession(activeModule, finalScore, quizTimer.totalQuizXP, fs.score);
      setScreen('results');
    }
  };

  const backToHome = () => { setScreen('home'); setActiveModule(null); setSessionSummary(null); quizTimer.resetQuiz(); };

  // ── Quiz timer effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'quiz' && selectedAnswer === null) quizTimer.startTimer();
  }, [screen, quizIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (quizTimer.timeExpired && selectedAnswer === null) { setSelectedAnswer(-1); setLastQuestionXP(0); }
  }, [quizTimer.timeExpired, selectedAnswer]);

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="app">
      {showPrompt    && <UsernamePrompt onSubmit={submitUsername} />}
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

      <header className="topbar">
        <div className="brand" onClick={handleLogoTap} style={{ cursor: 'pointer' }}>
          <span className="brand-mark" />
          <span className="brand-name">NeuroLearn</span>
          {logoTaps > 0 && logoTaps < 5 && (
            <span style={{ fontSize: '0.55rem', color: 'var(--pulse-border)', marginLeft: '4px' }}>
              {'●'.repeat(logoTaps)}{'○'.repeat(5 - logoTaps)}
            </span>
          )}
        </div>
        <span className="topbar-sep" />
        <span className="topbar-tagline">Web3 Learning · Focus Tracker</span>
        <div className="topbar-spacer" />
        {/* CHANGED: removed tier chip, replaced with cleaner progress chip */}
        <div className={`session-chip session-chip--${statusTone}`}>
          <span className={`status-dot${statusTone === 'error' ? ' error' : statusTone === 'warn' ? ' warn' : ''}`} />
          <span className="session-chip-text">{status}</span>
        </div>
      </header>

      <main className="main">
        <section className="stage">
          <h1 className="visually-hidden">NeuroLearn Focus Session</h1>
          <div style={{ display: 'block' }} className="stage-content">
            <BpmIndicator
              metrics={metrics} diagnostics={diagnostics}
              sessionSeconds={sessionSeconds} sessionActive={sessionActive}
              onStartSession={startSession} onStopSession={() => stopSession(null, 0, 0, 0)}
              videoRef={videoRef} confidencePct={confidencePct}
              qualityPct={qualityPct} focusState={focusState}
              readinessLabel={readinessLabel}
            />
            <StreakBar streakData={streakData} />
            {/* REMOVED: <TokenWallet tokenData={tokenData} /> */}

            {screen === 'home' && (
              <HomeScreen
                modules={MODULES}
                progressData={progressData}
                streakData={streakData}
                leaderboardData={leaderboardData}
                username={username}
                startModule={startModule}
                setScreen={setScreen}
              />
            )}
            {screen === 'lesson' && activeModule && (
              <LessonScreen
                activeModule={activeModule} lessonPage={lessonPage}
                setLessonPage={setLessonPage} goToFlashcards={goToFlashcards}
                backToHome={backToHome}
              />
            )}
            {screen === 'flashcard' && activeModule && (
              <FlashcardScreen
                activeModule={activeModule} flashcardIndex={flashcardIndex}
                cardFlipped={cardFlipped} setCardFlipped={setCardFlipped}
                nextFlashcard={nextFlashcard} setScreen={setScreen}
              />
            )}
            {screen === 'quiz' && activeModule && (
              <QuizScreen
                activeModule={activeModule} quizIndex={quizIndex}
                selectedAnswer={selectedAnswer} lastQuestionXP={lastQuestionXP}
                quizTimer={quizTimer} handleAnswer={handleAnswer}
                nextQuestion={nextQuestion} setScreen={setScreen}
              />
            )}
            {screen === 'results' && activeModule && (
              <ResultsScreen
                activeModule={activeModule} quizScore={quizScore}
                sessionSummary={sessionSummary} streakData={streakData}
                totalQuizXP={quizTimer.totalQuizXP}
                backToHome={backToHome} setScreen={setScreen}
                // REMOVED: tokenData prop — ResultsScreen no longer needs it
              />
            )}
            {screen === 'leaderboard' && (
              <Leaderboard leaderboardData={leaderboardData} onBack={backToHome} />
            )}
            {screen === 'analytics' && (
              <Analytics onBack={backToHome} />
            )}
            {screen === 'tiergated' && activeModule && (
              <TierGatedScreen
                activeModule={activeModule}
                moduleIndex={MODULES.findIndex(m => m.id === activeModule.id)}
                progressData={progressData}
                backToHome={backToHome}
              />
            )}
          </div>

          <aside className="readouts">
            <div>
              <div className="video-chrome">
                <video ref={videoRef} autoPlay muted playsInline className="stage-video" />
                <div className="video-label"><span className="video-label-dot" />Live input</div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '6px', textAlign: 'center' }}>
                Face the light · fill the frame · stay steady
              </p>
            </div>
            <div className="bpm-block">
              <p className="bpm-label">Heart Rate</p>
              <div className="bpm-value-row">
                <span className="bpm-number">{metrics.bpm != null ? formatMetric(metrics.bpm, 0) : '—'}</span>
                <span className="bpm-unit">BPM</span>
              </div>
              <p className="bpm-sub">{readinessLabel}</p>
            </div>
            <div style={{ background: `${focusState.color}0f`, border: `1px solid ${focusState.color}33`, borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <p style={{ color: focusState.color, fontWeight: 700, fontSize: '0.82rem', marginBottom: '3px' }}>{focusState.label}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5 }}>{focusState.message}</p>
            </div>
            <div className="meter-group">
              <div className="meter">
                <div className="meter-head"><span>Confidence</span><span className="meter-pct">{confidencePct}%</span></div>
                <div className="meter-track"><div className="meter-fill meter-fill--confidence" style={{ width: `${confidencePct}%` }} /></div>
              </div>
              <div className="meter">
                <div className="meter-head"><span>Signal quality</span><span className="meter-pct">{qualityPct}%</span></div>
                <div className="meter-track"><div className="meter-fill meter-fill--quality" style={{ width: `${qualityPct}%` }} /></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>SESSION TIME</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>{formatTime(sessionSeconds)}</p>
              {!sessionActive
                ? <button className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '8px 16px', minHeight: '36px' }} onClick={startSession}>Start Session</button>
                : <button style={{ width: '100%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-body)', minHeight: '36px' }} onClick={() => stopSession(null, 0, 0, 0)}>End Session</button>}
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        NeuroLearn v3 · Powered by Elata rPPG · Built for Everyone
      </footer>
    </div>
  );
}