import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, DollarSign, Calendar, FileText, Sparkles, ShieldCheck, Layers, Clock } from 'lucide-react';
import { FinancialTargetItem, TargetCategory, TargetPriority, TargetType, TargetTimeframe } from '../../types';
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

const NEED_SHORT_CATEGORIES: { label: string; value: TargetCategory }[] = [
  { label: 'Vehicle Maintenance (Car & Bike Servicing)', value: 'vehicle_maintenance' },
  { label: 'Home Repairs & Routine Maintenance', value: 'home_maintenance' },
  { label: 'Healthcare, Prescriptions & Medical Checkup', value: 'medical_health' },
  { label: 'Annual Taxes (Vehicle, Property) & Mandatory Dues', value: 'tax_bill' },
  { label: 'Other Minor Essential Needs', value: 'other_needs_short' },
];

const NEED_LONG_CATEGORIES: { label: string; value: TargetCategory }[] = [
  { label: 'Home & Real Estate (Down Payment / Purchase)', value: 'property' },
  { label: 'Emergency Fund & Core Savings Cushion', value: 'emergency_fund' },
  { label: 'Education & Career Growth Fund', value: 'education' },
  { label: 'Retirement & Financial Independence (FIRE)', value: 'retirement' },
  { label: 'Other Major Essential Targets', value: 'other_needs_long' },
];

const WANT_SHORT_CATEGORIES: { label: string; value: TargetCategory }[] = [
  { label: 'Tech & Gadgets (Phone, Laptop, Camera)', value: 'gadget' },
  { label: 'Fashion, Apparel & Personal Shopping', value: 'shopping' },
  { label: 'Entertainment, Concerts & Event Tickets', value: 'entertainment' },
  { label: 'Hobbies, Recreation & Sports Gear', value: 'hobby' },
  { label: 'Other Minor Wants', value: 'other_wants_short' },
];

const WANT_LONG_CATEGORIES: { label: string; value: TargetCategory }[] = [
  { label: 'Dream Vacation & World Travel', value: 'travel' },
  { label: 'Dream Vehicle (Car / Motorbike Upgrade)', value: 'vehicle' },
  { label: 'Wedding & Family Celebration', value: 'wedding' },
  { label: 'Business Venture & Investment Capital', value: 'investment' },
  { label: 'Other Major Wants', value: 'other_wants_long' },
];

const PRIORITY_OPTIONS: { label: string; value: TargetPriority }[] = [
  { label: 'High Priority (Essential / Urgent)', value: 'high' },
  { label: 'Medium Priority (Important Milestone)', value: 'medium' },
  { label: 'Low Priority (Flexible / Nice-to-Have)', value: 'low' },
];

function getClassificationFromCategory(cat: string): { targetType: TargetType; timeframe: TargetTimeframe } {
  if (['vehicle_maintenance', 'home_maintenance', 'medical_health', 'tax_bill', 'other_needs_short'].includes(cat)) {
    return { targetType: 'needs', timeframe: 'short_term' };
  }
  if (['property', 'emergency_fund', 'education', 'retirement', 'other_needs_long'].includes(cat)) {
    return { targetType: 'needs', timeframe: 'long_term' };
  }
  if (['gadget', 'shopping', 'entertainment', 'hobby', 'other_wants_short'].includes(cat)) {
    return { targetType: 'wants', timeframe: 'short_term' };
  }
  if (['travel', 'vehicle', 'wedding', 'investment', 'other_wants_long'].includes(cat)) {
    return { targetType: 'wants', timeframe: 'long_term' };
  }
  return { targetType: 'needs', timeframe: 'short_term' };
}

export const AddFinancialTargetModal: React.FC<AddFinancialTargetModalProps> = ({
  isOpen,
  onClose,
  targetToEdit,
}) => {
  const dispatch = useAppDispatch();

  // Helper default deadline (6 months for minor/small target, 2 years for major/big target)
  const getDefaultDeadline = (tf: TargetTimeframe = 'short_term') => {
    const d = new Date();
    if (tf === 'short_term') {
      d.setMonth(d.getMonth() + 6);
    } else {
      d.setFullYear(d.getFullYear() + 2);
    }
    return d.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('needs');
  const [timeframe, setTimeframe] = useState<TargetTimeframe>('short_term');
  const [category, setCategory] = useState<TargetCategory>('vehicle_maintenance');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>('');
  const [deadlineDate, setDeadlineDate] = useState(getDefaultDeadline('short_term'));
  const [priority, setPriority] = useState<TargetPriority>('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Determine available categories based on current targetType & timeframe (Minor vs Major)
  const getCategoryOptions = () => {
    if (targetType === 'needs') {
      return timeframe === 'short_term' ? NEED_SHORT_CATEGORIES : NEED_LONG_CATEGORIES;
    } else {
      return timeframe === 'short_term' ? WANT_SHORT_CATEGORIES : WANT_LONG_CATEGORIES;
    }
  };

  useEffect(() => {
    if (targetToEdit) {
      setName(targetToEdit.name);
      const inferred = getClassificationFromCategory(targetToEdit.category);
      const tt = targetToEdit.targetType || inferred.targetType;
      const tf = targetToEdit.timeframe || inferred.timeframe;
      setTargetType(tt);
      setTimeframe(tf);
      setCategory(targetToEdit.category);
      setTargetAmount(targetToEdit.targetAmount);
      setCurrentAmount(targetToEdit.currentAmount);
      setDeadlineDate(targetToEdit.deadlineDate);
      setPriority(targetToEdit.priority);
      setNotes(targetToEdit.notes || '');
    } else {
      setName('');
      setTargetType('needs');
      setTimeframe('short_term');
      setCategory('vehicle_maintenance');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadlineDate(getDefaultDeadline('short_term'));
      setPriority('medium');
      setNotes('');
    }
    setError('');
  }, [targetToEdit, isOpen]);

  // Handle type toggle
  const handleTypeChange = (newType: TargetType) => {
    setTargetType(newType);
    let options: { label: string; value: TargetCategory }[];
    if (newType === 'needs') {
      options = timeframe === 'short_term' ? NEED_SHORT_CATEGORIES : NEED_LONG_CATEGORIES;
    } else {
      options = timeframe === 'short_term' ? WANT_SHORT_CATEGORIES : WANT_LONG_CATEGORIES;
    }
    setCategory(options[0].value);
  };

  // Handle timeframe toggle (Minor Target vs Major Target)
  const handleTimeframeChange = (newTimeframe: TargetTimeframe) => {
    setTimeframe(newTimeframe);
    let options: { label: string; value: TargetCategory }[];
    if (targetType === 'needs') {
      options = newTimeframe === 'short_term' ? NEED_SHORT_CATEGORIES : NEED_LONG_CATEGORIES;
    } else {
      options = newTimeframe === 'short_term' ? WANT_SHORT_CATEGORIES : WANT_LONG_CATEGORIES;
    }
    setCategory(options[0].value);
    if (!targetToEdit) {
      setDeadlineDate(getDefaultDeadline(newTimeframe));
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
      setError('Please provide a name for this financial target.');
      return;
    }
    if (numTarget <= 0) {
      setError('Target amount must be greater than zero.');
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
          targetType,
          timeframe,
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
          targetType,
          timeframe,
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
          maxWidth: '640px',
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
          boxSizing: 'border-box',
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
                background: targetType === 'needs' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: targetType === 'needs' ? '#059669' : '#7C3AED',
                transition: 'all 0.2s ease',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {targetToEdit ? 'Edit Financial Target' : 'Create Financial Target'}
              </h2>
              <p className="modal-subtitle">
                Set essential needs &amp; personal wants, target funds, and monthly savings requirements
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

          {/* Goal Classification: Needs vs Wants */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                <span>Target Nature (Allocation Objective)</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {targetType === 'needs' ? 'Essential & Mandatory' : 'Lifestyle & Personal Goals'}
              </span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                background: '#F1F5F3',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <button
                type="button"
                onClick={() => handleTypeChange('needs')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: targetType === 'needs' ? '#FFFFFF' : 'transparent',
                  color: targetType === 'needs' ? '#059669' : 'var(--text-secondary)',
                  boxShadow: targetType === 'needs' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <ShieldCheck size={14} />
                <span>Essential Needs</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('wants')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: targetType === 'wants' ? '#FFFFFF' : 'transparent',
                  color: targetType === 'wants' ? '#7C3AED' : 'var(--text-secondary)',
                  boxShadow: targetType === 'wants' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Sparkles size={14} />
                <span>Personal Wants</span>
              </button>
            </div>
          </div>

          {/* Target Scale / Scope: Minor Target vs Major Target */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} />
                <span>Target Scale</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {timeframe === 'short_term'
                  ? 'Minor Target (Servicing, maintenance, gadgets, taxes)'
                  : 'Major Target (House, emergency cushion, dream travel)'}
              </span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                background: '#F1F5F3',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <button
                type="button"
                onClick={() => handleTimeframeChange('short_term')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: timeframe === 'short_term' ? '#FFFFFF' : 'transparent',
                  color: timeframe === 'short_term' ? '#0284C7' : 'var(--text-secondary)',
                  boxShadow: timeframe === 'short_term' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Clock size={13} />
                <span>Minor Target (Small)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTimeframeChange('long_term')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: timeframe === 'long_term' ? '#FFFFFF' : 'transparent',
                  color: timeframe === 'long_term' ? '#D97706' : 'var(--text-secondary)',
                  boxShadow: timeframe === 'long_term' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Target size={13} />
                <span>Major Target (Big)</span>
              </button>
            </div>
          </div>

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
              placeholder={
                targetType === 'needs'
                  ? timeframe === 'short_term'
                    ? 'e.g. Car / Motorbike Routine Service, Annual Taxes'
                    : 'e.g. Home Down Payment, 6-Month Emergency Cushion'
                  : timeframe === 'short_term'
                    ? 'e.g. New Smartphone, Concert Tickets'
                    : 'e.g. Dream Trip to Japan, Car Upgrade'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category & Priority in Responsive Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="form-group" style={{ minWidth: 0 }}>
              <label className="form-label">
                <Target size={14} />
                <span>Target Category</span>
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as TargetCategory)}
                options={getCategoryOptions()}
                alignMenu="left"
              />
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <label className="form-label">
                <Sparkles size={14} />
                <span>Priority Level</span>
              </label>
              <CustomSelect
                value={priority}
                onChange={(val) => setPriority(val as TargetPriority)}
                options={PRIORITY_OPTIONS}
                alignMenu="right"
              />
            </div>
          </div>

          {/* Target Amount & Currently Allocated in Responsive Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="form-group" style={{ minWidth: 0 }}>
              <label className="form-label">
                <DollarSign size={14} />
                <span>Total Target Goal</span>
              </label>
              <CurrencyInput
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="0"
                prefix="Rp"
              />
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <label className="form-label">
                <DollarSign size={14} />
                <span>Saved So Far (Current)</span>
              </label>
              <CurrencyInput
                value={currentAmount}
                onChange={setCurrentAmount}
                placeholder="0"
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Time Remaining
                </span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {monthsRemaining} Month{monthsRemaining === 1 ? '' : 's'}
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
                  Required Monthly Pace
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
              <span>Goal Strategy / Notes (Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Set aside bonus and monthly savings into mutual fund"
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
