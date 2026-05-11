import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createRppgSession,
  type Metrics,
  type RppgSession,
  type RppgSessionDiagnostics,
} from '@elata-biosciences/rppg-web';
import rppgWasmJsUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm.js?url';
import rppgWasmBinaryUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm_bg.wasm?url';

const EMPTY_METRICS: Metrics = {
  bpm: null,
  confidence: 0,
  signal_quality: 0,
};

function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function getFocusState(bpm: number | null | undefined): { label: string; message: string; color: string } {
  if (bpm == null) return { label: 'Warming up...', message: 'Stay still and face the camera to begin.', color: '#888' };
  if (bpm < 65) return { label: '😌 Very Calm', message: 'You are very relaxed. Great state for absorbing new knowledge!', color: '#4CAF50' };
  if (bpm < 80) return { label: '🎯 Focused', message: 'Optimal focus zone! Keep learning — you are in the zone.', color: '#2196F3' };
  if (bpm < 95) return { label: '⚡ Elevated', message: 'Slightly elevated. Take a slow breath and continue.', color: '#FF9800' };
  return { label: '🔥 Stressed', message: 'High stress detected. Consider a short break before continuing.', color: '#F44336' };
}

function getStatusMessage(diagnostics: RppgSessionDiagnostics | null): string {
  if (!diagnostics) return 'Starting session…';
  if (diagnostics.lastError) return diagnostics.lastError.message;
  if (diagnostics.backendMode !== 'wasm') return 'WASM backend not active.';
  if (diagnostics.issues.includes('no_samples_yet') || diagnostics.issues.includes('insufficient_window')) {
    return 'Warming up — hold still, face the camera.';
  }
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

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<RppgSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState('Requesting camera…');
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [diagnostics, setDiagnostics] = useState<RppgSessionDiagnostics | null>(null);

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<{ duration: number; avgBpm: number | null } | null>(null);
  const bpmReadingsRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncFromSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const nextDiagnostics = session.getDiagnostics();
    const nextMetrics = session.getMetrics();
    setMetrics(nextMetrics);
    setDiagnostics(nextDiagnostics);
    setStatus(getStatusMessage(nextDiagnostics));
    if (nextMetrics.bpm != null) {
      bpmReadingsRef.current.push(nextMetrics.bpm);
    }
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
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        setStatus('Camera unavailable — allow access and reload.');
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const sampleRate = stream.getVideoTracks()[0]?.getSettings().frameRate ?? 30;
      setStatus('Starting rPPG…');

      try {
        const session = await createRppgSession({
          video,
          sampleRate,
          backend: 'auto',
          faceMesh: 'auto',
          wasmJsUrl: rppgWasmJsUrl,
          wasmBinaryUrl: rppgWasmBinaryUrl,
          enableTracker: { minBpm: 55, maxBpm: 150, numParticles: 200 },
          roiSmoothingAlpha: 0.25,
          useSkinMask: true,
          onDiagnostics: () => { syncFromSession(); },
          onError: (error) => { setStatus(error.message); },
        });

        if (cancelled) {
          await session.dispose();
          return;
        }

        sessionRef.current = session;
        syncFromSession();
        intervalId = setInterval(syncFromSession, 400);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not start the rPPG session.';
        setStatus(message);
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (sessionRef.current) {
        void sessionRef.current.dispose();
        sessionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [syncFromSession]);

  const startSession = () => {
    bpmReadingsRef.current = [];
    setSessionSeconds(0);
    setSessionSummary(null);
    setSessionActive(true);
    timerRef.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
  };

  const stopSession = () => {
    setSessionActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const readings = bpmReadingsRef.current;
    const avgBpm = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
    setSessionSummary({ duration: sessionSeconds, avgBpm });
  };

  const statusTone = getStatusTone(diagnostics);
  const readinessLabel = diagnostics?.estimationAvailable && metrics.bpm != null ? 'Ready' : 'Warm-up';
  const confidencePct = Math.round(clamp01(metrics.confidence) * 100);
  const qualityPct = Math.round(clamp01(metrics.signal_quality) * 100);
  const focusState = getFocusState(metrics.bpm);

  return (
    <div className="app">
      <header className="topbar" aria-label="Application header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">NeuroLearn</span>
        </div>
        <span className="topbar-sep" aria-hidden="true" />
        <span className="topbar-tagline">Web3 Learning Focus Tracker</span>
        <div className="topbar-spacer" />
        <div className={`session-chip session-chip--${statusTone}`}>
          <span className={`status-dot${statusTone === 'error' ? ' error' : statusTone === 'warn' ? ' warn' : ''}`} aria-hidden="true" />
          <span className="session-chip-text">{status}</span>
        </div>
      </header>

      <main className="main">
        <section className="stage" aria-labelledby="stage-heading">
          <h1 id="stage-heading" className="visually-hidden">NeuroLearn Focus Session</h1>

          <div className="stage-video-wrap">
            <div className="video-chrome">
              <div className="video-chrome-corners" aria-hidden="true" />
              <video ref={videoRef} autoPlay muted playsInline className="stage-video" />
              <div className="video-label">
                <span className="video-label-dot" aria-hidden="true" />
                Live input
              </div>
            </div>
            <p className="stage-hint">
              Face the light, fill the frame, and stay steady for best results.
            </p>
          </div>

          <aside className="readouts" aria-label="Focus metrics">
            <div className="bpm-block">
              <p className="bpm-label">Heart Rate</p>
              <div className="bpm-value-row">
                <span className="bpm-number">
                  {metrics.bpm != null ? formatMetric(metrics.bpm, 0) : '—'}
                </span>
                <span className="bpm-unit">BPM</span>
              </div>
              <p className="bpm-sub">{readinessLabel}</p>
            </div>

            <div style={{ padding: '12px', background: '#1a1a2e', borderRadius: '8px', marginBottom: '12px', borderLeft: `4px solid ${focusState.color}` }}>
              <p style={{ color: focusState.color, fontWeight: 'bold', marginBottom: '4px' }}>{focusState.label}</p>
              <p style={{ color: '#ccc', fontSize: '0.85rem' }}>{focusState.message}</p>
            </div>

            <div className="meter-group">
              <div className="meter">
                <div className="meter-head">
                  <span>Confidence</span>
                  <span className="meter-pct">{confidencePct}%</span>
                </div>
                <div className="meter-track" role="presentation">
                  <div className="meter-fill meter-fill--confidence" style={{ width: `${confidencePct}%` }} />
                </div>
              </div>
              <div className="meter">
                <div className="meter-head">
                  <span>Signal quality</span>
                  <span className="meter-pct">{qualityPct}%</span>
                </div>
                <div className="meter-track" role="presentation">
                  <div className="meter-fill meter-fill--quality" style={{ width: `${qualityPct}%` }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: '#0f0f1a', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>LEARNING SESSION</p>
              <p style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '10px' }}>
                {formatTime(sessionSeconds)}
              </p>
              {!sessionActive ? (
                <button
                  onClick={startSession}
                  style={{ background: '#2196F3', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Start Session
                </button>
              ) : (
                <button
                  onClick={stopSession}
                  style={{ background: '#F44336', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  End Session
                </button>
              )}
            </div>

            {sessionSummary && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#1a2a1a', borderRadius: '8px', border: '1px solid #4CAF50' }}>
                <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '8px' }}>📊 Session Summary</p>
                <p style={{ color: '#ccc', fontSize: '0.85rem' }}>Duration: {formatTime(sessionSummary.duration)}</p>
                <p style={{ color: '#ccc', fontSize: '0.85rem' }}>
                  Avg Heart Rate: {sessionSummary.avgBpm != null ? `${Math.round(sessionSummary.avgBpm)} BPM` : 'Not enough data'}
                </p>
                {sessionSummary.avgBpm != null && (
                  <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '6px' }}>
                    {sessionSummary.avgBpm < 80
                      ? '✅ Great session! You stayed calm and focused throughout.'
                      : '⚠️ Elevated heart rate detected. Try a quieter environment next time.'}
                  </p>
                )}
              </div>
            )}
          </aside>
        </section>

        <p className="deck">
          NeuroLearn tracks your heart rate and focus state in real-time while you study Web3 — powered by <code>Elata rPPG</code>.
        </p>

        <details className="panel-disclosure">
          <summary>Learning Tips</summary>
          <div className="panel-inner">
            <ol className="guidance-list">
              <li className="guidance-item">
                <span className="guidance-index">1</span>
                <div>
                  <strong>Use soft, frontal lighting</strong>
                  <span>Good lighting helps NeuroLearn track your pulse accurately.</span>
                </div>
              </li>
              <li className="guidance-item">
                <span className="guidance-index">2</span>
                <div>
                  <strong>Start a session before you begin studying</strong>
                  <span>Click Start Session, then open your study material. NeuroLearn tracks your focus throughout.</span>
                </div>
              </li>
              <li className="guidance-item">
                <span className="guidance-index">3</span>
                <div>
                  <strong>Take breaks when stressed</strong>
                  <span>If your heart rate rises above 95 BPM, step away for 5 minutes. A calm mind learns better.</span>
                </div>
              </li>
            </ol>
          </div>
        </details>
      </main>

      <footer className="footer">
        <span>NeuroLearn · Powered by Elata rPPG · Web3 Focus Tracker</span>
      </footer>
    </div>
  );
}