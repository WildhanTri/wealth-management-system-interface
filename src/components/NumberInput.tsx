import React, { useState } from 'react';

export interface NumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  label?: string;
  id?: string;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  helperText?: string;
  errorMessage?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  label,
  id,
  min = 0,
  max = 9999,
  suffix,
  disabled = false,
  style,
  inputStyle,
  helperText,
  errorMessage,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Filter only digits
    const digitsOnly = raw.replace(/\D/g, '');

    if (digitsOnly === '') {
      onChange('');
      return;
    }

    // Strip leading zero: "02" -> "2", "000" -> "0"
    const cleanDigits = digitsOnly.replace(/^0+(?=\d)/, '');
    let numeric = parseInt(cleanDigits, 10);

    if (isNaN(numeric)) {
      onChange('');
      return;
    }

    if (max !== undefined && numeric > max) {
      numeric = max;
    }

    onChange(numeric);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block '-' '+' 'e' '.' ','
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          background: disabled ? 'rgba(0,0,0,0.03)' : 'var(--bg-chip)',
          border: `1.5px solid ${
            errorMessage
              ? 'var(--rose)'
              : isFocused
              ? 'var(--primary)'
              : 'var(--border-light)'
          }`,
          boxShadow: isFocused ? '0 0 0 3px rgba(72, 176, 125, 0.18)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value === '' ? '' : value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            width: '100%',
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 700,
            outline: 'none',
            ...inputStyle,
          }}
        />

        {suffix && (
          <div
            style={{
              padding: '12px 14px 12px 0',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '12px',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {suffix}
          </div>
        )}
      </div>

      {errorMessage && (
        <span style={{ fontSize: '11px', color: 'var(--rose)', marginTop: '4px', fontWeight: 600 }}>
          {errorMessage}
        </span>
      )}

      {helperText && !errorMessage && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
