import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  CalendarCheck,
  TrendingDown,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { FixedCostItem } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { formatRupiah } from '../../utils/financialCalculations';

interface ConfirmFixedCostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cost: FixedCostItem | null;
  selectedMonth: string;
  onConfirm: (
    cost: FixedCostItem,
    paidAmount: number,
    paymentDate: string,
    notes?: string
  ) => Promise<void>;
}

export const ConfirmFixedCostPaymentModal: React.FC<ConfirmFixedCostPaymentModalProps> = ({
  isOpen,
  onClose,
  cost,
  selectedMonth,
  onConfirm,
}) => {
  const getTodayISO = () => new Date().toISOString().split('T')[0];

  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayISO());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Format month for display
  const [year, month] = (selectedMonth || getTodayISO().substring(0, 7))
    .split('-')
    .map(Number);
  const monthDate = new Date(year, (month || 1) - 1, 1);
  const formattedMonthName = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    if (isOpen && cost) {
      setPaidAmount(cost.paidAmount && cost.paidAmount > 0 ? cost.paidAmount : cost.amount);
      setPaymentDate(getTodayISO());
      setNotes(cost.paymentNotes || '');
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

  const numPaid = typeof paidAmount === 'number' ? paidAmount : 0;
  const budgeted = cost.amount || 0;
  const variance = numPaid - budgeted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numPaid <= 0) {
      setError('Please enter a valid actual payment amount greater than 0.');
      return;
    }
    if (!paymentDate) {
      setError('Payment date is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(cost, numPaid, paymentDate, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to settle fixed cost.');
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
          maxWidth: '480px',
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
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(255, 255, 255, 1) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald)',
              }}
            >
              <CalendarCheck size={22} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Confirm Settlement
              </h2>
              <p className="modal-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {formattedMonthName} &bull; {cost.name}
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
              gap: '16px',
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

            {/* Budget vs Actual Comparison Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Budgeted Target
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-secondary)' }} className="tabular-nums">
                  {formatRupiah(budgeted)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Actual Settlement
                </span>
                <span
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: numPaid > 0 ? 'var(--emerald)' : 'var(--text-primary)',
                  }}
                  className="tabular-nums"
                >
                  {formatRupiah(numPaid)}
                </span>
              </div>

              {/* Variance Indicator */}
              {numPaid > 0 && (
                <div
                  style={{
                    marginTop: '4px',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Variance / Difference:</span>
                  {variance === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
                      Exact match to budget (Rp 0)
                    </span>
                  ) : variance < 0 ? (
                    <span style={{ color: 'var(--emerald)', fontWeight: 800 }}>
                      Savings: -{formatRupiah(Math.abs(variance))} under budget!
                    </span>
                  ) : (
                    <span style={{ color: '#D97706', fontWeight: 800 }}>
                      Variance: +{formatRupiah(variance)} over budget
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actual Amount Input */}
            <div>
              <CurrencyInput
                label="Actual Settlement Amount (IDR) *"
                value={paidAmount}
                onChange={setPaidAmount}
                placeholder="0"
                prefix="Rp"
                helperText="Fixed costs often vary (e.g. utilities, fluctuating bills). Enter the exact amount billed this month."
              />
            </div>

            {/* Payment Date */}
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
                Payment / Settlement Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
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

            {/* Optional Memo / Notes */}
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
                Notes / Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Token PLN #38291, Indihome Invoice Nov"
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

            {/* Ledger Notification Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
              }}
            >
              <Sparkles size={16} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Checking this bill off will automatically record an outflow of{' '}
                <strong style={{ color: 'var(--emerald)' }}>{formatRupiah(numPaid)}</strong> into your{' '}
                <strong>Cash Flow Ledger</strong> as an essential fixed cost expense.
              </div>
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
              disabled={isSubmitting || numPaid <= 0}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--emerald)',
                borderColor: 'var(--emerald)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSubmitting || numPaid <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Recording Settlement...' : 'Confirm & Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

