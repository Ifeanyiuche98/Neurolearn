// src/components/ExportButton.tsx
// A button that exports the user's session history as a CSV file.
// Shows loading state, success count, or an error message.

import { useState } from 'react';
import { exportMySessionsAsCSV } from './lib/exportSessions';

export default function ExportButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleExport() {
    setStatus('loading');
    setMessage('');

    const result = await exportMySessionsAsCSV();

    if (result.success) {
      setStatus('done');
      setMessage(`Exported ${result.rowCount} session${result.rowCount === 1 ? '' : 's'}.`);
    } else {
      setStatus('error');
      setMessage(result.error || 'Export failed. Please try again.');
    }

    // Reset back to idle after a few seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 4000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <button
        onClick={handleExport}
        disabled={status === 'loading'}
        style={{
          width: '100%',
          minHeight: '44px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-md)',
          color: status === 'error' ? '#ef4444' : '#00e5cc',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {status === 'loading' ? '⏳ Exporting…' : '⬇️ Export My Sessions (CSV)'}
      </button>

      {message && (
        <p style={{
          fontSize: '0.72rem',
          color: status === 'error' ? '#ef4444' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}