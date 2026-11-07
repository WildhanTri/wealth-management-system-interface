import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch } from '../store';
import { allocateFundsToPlan } from '../store/slices/planSlice';
import { PlannedExpense } from '../types';
import { apiService } from '../services/apiService';
import { CurrencyInput } from './CurrencyInput';
import { X, PiggyBank, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../utils/financialCalculations';

interface AllocateFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlannedExpense | null;
}

const PRESET_AMOUNTS = [100000, 250000, 500000, 1000000];

export const AllocateFundsModal: React.FC<AllocateFundsModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan || typeof document === 'undefined') return null;

  const currentAmount = plan.currentAmount || 0;
  const targetAmount = plan.targetAmount;
  const remainingNeeded = Math.max(0, targetAmount - currentAmount);

  const numInput = typeof amount === 'number' ? amount : 0;
  const projectedAmount = currentAmount + numInput;
  const currentPct = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
  const projectedPct = targetAmount > 0 ? Math.min(100, Math.round((projectedAmount / targetAmount) * 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numInput <= 0) {
      setError('Enter the amount of funds to allocate (greater than Rp 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.allocatePlanFunds(plan.id, numInput);
      dispatch(allocateFundsToPlan({ id: plan.id, additionalAmount: numInput }));
      onClose();
    } catch (err: any) {
      console.error('Failed to allocate funds via API:', err);
      setError('Failed to update fund allocation: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, #F9FCFA 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(72, 176, 125, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <PiggyBank size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Allocate Savings Funds
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {plan.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--rose-light)',
                color: 'var(--rose)',
                fontSize: '11.5px',
              }}
            >
              {error}
            </div>
          )}

          {/* Current Status Box */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: '#F7FAF8',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <span>Target Budget:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(targetAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <span>Accumulated:</span>
              <strong style={{ color: 'var(--primary)' }}>{formatRupiah(currentAmount)} ({currentPct}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <span>Remaining Needed:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(remainingNeeded)}</strong>
            </div>

            {/* Progress Bar Projection */}
            <div style={{ height: '7px', background: '#E0ECE4', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${projectedPct}%`,
                  background: 'var(--primary-gradient)',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px',
                }}
              />
            </div>
            {numInput > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primary)', marginTop: '6px', fontWeight: 600 }}>
                <span>{currentPct}%</span>
                <ArrowRight size={12} />
                <span>Progress after allocation: {projectedPct}% ({formatRupiah(projectedAmount)})</span>
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Quick Add Presets:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: amount === amt ? 'var(--primary)' : 'rgba(72, 176, 125, 0.08)',
                    color: amount === amt ? '#FFFFFF' : 'var(--primary)',
                    border: `1px solid ${amount === amt ? 'var(--primary)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  +{amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Input */}
          <CurrencyInput
            label="Or Enter Custom Amount"
            value={amount}
            onChange={(val) => setAmount(val)}
            placeholder="0"
            helperText="Savings amount allocated towards this goal."
          />

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: '#F1F5F3',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12.5px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numInput <= 0}
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-gradient)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12.5px',
                border: 'none',
                cursor: isSubmitting || numInput <= 0 ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || numInput <= 0 ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(72, 176, 125, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} />
              {isSubmitting ? 'Saving...' : 'Add to Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
