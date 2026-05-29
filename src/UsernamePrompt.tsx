import { useState } from 'react';

interface Props {
  onSubmit: (name: string) => void;
}

export default function UsernamePrompt({ onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const cleaned = value.trim();
    if (cleaned.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (cleaned.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
      setError('Only letters, numbers, and underscores allowed');
      return;
    }
    setError('');
    onSubmit(cleaned);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#0f1923',
        border: '1px solid #20d29b',
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <h2 style={{
            color: '#20d29b',
            fontFamily: 'Syne, sans-serif',
            fontSize: '1.4rem',
            margin: 0
          }}>
            Choose Your Name
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            This appears on the global leaderboard.
            No email or password needed.
          </p>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="e.g. CryptoIfeanyi"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={20}
          style={{
            background: '#1a2535',
            border: '1px solid #2a3a4a',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: '#ffffff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '1rem',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />

        {/* Error */}
        {error && (
          <p style={{
            color: '#f87171',
            fontSize: '0.8rem',
            margin: 0,
            fontFamily: 'DM Sans, sans-serif'
          }}>
            {error}
          </p>
        )}

        {/* Character count */}
        <p style={{
          color: '#475569',
          fontSize: '0.75rem',
          margin: 0,
          textAlign: 'right',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {value.length}/20
        </p>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          style={{
            background: '#20d29b',
            color: '#000000',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.85rem',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Enter NeuroLearn →
        </button>

        {/* Privacy note */}
        <p style={{
          color: '#334155',
          fontSize: '0.72rem',
          textAlign: 'center',
          margin: 0,
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Only your username and country are stored.
          No personal information collected.
        </p>
      </div>
    </div>
  );
}