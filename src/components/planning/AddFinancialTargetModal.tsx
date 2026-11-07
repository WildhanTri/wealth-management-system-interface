import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, DollarSign, Calendar, FileText, Sparkles } from 'lucide-react';
import { FinancialTargetItem, TargetCategory, TargetPriority } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { CustomSelect } from '../CustomSelect';
import { formatRupiah } from '../../utils/financialCalculations';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { addFinancialTarget, updateFinancialTargetInState } from '../../store/slices/planningSlice';

interface AddFinancialTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetToEdit?: FinancialTargetItem | null;
}

const CATEGORY_OPTIONS: { label: string; value: TargetCategory }[] = [
  { label: 'Emergency Fund (Dana Darurat)', value: 'emergency_fund' },
  { label: 'Property & Real Estate (DP Rumah / Apartemen)', value: 'property' },
  { label: 'Vehicle & Transport (Mobil / Motor)', value: 'vehicle' },
  { label: 'Investment Portfolio Capital', value: 'investment' },
  { label: 'Education & Career Growth', value: 'education' },
  { label: 'Vacation & Travel Adventure', value: 'travel' },
  { label: 'Tech & Gadgets (MacBook, Camera, Gear)', value: 'gadget' },
  { label: 'Wedding & Family Milestone', value: 'wedding' },
  { label: 'Retirement & Financial Independence', value: 'retirement' },
  { label: 'Other Long-term Target', value: 'other' },
];

const PRIORITY_OPTIONS: { label: string; value: TargetPriority }[] = [
  { label: 'High Priority (Essential Goal)', value: 'high' },
  { label: 'Medium Priority (Important Milestone)', value: 'medium' },
  { label: 'Low Priority (Nice-to-Have Wish)', value: 'low' },
];

export const AddFinancialTargetModal: React.FC<AddFinancialTargetModalProps> = ({
  isOpen,
  onClose,
  targetToEdit,
}) => {
  const dispatch = useAppDispatch();

  // Next year default date
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState<TargetCategory>('emergency_fund');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>('');
  const [deadlineDate, setDeadlineDate] = useState(getDefaultDeadline());
  const [priority, setPriority] = useState<TargetPriority>('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (targetToEdit) {
      setName(targetToEdit.name);
      setCategory(targetToEdit.category);
      setTargetAmount(targetToEdit.targetAmount);
      setCurrentAmount(targetToEdit.currentAmount);
      setDeadlineDate(targetToEdit.deadlineDate);
      setPriority(targetToEdit.priority);
      setNotes(targetToEdit.notes || '');
    } else {
      setName('');
      setCategory('emergency_fund');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadlineDate(getDefaultDeadline());
      setPriority('medium');
      setNotes('');
    }
    setError('');
  }, [targetToEdit, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Live Calculations for Modal Preview
  const numTarget = typeof targetAmount === 'number' ? targetAmount : 0;
  const numCurrent = typeof currentAmount === 'number' ? currentAmount : 0;
  const remainingGap = Math.max(0, numTarget - numCurrent);

  const calculateMonths = () => {
    if (!deadlineDate) return 1;
    const now = new Date();
    const target = new Date(deadlineDate);
    const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    return Math.max(1, months + (target.getDate() > now.getDate() ? 1 : 0));
  };

  const monthsRemaining = calculateMonths();
  const monthlySavingsNeeded = remainingGap > 0 ? Math.ceil(remainingGap / monthsRemaining) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this financial goal.');
      return;
    }
    if (numTarget <= 0) {
      setError('Please specify a positive target amount needed.');
      return;
    }
    if (!deadlineDate) {
      setError('Please select a target deadline date.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (targetToEdit) {
        const res = await apiService.updateFinancialTarget(targetToEdit.id, {
          name: name.trim(),
          category,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          deadlineDate,
          priority,
          notes: notes.trim() || undefined,
        });
        if (res.success && res.data) {
          dispatch(updateFinancialTargetInState(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to update financial target.');
        }
      } else {
        const res = await apiService.createFinancialTarget({
          name: name.trim(),
          category,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          deadlineDate,
          priority,
          status: numCurrent >= numTarget ? 'completed' : 'in_progress',
          notes: notes.trim() || undefined,
        });
        if (res.success && res.data) {
          dispatch(addFinancialTarget(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to create financial target.');
        }
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
                background: 'rgba(2, 132, 199, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {targetToEdit ? 'Edit Financial Target' : 'Create Financial Target'}
              </h2>
              <p className="modal-subtitle">
                Set future wealth targets, target deadlines, and calculate required monthly pace
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
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--rose)',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Goal Name */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={14} />
              <span>Target Name</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. DP Rumah 20%, Emergency Fund 6 Bulan, Trip to Japan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category & Priority in 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">
                <Target size={14} />
                <span>Target Category</span>
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as TargetCategory)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Sparkles size={14} />
                <span>Priority Level</span>
              </label>
              <CustomSelect
                value={priority}
                onChange={(val) => setPriority(val as TargetPriority)}
                options={PRIORITY_OPTIONS}
              />
            </div>
          </div>

          {/* Target Amount & Currently Allocated in 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={14} />
                <span>Total Target Amount</span>
              </label>
              <CurrencyInput
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="Rp 0"
                prefix="Rp"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <DollarSign size={14} />
                <span>Allocated So Far (Current)</span>
              </label>
              <CurrencyInput
                value={currentAmount}
                onChange={setCurrentAmount}
                placeholder="Rp 0"
                prefix="Rp"
              />
            </div>
          </div>

          {/* Target Deadline Date */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} />
              <span>Target Deadline Date</span>
            </label>
            <input
              type="date"
              required
              className="form-input"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </div>

          {/* Live Intelligence Calculation Callout Box */}
          {numTarget > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(72, 176, 125, 0.08) 0%, rgba(2, 132, 199, 0.06) 100%)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Time Remaining
                </span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {monthsRemaining} Months
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Remaining Gap
                </span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--amber)', marginTop: '2px' }} className="tabular-nums">
                  {formatRupiah(remainingGap)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                  Monthly Savings Needed
                </span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }} className="tabular-nums">
                  {formatRupiah(monthlySavingsNeeded)}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes Field */}
          <div className="form-group">
            <label className="form-label">
              <span>Goal Notes / Strategy (Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Set aside bonus and Rp 2jt every month into Bibit mutual funds"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Target size={16} />
              <span>{isSubmitting ? 'Saving...' : targetToEdit ? 'Save Changes' : 'Establish Target'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

