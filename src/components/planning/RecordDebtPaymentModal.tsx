import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DebtItem } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { formatRupiah } from '../../utils/financialCalculations';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { recordDebtPaymentInState } from '../../store/slices/planningSlice';

interface RecordDebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem | null;
}

export const RecordDebtPaymentModal: React.FC<RecordDebtPaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (debt?.monthlyPayment && debt.monthlyPayment > 0) {
      setAmount(debt.monthlyPayment);
    } else {
      setAmount('');
    }
    setError('');
  }, [isOpen, debt]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !debt || typeof document === 'undefined') return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const currentRemaining = debt.remainingAmount;
  const nextRemaining = Math.max(0, currentRemaining - numAmount);
  const isSettlingFull = nextRemaining === 0 && numAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a payment amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiService.recordDebtPayment(debt.id, numAmount);
      if (res.success && res.data) {
        dispatch(
          recordDebtPaymentInState({
            id: debt.id,
            paymentAmount: numAmount,
          })
        );
        onClose();
      } else {
        setError(res.message || 'Failed to record debt payment.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
        backgroundColor: 'rgba(15, 29, 22, 0.6)',
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
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 100000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald)',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="modal-title">Record Debt Payment</h2>
              <p className="modal-subtitle">
                Pay down: <strong>{debt.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--rose)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Current Debt Status Banner */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Total Debt (Principal):</span>
              <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatRupiah(debt.totalAmount)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Remaining Balance:</span>
              <span className="tabular-nums" style={{ color: 'var(--rose)' }}>
                {formatRupiah(currentRemaining)}
              </span>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="form-group">
            <label className="form-label">
              Payment / Installment Amount <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="Rp 0"
            />
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {debt.monthlyPayment && debt.monthlyPayment > 0 && (
              <button
                type="button"
                onClick={() => setAmount(debt.monthlyPayment || 0)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--primary)',
                }}
              >
                Monthly Due ({formatRupiah(debt.monthlyPayment)})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAmount(currentRemaining)}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--emerald)',
              }}
            >
              Pay in Full ({formatRupiah(currentRemaining)})
            </button>
          </div>

          {/* Live Outcome Calculation */}
          {numAmount > 0 && (
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: isSettlingFull
                  ? 'rgba(5, 150, 105, 0.1)'
                  : 'linear-gradient(135deg, rgba(72, 176, 125, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
                border: isSettlingFull
                  ? '1px solid rgba(5, 150, 105, 0.3)'
                  : '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Remaining After Payment:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }} className="tabular-nums">
                    {formatRupiah(currentRemaining)}
                  </span>
                  <ArrowRight size={13} color="var(--primary)" />
                  <span className="tabular-nums" style={{ fontWeight: 800, color: nextRemaining === 0 ? 'var(--emerald)' : 'var(--text-primary)' }}>
                    {formatRupiah(nextRemaining)}
                  </span>
                </div>
              </div>

              {isSettlingFull && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--emerald)' }}>
                  <CheckCircle2 size={14} />
                  <span>🎉 This payment will completely settle and clear this debt!</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-neutral" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || numAmount <= 0}>
              {isSubmitting ? 'Recording...' : 'Apply Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
