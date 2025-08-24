"use client";
import * as RadixSlider from '@radix-ui/react-slider';
import React from 'react';

export type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value: [number | '', number | ''];
  onChange: (next: [number | '', number | '']) => void;
  onCommit?: (next: [number | '', number | '']) => void;
  disabled?: boolean;
  width?: number | string;
  showValues?: boolean;
  format?: (n: number) => string;
};

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  onCommit,
  disabled,
  width = 260,
  showValues = true,
  format = (n: number) => `${n} ₴`,
}: SliderProps) {
  const [lo, hi] = value;
  const loNum = typeof lo === 'number' ? lo : min;
  const hiNum = typeof hi === 'number' ? hi : max;

  const handleChange = (vals: number[]) => {
    const [a, b] = vals;
    onChange([a, b]);
  };
  const handleCommit = (vals: number[]) => {
    if (onCommit) onCommit([vals[0], vals[1]]);
  };

  return (
    <div style={{ width }}>
      <RadixSlider.Root
        value={[loNum, hiNum]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleChange}
        onValueCommit={handleCommit}
        disabled={disabled}
        aria-label="Price range"
        style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}
      >
        <RadixSlider.Track
          style={{ position: 'relative', background: '#e5e7eb', flexGrow: 1, height: 6, borderRadius: 999 }}
        >
          <RadixSlider.Range style={{ position: 'absolute', background: '#3b82f6', height: '100%', borderRadius: 999 }} />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          style={{ display: 'block', width: 16, height: 16, background: 'white', border: '2px solid #3b82f6', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          aria-label="Min price"
        />
        <RadixSlider.Thumb
          style={{ display: 'block', width: 16, height: 16, background: 'white', border: '2px solid #3b82f6', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          aria-label="Max price"
        />
      </RadixSlider.Root>
      {showValues && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, opacity: 0.8 }}>
          <span>{format(loNum)}</span>
          <span>{format(hiNum)}</span>
        </div>
      )}
    </div>
  );
}
