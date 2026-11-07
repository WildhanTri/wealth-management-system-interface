import React, { useRef, useState, useEffect } from 'react';

export interface CurrencyInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  label?: string;
  id?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  helperText?: string;
  errorMessage?: string;
  prefix?: string;
}

/**
 * Format numeric value to Indonesian currency text with thousand dots
 * and optional decimal comma (e.g. 10000000 -> "10.000.000", 10000000.5 -> "10.000.000,50").
 */
function formatNumberToDisplay(val: number | ''): string {
  if (val === '' || val === null || val === undefined || isNaN(val)) {
    return '';
  }
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Calculate cursor position after formatting based on digit count before cursor.
 */
function getCursorPosition(formattedStr: string, digitCountBeforeCursor: number, hasTrailingComma: boolean = false): number {
  if (digitCountBeforeCursor <= 0) return 0;
  let digitsSeen = 0;
  for (let i = 0; i < formattedStr.length; i++) {
    if (/\d/.test(formattedStr[i])) {
      digitsSeen++;
      if (digitsSeen === digitCountBeforeCursor) {
        // If the user was typing right after the comma, place after comma
        if (hasTrailingComma && formattedStr[i + 1] === ',') {
          return i + 2;
        }
        return i + 1;
      }
    }
  }
  return formattedStr.length;
}

/**
 * Parse pasted currency string, accommodating ID (10.000.000,50), US (10,000,000.50),
 * raw digits (10000000), or formatted text with "Rp", spaces, etc.
 */
function parsePastedCurrency(text: string): { integer: number; decimal?: string } | null {
  const clean = text.replace(/[^0-9.,]/g, '').trim();
  if (!clean) return null;

  // Case 1: Both . and , present
  if (clean.includes('.') && clean.includes(',')) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Indonesian style: 10.000.000,50
      const intPart = clean.slice(0, lastComma).replace(/\./g, '');
      const decPart = clean.slice(lastComma + 1).slice(0, 2);
      return { integer: parseInt(intPart, 10) || 0, decimal: decPart };
    } else {
      // US style: 10,000,000.50
      const intPart = clean.slice(0, lastDot).replace(/,/g, '');
      const decPart = clean.slice(lastDot + 1).slice(0, 2);
      return { integer: parseInt(intPart, 10) || 0, decimal: decPart };
    }
  }

  // Case 2: Only comma exists
  if (clean.includes(',')) {
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return { integer: parseInt(parts[0], 10) || 0, decimal: parts[1] };
    }
    // Thousand separator comma (e.g. 10,000,000)
    return { integer: parseInt(clean.replace(/,/g, ''), 10) || 0 };
  }

  // Case 3: Only dot exists
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal dot: 10000.50
      return { integer: parseInt(parts[0], 10) || 0, decimal: parts[1] };
    }
    // Thousand separator dot (e.g. 10.000.000)
    return { integer: parseInt(clean.replace(/\./g, ''), 10) || 0 };
  }

  // Case 4: Digits only
  return { integer: parseInt(clean, 10) || 0 };
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  label,
  id,
  min = 0,
  max = 999_999_999_999, // Max Rp 999 Miliar
  disabled = false,
  style,
  inputStyle,
  helperText,
  errorMessage,
  prefix = 'Rp',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>(() => formatNumberToDisplay(value));
  const pendingCursorPos = useRef<number | null>(null);

  // Sync displayValue with external value changes when not actively typing partial decimals
  useEffect(() => {
    const formatted = formatNumberToDisplay(value);
    setDisplayValue((prev) => {
      // If user is focused and has typed trailing comma or partial decimal, keep local editing state
      if (isFocused && (prev.endsWith(',') || prev.endsWith(',0') || prev.endsWith(',00'))) {
        return prev;
      }
      return formatted;
    });
  }, [value, isFocused]);

  // Restore cursor position after formatting
  useEffect(() => {
    if (pendingCursorPos.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursorPos.current, pendingCursorPos.current);
      pendingCursorPos.current = null;
    }
  }, [displayValue]);

  const applyNumericValue = (integerVal: number, decimalStr?: string, newCursor?: number) => {
    // Upper & lower bounds check
    let boundedInt = Math.min(Math.max(integerVal, min), max);
    const formattedInt = new Intl.NumberFormat('id-ID').format(boundedInt);

    let nextDisplay = formattedInt;
    let finalNumeric: number = boundedInt;

    if (decimalStr !== undefined) {
      const cleanDecimal = decimalStr.slice(0, 2);
      nextDisplay = formattedInt + (cleanDecimal.length > 0 ? `,${cleanDecimal}` : ',');
      if (cleanDecimal.length > 0) {
        finalNumeric = parseFloat(`${boundedInt}.${cleanDecimal}`);
      }
    }

    if (newCursor !== undefined) {
      pendingCursorPos.current = newCursor;
    }

    setDisplayValue(nextDisplay);
    onChange(finalNumeric);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const currentCursor = e.target.selectionStart || 0;

    // Count how many numeric digits occurred before the cursor
    const rawBeforeCursor = rawInput.slice(0, currentCursor);
    const digitsBeforeCursor = (rawBeforeCursor.match(/\d/g) || []).length;
    const hasTrailingComma = rawBeforeCursor.endsWith(',') || rawBeforeCursor.endsWith('.');

    // Detect if user typed '.' on keyboard/keypad: convert it to comma
    // First, let's normalize:
    // If the string contains a dot at the end or where user just typed:
    let workingString = rawInput;

    // Handle empty input
    if (!workingString || workingString.trim() === '') {
      setDisplayValue('');
      onChange('');
      return;
    }

    // Check if user just typed '.' or ','
    // Count existing dots in previous displayValue:
    const prevDotsCount = (displayValue.match(/\./g) || []).length;
    const newDotsCount = (workingString.match(/\./g) || []).length;

    // If a new dot was inserted (e.g. user pressed . for decimal), treat that dot as comma
    if (newDotsCount > prevDotsCount && !displayValue.includes(',')) {
      // Find the newly added dot around cursor
      const before = workingString.slice(0, currentCursor);
      const after = workingString.slice(currentCursor);
      // Replace only the added dot near cursor with comma
      workingString = before.replace(/\.$/, ',') + after;
    }

    // Now remove all thousand-separator dots
    let stripped = workingString.replace(/\./g, '');

    // Allow at most one comma
    const commaParts = stripped.split(',');
    let decimalPart: string | undefined = undefined;
    let integerPart = commaParts[0].replace(/\D/g, '');

    if (commaParts.length > 1) {
      decimalPart = commaParts.slice(1).join('').replace(/\D/g, '').slice(0, 2);
    }

    // Strip leading zeros from integer part
    // "0" -> "0", "05" -> "5", "000" -> "0", "010000000" -> "10000000"
    let cleanInteger = integerPart.replace(/^0+(?=\d)/, '');
    if (cleanInteger === '') {
      cleanInteger = decimalPart !== undefined ? '0' : '';
    }

    if (cleanInteger === '' && decimalPart === undefined) {
      setDisplayValue('');
      onChange('');
      return;
    }

    const numericInteger = parseInt(cleanInteger || '0', 10);
    const boundedInteger = Math.min(numericInteger, max);
    const formattedInteger = new Intl.NumberFormat('id-ID').format(boundedInteger);

    let nextDisplay = formattedInteger;
    let finalNumeric: number | '' = boundedInteger;

    if (decimalPart !== undefined) {
      nextDisplay = formattedInteger + (decimalPart.length > 0 ? `,${decimalPart}` : ',');
      if (decimalPart.length > 0) {
        finalNumeric = parseFloat(`${boundedInteger}.${decimalPart}`);
      }
    }

    // Calculate new cursor position in the formatted string
    const newCursor = getCursorPosition(nextDisplay, digitsBeforeCursor, hasTrailingComma);
    pendingCursorPos.current = newCursor;

    setDisplayValue(nextDisplay);
    onChange(finalNumeric);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block negative signs, 'e', '+'
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      return;
    }

    // If user presses '.' on keyboard, treat it as decimal ','
    if (e.key === '.') {
      e.preventDefault();
      if (!displayValue.includes(',')) {
        const input = inputRef.current;
        const start = input?.selectionStart ?? displayValue.length;
        const currentInt = displayValue ? parseInt(displayValue.replace(/\D/g, ''), 10) || 0 : 0;
        applyNumericValue(currentInt, '', start + 1);
      }
    } else if (e.key === ',') {
      // If comma already exists, prevent second comma
      if (displayValue.includes(',')) {
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const parsed = parsePastedCurrency(pasteText);
    if (parsed) {
      applyNumericValue(parsed.integer, parsed.decimal);
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
        {prefix && (
          <div
            style={{
              padding: '12px 0 12px 14px',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '14px',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '0.2px',
            }}
          >
            {prefix}
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // On blur, clean up trailing comma if any (e.g. "10.000," -> "10.000")
            if (displayValue.endsWith(',')) {
              setDisplayValue(displayValue.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            width: '100%',
            padding: prefix ? '12px 14px 12px 8px' : '12px 14px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '16px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            outline: 'none',
            letterSpacing: '-0.2px',
            ...inputStyle,
          }}
        />
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
