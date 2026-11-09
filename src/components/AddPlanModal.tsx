import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch } from '../store';
import { addPlan, updatePlan } from '../store/slices/planSlice';
import { PlannedExpense, PlanPriority } from '../types';
import { apiService } from '../services/apiService';
import { CurrencyInput } from './CurrencyInput';
import { CustomSelect } from './CustomSelect';
import { X, Target, Calendar, Tag, AlertCircle, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/financialCalculations';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: PlannedExpense | null;
}

export const PLAN_CATEGORIES = [
  'Electronics & Gadgets',
  'Vehicles & Transport',
  'Travel & Vacation',
  'Education & Courses',
  'Home & Living',
  'Family & Gifts',
  'Health & Wellness',
  'Bills & Obligations',
  'Other',
];

export const PRIORITY_OPTIONS: { value: PlanPriority; label: string; desc: string }[] = [
  { value: 'high', label: 'High (Critical / Urgent)', desc: 'Must be funded on schedule' },
  { value: 'medium', label: 'Medium (Important)', desc: 'Important milestone with minor flexibility' },
  { value: 'low', label: 'Low (Flexible / Want)', desc: 'Can be postponed if higher priorities arise' },
];

export const AddPlanModal: React.FC<AddPlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
}) => {
  const dispatch = useAppDispatch();

  // Helper default date (30 days from today)
  const getDefaultTargetDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(PLAN_CATEGORIES[0]);
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate());
  const [priority, setPriority] = useState<PlanPriority>('medium');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when opening or planToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (planToEdit) {
        setTitle(planToEdit.title);
        setTargetAmount(planToEdit.targetAmount);
        setCurrentAmount(planToEdit.currentAmount || 0);
        setCategory(planToEdit.category);
        setTargetDate(planToEdit.targetDate);
        setPriority(planToEdit.priority);
        setNotes(planToEdit.notes || '');
      } else {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('');
        setCategory(PLAN_CATEGORIES[0]);
        setTargetDate(getDefaultTargetDate());
        setPriority('medium');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, planToEdit]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a name or target description for this plan.');
      return;
    }

    const numTarget = typeof targetAmount === 'number' ? targetAmount : 0;
    if (numTarget <= 0) {
      setError('Target budget amount must be greater than Rp 0.');
      return;
    }

    const numCurrent = typeof currentAmount === 'number' ? Math.max(0, currentAmount) : 0;
    if (numCurrent > numTarget) {
      setError('Current allocated funds cannot exceed the target budget.');
      return;
    }

    if (!targetDate) {
      setError('Please specify an estimated target purchase date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (planToEdit) {
        const updated: PlannedExpense = {
          ...planToEdit,
          title: trimmedTitle,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          category,
          targetDate,
          priority,
          notes: notes.trim() || undefined,
          updatedAt: Date.now(),
        };
        const apiRes = await apiService.updatePlan(planToEdit.id, {
          name: trimmedTitle,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          category,
          targetDate,
          priority,
          notes: notes.trim() || undefined,
        });
        if (apiRes.success && apiRes.data) {
          dispatch(
            updatePlan({
              ...updated,
              ...apiRes.data,
              title: (apiRes.data as any).name || updated.title,
            })
          );
        } else {
          dispatch(updatePlan(updated));
        }
      } else {
        const tempId = `plan-${Date.now()}`;
        const newPlan: PlannedExpense = {
          id: tempId,
          title: trimmedTitle,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          category,
          targetDate,
          priority,
          status: 'active',
          notes: notes.trim() || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const apiRes = await apiService.createPlan({
          name: trimmedTitle,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          category,
          targetDate,
          priority,
          notes: notes.trim() || undefined,
        });
        if (apiRes.success && apiRes.data) {
          dispatch(
            addPlan({
              ...newPlan,
              ...apiRes.data,
              title: (apiRes.data as any).name || newPlan.title,
            })
          );
        } else {
          dispatch(addPlan(newPlan));
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save planned expense:', err);
      setError('Encountered an issue saving the plan via API: ' + err.message);
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
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
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
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {planToEdit ? 'Edit Planned Expense' : 'Create Planned Expense'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Set planned spending targets &amp; disciplined sinking funds
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--rose-light)',
                color: 'var(--rose)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Plan Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Expense Target Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. M3 Work Laptop, Vehicle Major Service, Year-End Vacation"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                background: '#FAFCFB',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              required
            />
          </div>

          {/* 2. Target Cost */}
          <CurrencyInput
            label="Target Budget (Estimated Cost) *"
            value={targetAmount}
            onChange={(val) => setTargetAmount(val)}
            placeholder="0"
            helperText="Estimated total funds required upon realization."
          />

          {/* 3. Pre-Allocated Funds */}
          <CurrencyInput
            label="Funds Already Allocated / Saved (Optional)"
            value={currentAmount}
            onChange={(val) => setCurrentAmount(val)}
            placeholder="0"
            helperText="If you already have funds set aside for this milestone."
          />

          {/* 4. Category */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Expense Category
            </label>
            <CustomSelect
              value={category}
              onChange={(val) => setCategory(val)}
              options={PLAN_CATEGORIES}
              icon={<Tag size={15} color="var(--primary)" />}
            />
          </div>

          {/* 5. Target Date */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Target Purchase Date *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  background: '#FAFCFB',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          {/* 6. Priority Level */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Plan Priority Level
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.value;
                const getColors = () => {
                  if (opt.value === 'high') {
                    return isSelected
                      ? { bg: 'var(--rose)', text: '#FFFFFF', border: 'var(--rose)' }
                      : { bg: 'rgba(244, 63, 94, 0.08)', text: 'var(--rose)', border: 'transparent' };
                  }
                  if (opt.value === 'medium') {
                    return isSelected
                      ? { bg: '#F59E0B', text: '#FFFFFF', border: '#F59E0B' }
                      : { bg: 'rgba(245, 158, 11, 0.08)', text: '#D97706', border: 'transparent' };
                  }
                  return isSelected
                    ? { bg: 'var(--primary)', text: '#FFFFFF', border: 'var(--primary)' }
                    : { bg: 'rgba(72, 176, 125, 0.08)', text: 'var(--primary)', border: 'transparent' };
                };
                const c = getColors();

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      background: c.bg,
                      color: c.text,
                      border: `1px solid ${c.border}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: opt.value === 'high' ? 'var(--rose)' : opt.value === 'medium' ? 'var(--amber)' : 'var(--primary)',
                          display: 'inline-block',
                        }}
                      />
                      {opt.value === 'high' && 'High'}
                      {opt.value === 'medium' && 'Medium'}
                      {opt.value === 'low' && 'Flexible'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Additional Notes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Notes / Product Specifications (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Store link, specifications, justifications, or notes..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '12px',
                background: '#FAFCFB',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Footer Submit Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 'var(--radius-md)',
                background: '#F1F5F3',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '11px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-gradient)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(72, 176, 125, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} />
              {isSubmitting ? 'Saving...' : planToEdit ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
