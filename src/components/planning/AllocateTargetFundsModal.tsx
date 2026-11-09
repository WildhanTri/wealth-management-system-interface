import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, PiggyBank, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FinancialTargetItem } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { formatRupiah } from '../../utils/financialCalculations';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { allocateTargetFundsInState } from '../../store/slices/planningSlice';

interface AllocateTargetFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: FinancialTargetItem | null;
}

const QUICK_AMOUNTS = [500000, 1000000, 2500000, 5000000];

export const AllocateTargetFundsModal: React.FC<AllocateTargetFundsModalProps> = ({
  isOpen,
  onClose,
  target,
}) => {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount('');
    setError('');
  }, [isOpen, target]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !target || typeof document === 'undefined') return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const targetTotal = target.targetAmount || 1;
  const currentTotal = target.currentAmount || 0;
  const newProjectedTotal = currentTotal + numAmount;
  const newProgressPercent = Math.min(100, Math.round((newProjectedTotal / targetTotal) * 100));

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid amount to allocate.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiService.allocateTargetFunds(target.id, numAmount);
      if (res.success && res.data) {
        dispatch(
          allocateTargetFundsInState({
            id: target.id,
            additionalAmount: numAmount,
          })
        );
        onClose();
      } else {
        setError(res.message || 'Failed to allocate funds.');
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
              <PiggyBank size={20} />
            </div>
            <div>
              <h2 className="modal-title">Allocate Funds</h2>
              <p className="modal-subtitle">Direct savings towards: {target.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleAllocate} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--rose)',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Current Status Banner */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Progress</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }} className="tabular-nums">
                {formatRupiah(currentTotal)} / {formatRupiah(targetTotal)}
              </span>
            </div>

            {/* Projected Progress Bar */}
            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  height: '8px',
                  borderRadius: '999px',
                  background: 'var(--border-light)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round((currentTotal / targetTotal) * 100))}%`,
                    background: 'var(--primary)',
                    height: '100%',
                    transition: 'width 0.3s ease',
                  }}
                />
                {numAmount > 0 && (
                  <div
                    style={{
                      width: `${Math.min(
                        100 - Math.min(100, Math.round((currentTotal / targetTotal) * 100)),
                        Math.round((numAmount / targetTotal) * 100)
                      )}%`,
                      background: 'var(--secondary)',
                      height: '100%',
                      transition: 'width 0.3s ease',
                    }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{Math.round((currentTotal / targetTotal) * 100)}% Current</span>
                {numAmount > 0 && (
                  <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                    &rarr; {newProgressPercent}% After Allocation
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label className="form-label">
              <span>Amount to Allocate (IDR)</span>
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              prefix="Rp"
            />
          </div>

          {/* Quick Amount Chips */}
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Quick Presets
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="btn-neutral"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-full)',
                    background: amount === amt ? 'var(--primary-light)' : '#fff',
                    borderColor: amount === amt ? 'var(--primary)' : 'var(--border-light)',
                    color: amount === amt ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                  }}
                >
                  +{formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {newProjectedTotal >= targetTotal ? (
                <CheckCircle2 size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
              <span>
                {isSubmitting
                  ? 'Allocating...'
                  : newProjectedTotal >= targetTotal
                  ? 'Complete Goal!'
                  : 'Deposit & Allocate'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

