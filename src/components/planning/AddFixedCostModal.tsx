import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarCheck, DollarSign, Calendar, FileText } from 'lucide-react';
import { FixedCostItem, FixedCostCategory } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { CustomSelect } from '../CustomSelect';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { addFixedCost, updateFixedCostInState } from '../../store/slices/planningSlice';

interface AddFixedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  costToEdit?: FixedCostItem | null;
}

const CATEGORY_OPTIONS: { label: string; value: FixedCostCategory }[] = [
  { label: 'Utilities (Electricity PLN, Water, Gas)', value: 'utilities' },
  { label: 'Digital Subscriptions (Netflix, Spotify, Cloud, ChatGPT)', value: 'subscriptions' },
  { label: 'Telecom & Cellular (Pulsa, Mobile Data, Fiber WiFi)', value: 'telecom' },
  { label: 'Housing & Living (Rent, Kos, KPR, Maintenance IPL)', value: 'housing' },
  { label: 'Insurance & Healthcare (BPJS, Private Health)', value: 'insurance' },
  { label: 'Memberships (Gym, Co-working, Clubs)', value: 'memberships' },
  { label: 'Debt & Installments (Card, Vehicle, Loan)', value: 'debt_installments' },
  { label: 'Other Recurring Obligation', value: 'other' },
];

export const AddFixedCostModal: React.FC<AddFixedCostModalProps> = ({
  isOpen,
  onClose,
  costToEdit,
}) => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FixedCostCategory>('utilities');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDay, setDueDay] = useState<number | ''>(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (costToEdit) {
      setName(costToEdit.name);
      setCategory(costToEdit.category);
      setAmount(costToEdit.amount);
      setDueDay(costToEdit.dueDay || 1);
      setNotes(costToEdit.notes || '');
    } else {
      setName('');
      setCategory('utilities');
      setAmount('');
      setDueDay(5);
      setNotes('');
    }
    setError('');
  }, [costToEdit, isOpen]);

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
      setError('Please provide a title for this fixed expense.');
      return;
    }
    const numAmount = typeof amount === 'number' ? amount : 0;
    if (numAmount <= 0) {
      setError('Please enter a valid bill amount.');
      return;
    }
    const numDueDay = typeof dueDay === 'number' ? dueDay : 1;
    if (numDueDay < 1 || numDueDay > 31) {
      setError('Due day must be between 1 and 31.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (costToEdit) {
        const res = await apiService.updateFixedCost(costToEdit.id, {
          name: name.trim(),
          category,
          amount: numAmount,
          dueDay: numDueDay,
          notes: notes.trim() || undefined,
        });
        if (res.success && res.data) {
          dispatch(updateFixedCostInState(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to update fixed cost.');
        }
      } else {
        const res = await apiService.createFixedCost({
          name: name.trim(),
          category,
          amount: numAmount,
          dueDay: numDueDay,
          notes: notes.trim() || undefined,
        });
        if (res.success && res.data) {
          dispatch(addFixedCost(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to create fixed cost.');
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
          maxWidth: '520px',
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
                background: 'rgba(217, 119, 6, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber)',
              }}
            >
              <CalendarCheck size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {costToEdit ? 'Edit Fixed Obligation' : 'Add Fixed Cost / Recurring Bill'}
              </h2>
              <p className="modal-subtitle">
                Keep track of regular commitments, deadlines, and monthly settlement status
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

          {/* Title Field */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={14} />
              <span>Bill / Expense Name</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. PLN Pascabayar, Biznet Fiber 100Mbps, Netflix 4K"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">
              <CalendarCheck size={14} />
              <span>Expense Category</span>
            </label>
            <CustomSelect
              value={category}
              onChange={(val) => setCategory(val as FixedCostCategory)}
              options={CATEGORY_OPTIONS}
            />
          </div>

          {/* Amount & Due Day in 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={14} />
                <span>Monthly Bill Amount</span>
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="Rp 0"
                prefix="Rp"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} />
                <span>Due Day (Day of Month)</span>
              </label>
              <input
                type="number"
                min={1}
                max={31}
                required
                className="form-input"
                placeholder="e.g. 10 (Every 10th)"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value === '' ? '' : parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Notes Field */}
          <div className="form-group">
            <label className="form-label">
              <span>Payment Details / Notes (Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ID Pelanggan 5412093812, auto-debit BCA"
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
              <CalendarCheck size={16} />
              <span>{isSubmitting ? 'Saving...' : costToEdit ? 'Save Changes' : 'Save Fixed Cost'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

