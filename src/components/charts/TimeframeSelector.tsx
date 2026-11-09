import React from 'react';
import { ChartTimeframe, TIMEFRAME_OPTIONS } from './chartUtils';

interface TimeframeSelectorProps {
  value: ChartTimeframe;
  onChange: (timeframe: ChartTimeframe) => void;
  size?: 'sm' | 'md';
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  value,
  onChange,
  size = 'sm',
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-chip)',
        padding: '2px',
        borderRadius: '8px',
        border: '1px solid var(--border-light)',
        gap: '2px',
      }}
      role="group"
      aria-label="Select chart timeframe"
    >
      {TIMEFRAME_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.title}
            aria-pressed={isActive}
            style={{
              padding: size === 'sm' ? '3px 8px' : '5px 12px',
              fontSize: size === 'sm' ? '10.5px' : '11.5px',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary)' : 'transparent',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 1px 3px rgba(72, 176, 125, 0.35)' : 'none',
              lineHeight: 1.2,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

