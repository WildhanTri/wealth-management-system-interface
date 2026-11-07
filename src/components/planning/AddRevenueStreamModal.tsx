import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, DollarSign, Calendar, FileText } from 'lucide-react';
import { RevenueStreamItem, RevenueCategory, RevenueFrequency } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { CustomSelect } from '../CustomSelect';
import { apiService } from '../../services/apiService';
import { useAppDispatch } from '../../store';
import { addRevenueStream, updateRevenueStreamInState } from '../../store/slices/planningSlice';

interface AddRevenueStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamToEdit?: RevenueStreamItem | null;
}

const CATEGORY_OPTIONS: { label: string; value: RevenueCategory }[] = [
  { label: 'Main Job (Salary / Primary Career)', value: 'main_job' },
  { label: 'Side Hustle (Freelance / Business / Shop)', value: 'side_hustle' },
  { label: 'Passive Income (Dividends / Royalties / Rental)', value: 'passive_income' },
  { label: 'Other Income Source', value: 'other' },
];

const FREQUENCY_OPTIONS: { label: string; value: RevenueFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Bi-Weekly', value: 'biweekly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Irregular / Project-Based', value: 'irregular' },
];

export const AddRevenueStreamModal: React.FC<AddRevenueStreamModalProps> = ({
  isOpen,
  onClose,
  streamToEdit,
}) => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RevenueCategory>('main_job');
  const [amount, setAmount] = useState<number | ''>('');
  const [frequency, setFrequency] = useState<RevenueFrequency>('monthly');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (streamToEdit) {
      setName(streamToEdit.name);
      setCategory(streamToEdit.category);
      setAmount(streamToEdit.amount);
      setFrequency(streamToEdit.frequency);
      setNotes(streamToEdit.notes || '');
    } else {
      setName('');
      setCategory('main_job');
      setAmount('');
      setFrequency('monthly');
      setNotes('');
    }
    setError('');
  }, [streamToEdit, isOpen]);

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
      setError('Please provide a name for this revenue source.');
      return;
    }
    const numAmount = typeof amount === 'number' ? amount : 0;
    if (numAmount <= 0) {
      setError('Please specify a positive estimated income amount.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (streamToEdit) {
        const res = await apiService.updateRevenueStream(streamToEdit.id, {
          name: name.trim(),
          category,
          amount: numAmount,
          frequency,
          notes: notes.trim() || undefined,
        });
        if (res.success && res.data) {
          dispatch(updateRevenueStreamInState(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to update revenue stream.');
        }
      } else {
        const res = await apiService.createRevenueStream({
          name: name.trim(),
          category,
          amount: numAmount,
          frequency,
          status: 'active',
          notes: notes.trim() || undefined,
        });
        if (res.success && res.data) {
          dispatch(addRevenueStream(res.data));
          onClose();
        } else {
          setError(res.message || 'Failed to create revenue stream.');
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
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {streamToEdit ? 'Edit Revenue Stream' : 'Add New Revenue Stream'}
              </h2>
              <p className="modal-subtitle">
                Record an inflow channel to track and forecast your earnings
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

          {/* Name Field */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={14} />
              <span>Revenue Source Name</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Lead Software Engineer Salary, Upwork Freelancing"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">
              <TrendingUp size={14} />
              <span>Income Category</span>
            </label>
            <CustomSelect
              value={category}
              onChange={(val) => setCategory(val as RevenueCategory)}
              options={CATEGORY_OPTIONS}
            />
          </div>

          {/* Amount Field */}
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={14} />
              <span>Estimated Inflow Amount (IDR)</span>
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="Rp 0"
              prefix="Rp"
            />
          </div>

          {/* Frequency Dropdown */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} />
              <span>Inflow Frequency</span>
            </label>
            <CustomSelect
              value={frequency}
              onChange={(val) => setFrequency(val as RevenueFrequency)}
              options={FREQUENCY_OPTIONS}
            />
          </div>

          {/* Notes Field */}
          <div className="form-group">
            <label className="form-label">
              <span>Additional Notes / Description (Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Paid every 25th of the month via BCA transfer"
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
              <TrendingUp size={16} />
              <span>{isSubmitting ? 'Saving...' : streamToEdit ? 'Save Changes' : 'Create Revenue Stream'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

