import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface CustomSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: (SelectOption<T> | string)[];
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

export const CustomSelect = <T extends string | number = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option...',
  icon,
  disabled = false,
  style,
  id,
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect available space to open upward if near viewport bottom
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Normalize options
  const normalizedOptions: SelectOption<T>[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt as unknown as T, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: isOpen ? 100 : 1,
        width: '100%',
        ...style,
      }}
    >
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

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '11px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-chip)',
          border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--border-light)'}`,
          boxShadow: isOpen
            ? '0 0 0 3px rgba(72, 176, 125, 0.18)'
            : '0 1px 2px rgba(24, 47, 36, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          {icon && (
            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {icon}
            </span>
          )}
          {selectedOption?.icon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flex: '1 1 auto',
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                marginLeft: '4px',
              }}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          style={{
            color: isOpen ? 'var(--primary)' : 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: openUpward ? 'auto' : 'calc(100% + 5px)',
            bottom: openUpward ? 'calc(100% + 5px)' : 'auto',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: openUpward
              ? '0 -14px 36px rgba(24, 47, 36, 0.18), 0 -2px 6px rgba(0, 0, 0, 0.04)'
              : '0 14px 36px rgba(24, 47, 36, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '5px',
            zIndex: 999,
          }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={String(opt.value)}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-chip)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {opt.icon && (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {opt.icon}
                    </span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        }}
                      >
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: isSelected ? 'var(--primary-subtle)' : 'var(--primary-light)',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check size={15} color="var(--primary)" style={{ flexShrink: 0, strokeWidth: 2.5 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
