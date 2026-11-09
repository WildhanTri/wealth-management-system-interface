import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, DollarSign, Calendar, FileText, UserCheck, Percent } from 'lucide-react';
import { DebtItem, DebtCategory } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { CustomSelect } from '../CustomSelect';
import { formatRupiah } from '../../utils/financialCalculations';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { addDebt, updateDebtInState } from '../../store/slices/planningSlice';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: DebtItem | null;
}

const CATEGORY_OPTIONS: { label: string; value: DebtCategory }[] = [
  { label: 'Credit Card (Kartu Kredit)', value: 'credit_card' },
  { label: 'Mortgage / Housing Loan (KPR)', value: 'mortgage' },
  { label: 'Vehicle Loan (Kredit Motor / Mobil)', value: 'vehicle_loan' },
  { label: 'PayLater & FinTech (GoPay / Shopee / Kredivo)', value: 'paylater' },
  { label: 'Personal Bank Loan (KTA / Pinjaman Bank)', value: 'personal_loan' },
  { label: 'Peer & Family Loan (Pinjaman Teman / Keluarga)', value: 'peer_loan' },
  { label: 'Other Debt & Liability', value: 'other' },
];

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  isOpen,
  onClose,
  debtToEdit,
}) => {
  const dispatch = useAppDispatch();

  const getDefaultDeadline = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DebtCategory>('credit_card');
  const [lender, setLender] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [remainingAmount, setRemainingAmount] = useState<number | ''>('');
  const [monthlyPayment, setMonthlyPayment] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [deadlineDate, setDeadlineDate] = useState(getDefaultDeadline());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (debtToEdit) {
      setName(debtToEdit.name);
      setCategory(debtToEdit.category);
      setLender(debtToEdit.lender || '');
      setTotalAmount(debtToEdit.totalAmount);
      setRemainingAmount(debtToEdit.remainingAmount);
      setMonthlyPayment(debtToEdit.monthlyPayment ?? '');
      setInterestRate(debtToEdit.interestRate ?? '');
      setDeadlineDate(debtToEdit.deadlineDate || getDefaultDeadline());
      setNotes(debtToEdit.notes || '');
    } else {
      setName('');
      setCategory('credit_card');
      setLender('');
      setTotalAmount('');
      setRemainingAmount('');
      setMonthlyPayment('');
      setInterestRate('');
      setDeadlineDate(getDefaultDeadline());
      setNotes('');
    }
    setError('');
  }, [debtToEdit, isOpen]);

  // Sync remaining with total if newly typing total and remaining is empty
  const handleTotalAmountChange = (val: number | '') => {
    setTotalAmount(val);
    if (!debtToEdit && (remainingAmount === '' || remainingAmount === totalAmount)) {
      setRemainingAmount(val);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a debt / liability name.');
      return;
    }
    const numTotal = typeof totalAmount === 'number' ? totalAmount : 0;
    if (numTotal <= 0) {
      setError('Total debt amount must be greater than zero.');
      return;
    }
    const numRemaining =
      typeof remainingAmount === 'number' ? remainingAmount : numTotal;

    if (numRemaining > numTotal) {
      setError('Remaining balance cannot exceed total debt amount.');
      return;
    }

    if (!deadlineDate) {
      setError('Please choose a target payoff deadline date.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        category,
        lender: lender.trim() || undefined,
        totalAmount: numTotal,
        remainingAmount: numRemaining,
        monthlyPayment: typeof monthlyPayment === 'number' ? monthlyPayment : undefined,
        interestRate: typeof interestRate === 'number' ? interestRate : undefined,
        deadlineDate,
        status: (numRemaining <= 0 ? 'paid_off' : 'active') as DebtCategory extends any ? 'active' | 'paid_off' : never,
        notes: notes.trim() || undefined,
      };

      if (debtToEdit) {
        const res = await apiService.updateDebt(debtToEdit.id, payload);
        if (res.success && res.data) {
          dispatch(updateDebtInState(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to update debt.');
        }
      } else {
        const res = await apiService.createDebt(payload);
        if (res.success && res.data) {
          dispatch(addDebt(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to register debt.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numTotal = typeof totalAmount === 'number' ? totalAmount : 0;
  const numRemaining = typeof remainingAmount === 'number' ? remainingAmount : numTotal;
  const paidOffEstimate = Math.max(0, numTotal - numRemaining);
  const payoffPct = numTotal > 0 ? Math.min(100, Math.round((paidOffEstimate / numTotal) * 100)) : 0;

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
          maxWidth: '540px',
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
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--rose)',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {debtToEdit ? 'Edit Debt Liability' : 'Add Debt / Loan Obligation'}
              </h2>
              <p className="modal-subtitle">
                Track borrowed capital, monthly installments & payoff milestones
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

          {/* Name */}
          <div className="form-group">
            <label className="form-label">
              Debt Name <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Signature Credit Card, Home Mortgage, Vehicle Installment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category & Lender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Debt Category</label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as DebtCategory)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Creditor / Lender / Bank</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bank Mandiri, BCA, Kawan"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                />
                <UserCheck
                  size={15}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Total Debt & Current Remaining */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">
                Total Debt (Principal) <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <CurrencyInput
                value={totalAmount}
                onChange={handleTotalAmountChange}
                placeholder="Rp 0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Remaining Balance <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <CurrencyInput
                value={remainingAmount}
                onChange={setRemainingAmount}
                placeholder="Rp 0"
              />
            </div>
          </div>

          {/* Monthly Payment & Interest Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Monthly Installment (Optional)</label>
              <CurrencyInput
                value={monthlyPayment}
                onChange={setMonthlyPayment}
                placeholder="Rp 0 / month"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Interest Rate (% p.a.)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="e.g. 8.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value ? Number(e.target.value) : '')}
                />
                <Percent
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Deadline Date */}
          <div className="form-group">
            <label className="form-label">
              Target Payoff Deadline <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="form-input"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
              />
              <Calendar
                size={16}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Live Payoff Progress Preview Card */}
          {numTotal > 0 && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payoff Progress</span>
                <span style={{ color: payoffPct === 100 ? 'var(--emerald)' : 'var(--text-primary)' }}>
                  {payoffPct}% Paid Off
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${payoffPct}%`,
                    height: '100%',
                    background: payoffPct === 100 ? 'var(--emerald)' : 'var(--primary)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>Paid: {formatRupiah(paidOffEstimate)}</span>
                <span>Remaining: {formatRupiah(numRemaining)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes & Account Details (Optional)</label>
            <div style={{ position: 'relative' }}>
              <textarea
                className="form-input"
                rows={2}
                placeholder="e.g. Account no: 1234-5678, auto-debit on the 25th"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <FileText
                size={16}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-neutral" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : debtToEdit ? 'Save Changes' : 'Register Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
