"use client";
import React from 'react';

type Props = {
  min: number;
  max: number;
  value: [number | '', number | ''];
  onChange: (next: [number | '', number | '']) => void;
  step?: number;
  disabled?: boolean;
};

// Lightweight dual-thumb range slider using two native inputs.
// It stays in sync with external value and enforces min<=max.
export function RangeSlider({ min, max, value, onChange, step = 1, disabled }: Props) {
  const [lo, hi] = value;
  const loNum = Math.min(Math.max(typeof lo === 'number' ? lo : min, min), max);
  const hiNum = Math.min(Math.max(typeof hi === 'number' ? hi : max, min), max);

  const [active, setActive] = React.useState<'lo' | 'hi' | null>(null);

  const handleLow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const next = Math.min(raw, hiNum);
    onChange([next, hi]);
  };
  const handleHigh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const next = Math.max(raw, loNum);
    onChange([lo, next]);
  };

  const range = Math.max(max - min, 1);
  const left = ((loNum - min) / range) * 100;
  const right = ((hiNum - min) / range) * 100;

  return (
    <div style={{ position: 'relative', width: 260, padding: '12px 4px 4px' }} aria-disabled={disabled}>
      {/* Base track */}
      <div style={{ position: 'relative', height: 6, background: '#e5e7eb', borderRadius: 999 }} />
      {/* Selected track */}
      <div
        style={{ position: 'absolute', top: 12, left: `${left}%`, width: `${Math.max(right - left, 0)}%`, height: 6, background: '#3b82f6', borderRadius: 999 }}
        aria-hidden
      />
      {/* Low thumb */}
      <input
        type="range"
        min={min}
        max={max}
        value={loNum}
        onChange={handleLow}
        step={step}
        disabled={disabled}
        onMouseDown={() => setActive('lo')}
        onTouchStart={() => setActive('lo')}
        onMouseUp={() => setActive(null)}
        onTouchEnd={() => setActive(null)}
        style={{ position: 'absolute', left: 0, right: 0, top: 8, width: '100%', background: 'transparent', pointerEvents: disabled ? 'none' : 'auto', zIndex: active === 'lo' ? 2 : 1 }}
        aria-label="Min price"
      />
      {/* High thumb */}
      <input
        type="range"
        min={min}
        max={max}
        value={hiNum}
        onChange={handleHigh}
        step={step}
        disabled={disabled}
        onMouseDown={() => setActive('hi')}
        onTouchStart={() => setActive('hi')}
        onMouseUp={() => setActive(null)}
        onTouchEnd={() => setActive(null)}
        style={{ position: 'absolute', left: 0, right: 0, top: 8, width: '100%', background: 'transparent', pointerEvents: disabled ? 'none' : 'auto', zIndex: active === 'hi' ? 2 : 1 }}
        aria-label="Max price"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 12, opacity: 0.7 }}>
        <span>{lo === '' ? min : loNum} ₴</span>
        <span>{hi === '' ? max : hiNum} ₴</span>
      </div>
    </div>
  );
}
