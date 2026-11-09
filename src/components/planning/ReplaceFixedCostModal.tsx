import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Repeat,
  ArrowRight,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { FixedCostItem, FixedCostCategory } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { formatRupiah } from '../../utils/financialCalculations';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { updateFixedCostInState } from '../../store/slices/planningSlice';

interface ReplaceFixedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  cost: FixedCostItem | null;
  selectedMonth: string;
  onSuccess: () => void;
}

const CATEGORIES: { value: FixedCostCategory; label: string }[] = [
  { value: 'utilities', label: 'Utilities (Electricity, Water, Gas)' },
  { value: 'subscriptions', label: 'Subscriptions (Streaming, Cloud, SaaS)' },
  { value: 'telecom', label: 'Telecom & Internet (WiFi, Mobile Data)' },
  { value: 'housing', label: 'Housing (Rent, Service Charge, Maintenance)' },
  { value: 'insurance', label: 'Insurance (Health, Life, Vehicle)' },
  { value: 'memberships', label: 'Memberships (Gym, Clubs, Co-working)' },
  { value: 'debt_installments', label: 'Debt & Installment Obligations' },
  { value: 'other', label: 'Other Routine Obligations' },
];

export const ReplaceFixedCostModal: React.FC<ReplaceFixedCostModalProps> = ({
  isOpen,
  onClose,
  cost,
  selectedMonth,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FixedCostCategory>('utilities');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDay, setDueDay] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate current & next month labels
  const [year, month] = (selectedMonth || new Date().toISOString().substring(0, 7))
    .split('-')
    .map(Number);
  const currentMonthDate = new Date(year, (month || 1) - 1, 1);
  const nextMonthDate = new Date(year, month || 1, 1);

  const currentMonthFormatted = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const nextMonthFormatted = nextMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(
    nextMonthDate.getMonth() + 1
  ).padStart(2, '0')}`;

  useEffect(() => {
    if (isOpen && cost) {
      setName('');
      setCategory(cost.category);
      setAmount(cost.amount);
      setDueDay(cost.dueDay || 1);
      setNotes('');
      setError('');
    }
  }, [isOpen, cost]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !cost || typeof document === 'undefined') return null;

  const numAmount = typeof amount === 'number' ? amount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a name for the replacement fixed cost.');
      return;
    }
    if (numAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Mark existing cost as ending after selectedMonth
      await apiService.updateFixedCost(cost.id, {
        endMonth: selectedMonth,
      });

      dispatch(
        updateFixedCostInState({
          id: cost.id,
          endMonth: selectedMonth,
        })
      );

      // 2. Create new replacement cost starting in nextMonthStr
      await apiService.createFixedCost({
        name: trimmedName,
        category,
        amount: numAmount,
        dueDay,
        notes: notes.trim()
          ? `${notes.trim()} (Replaced ${cost.name})`
          : `Replaced ${cost.name}`,
        startMonth: nextMonthStr,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to replace fixed cost.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 29, 22, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-container"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 60px rgba(15, 29, 22, 0.22)',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 100000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(255, 255, 255, 1) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
              }}
            >
              <Repeat size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Replace Fixed Cost
              </h2>
              <p className="modal-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Transition {cost.name} to a new obligation
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={isSubmitting} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            className="modal-body"
            style={{
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--rose)',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Seamless Transition Explainer Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(248, 250, 252, 1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6366F1' }}>
                Automated Lifecycle Transition
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                <div style={{ flex: 1, padding: '8px 10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>ENDS IN {currentMonthFormatted.toUpperCase()}</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{cost.name}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{formatRupiah(cost.amount)}</div>
                </div>

                <ArrowRight size={18} color="#6366F1" />

                <div style={{ flex: 1, padding: '8px 10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #6366F1' }}>
                  <div style={{ fontSize: '10px', color: '#6366F1', fontWeight: 700 }}>STARTS IN {nextMonthFormatted.toUpperCase()}</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{name.trim() || 'New Replacement'}</div>
                  <div style={{ fontSize: '11.5px', color: '#6366F1' }}>{numAmount > 0 ? formatRupiah(numAmount) : 'Rp 0'}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                &bull; Past history &amp; current month records for <strong>{cost.name}</strong> remain intact.
              </span>
            </div>

            {/* New Cost Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Replacement Bill Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Biznet Fiber Home 100Mbps, New Apartment Lease"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-chip)',
                  border: '1.5px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FixedCostCategory)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-chip)',
                  border: '1.5px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <CurrencyInput
                label="New Monthly Amount (IDR) *"
                value={amount}
                onChange={setAmount}
                placeholder="0"
                prefix="Rp"
              />
            </div>

            {/* Due Day */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Due Day of the Month (1 - 31) *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-chip)',
                  border: '1.5px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Notes &amp; Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Swapped provider for faster upload speed"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-chip)',
                  border: '1.5px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div
            className="modal-actions"
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--bg-main)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !name.trim() || numAmount <= 0}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                background: '#6366F1',
                borderColor: '#6366F1',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSubmitting || !name.trim() || numAmount <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Replacing Bill...' : `Confirm & Activate in ${nextMonthFormatted}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

