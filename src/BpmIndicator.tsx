// ─── BpmIndicator.tsx ────────────────────────────────────────────────────────
// Floating BPM pill for mobile — shows live heart rate + focus state.
// Tapping it expands a drawer with full metrics.
// On desktop this is hidden; the full sidebar shows instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react';
import type { Metrics, RppgSessionDiagnostics } from '@elata-biosciences/rppg-web';
import { useBpmGuard } from '../hooks/useBpmGuard';

interface BpmIndicatorProps {
  metrics: Metrics;
  diagnostics: RppgSessionDiagnostics | null;
  sessionSeconds: number;
  sessionActive: boolean;
  onStartSession: () => void;
  onStopSession: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  confidencePct: number;
  qualityPct: number;
  focusState: { label: string; message: string; color: string };
  readinessLabel: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatBpm(bpm: number | null | undefined): string {
  if (bpm == null || Number.isNaN(bpm)) return '—';
  return Math.round(bpm).toString();
}

export default function BpmIndicator({
  metrics, diagnostics, sessionSeconds, sessionActive,
  onStartSession, onStopSession, videoRef,
  confidencePct, qualityPct, focusState, readinessLabel
}: BpmIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  // ── Cheat detection ──────────────────────────────────────────────────────────
  const guard = useBpmGuard(metrics.bpm, confidencePct, sessionSeconds);
  const isWarning = guard.suspicionLevel === 'low' || guard.suspicionLevel === 'high';
  const isHighRisk = guard.suspicionLevel === 'high';

  const bpmReady = metrics.bpm != null && diagnostics?.estimationAvailable;
  const dotColor = bpmReady ? '#00e5cc' : '#f59e0b';

  // ── Expanded drawer styles ────────────────────────────────────────────────
  const drawerStyle: CSSProperties = {
    background: 'rgba(6, 13, 18, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 229, 204, 0.15)',
    borderRadius: '20px',
    padding: '16px',
    marginTop: '8px',
    marginBottom: '4px',
    animation: 'fadeInUp 0.25s ease both',
  };

  const meterTrack: CSSProperties = {
    height: '4px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
  };

  return (
    <div style={{ marginBottom: '4px' }}>

      {/* ── Floating pill ──────────────────────────────────────────────────── */}
      <div
        className="bpm-float"
        onClick={() => setExpanded(v => !v)}
        role="button"
        aria-expanded={expanded}
        aria-label="BPM and focus state — tap to expand"
      >
        {/* Heartbeat dot */}
        <div
          className="bpm-float-dot"
          style={{ background: dotColor }}
        />

        {/* BPM value */}
        <span className="bpm-float-value">
          {formatBpm(metrics.bpm)}
        </span>
        <span className="bpm-float-label">BPM</span>

        {/* Separator */}
        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>·</span>

        {/* Focus state */}
        <span
          className="bpm-float-state"
          style={{ color: bpmReady ? focusState.color : '#f59e0b' }}
        >
          {bpmReady ? focusState.label : readinessLabel}
        </span>

        {/* Session time */}
        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>·</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}>
          {formatTime(sessionSeconds)}
        </span>

        {/* Expand chevron */}
        <span style={{
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
          marginLeft: '2px',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>▼</span>
      </div>

      {/* ── Expanded drawer ────────────────────────────────────────────────── */}
      {expanded && (
        <div style={drawerStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            {/* Left: camera */}
            <div>
              <div style={{
                borderRadius: '12px', overflow: 'hidden',
                background: 'rgba(15, 32, 48, 1)',
                border: '1px solid rgba(255,255,255,0.06)',
                aspectRatio: '4/3', position: 'relative',
              }}>
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <div style={{
                  position: 'absolute', bottom: '6px', left: '6px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(2,4,8,0.75)', borderRadius: '999px',
                  padding: '2px 8px', fontSize: '0.6rem', color: '#7a9db0',
                }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  Live
                </div>
              </div>
              <p style={{ color: '#3a5a6e', fontSize: '0.6rem', marginTop: '4px', textAlign: 'center' }}>
                Face · fill frame · stay steady
              </p>
            </div>

            {/* Right: metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* BPM big */}
              <div style={{
                background: 'rgba(0, 229, 204, 0.05)',
                border: '1px solid rgba(0, 229, 204, 0.15)',
                borderRadius: '12px', padding: '10px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.6rem', color: '#3a5a6e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Heart Rate</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800', color: '#00e5cc', lineHeight: 1, letterSpacing: '-0.04em' }}>
                  {formatBpm(metrics.bpm)}
                </p>
                <p style={{ fontSize: '0.6rem', color: '#7a9db0', marginTop: '1px' }}>BPM · {readinessLabel}</p>
              </div>

              {/* Focus state */}
              <div style={{
                background: `${focusState.color}0f`,
                border: `1px solid ${focusState.color}33`,
                borderRadius: '10px', padding: '8px 10px',
              }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: focusState.color, marginBottom: '2px' }}>{focusState.label}</p>
                <p style={{ fontSize: '0.62rem', color: '#7a9db0', lineHeight: 1.4 }}>{focusState.message}</p>
              </div>

            </div>
          </div>

          {/* ── Suspicion warning banner ──────────────────────────────────────── */}
          {isWarning && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: isHighRisk
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isHighRisk
                ? 'rgba(239, 68, 68, 0.25)'
                : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              {/* Icon */}
              <span style={{ fontSize: '0.85rem', marginTop: '1px' }}>
                {isHighRisk ? '⚠️' : '👁️'}
              </span>
              {/* Message */}
              <div>
                <p style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: isHighRisk ? '#ef4444' : '#f59e0b',
                  marginBottom: '2px',
                }}>
                  {isHighRisk ? 'Unusual signal detected' : 'Signal pattern notice'}
                </p>
                <p style={{
                  fontSize: '0.62rem',
                  color: '#7a9db0',
                  lineHeight: 1.4,
                }}>
                  {isHighRisk
                    ? 'Your biosignal looks unusually flat. Make sure your face fills the frame and you are in good light.'
                    : 'Signal variance is lower than expected. Try adjusting your position or lighting.'}
                </p>
              </div>
            </div>
          )}

          {/* Meters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.62rem', color: '#3a5a6e' }}>Confidence</span>
                <span style={{ fontSize: '0.62rem', color: '#7a9db0', fontFamily: 'var(--font-mono)' }}>{confidencePct}%</span>
              </div>
              <div style={meterTrack}>
                <div style={{ height: '100%', width: `${confidencePct}%`, background: 'linear-gradient(90deg, #3d9eff, #7dd3fc)', borderRadius: '2px', transition: 'width 0.5s' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.62rem', color: '#3a5a6e' }}>Signal</span>
                <span style={{ fontSize: '0.62rem', color: '#7a9db0', fontFamily: 'var(--font-mono)' }}>{qualityPct}%</span>
              </div>
              <div style={meterTrack}>
                <div style={{ height: '100%', width: `${qualityPct}%`, background: 'linear-gradient(90deg, #00b4a0, #00e5cc)', borderRadius: '2px', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>

          {/* Session control */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.6rem', color: '#3a5a6e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Session</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{formatTime(sessionSeconds)}</p>
            </div>
            {!sessionActive
              ? <button onClick={onStartSession} style={{ background: '#00e5cc', color: '#020408', border: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>Start</button>
              : <button onClick={onStopSession} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>End</button>
            }
          </div>
        </div>
      )}
    </div>
  );
}
