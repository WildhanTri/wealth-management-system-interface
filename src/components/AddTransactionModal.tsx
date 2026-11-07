import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { addTransaction } from '../store/slices/transactionSlice';
import { calculateFinancials, formatRupiah } from '../utils/financialCalculations';
import { X, Tag, Sparkles, Check, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { TransactionItem, TransactionType } from '../types';
import { apiService } from '../services/apiService';
import { CustomSelect } from './CustomSelect';
import { CurrencyInput } from './CurrencyInput';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries & Essentials',
  'Transportation & Fuel',
  'Bills & Utilities',
  'Entertainment & Lifestyle',
  'Healthcare & Medical',
  'Education & Learning',
  'Other Expense',
];

const INCOME_CATEGORIES = [
  'Asset Liquidation / Sale',
  'Bonus & Incentive',
  'Side Hustle & Freelance',
  'Investment Return & Dividend',
  'Gift & Grant',
  'Refund & Reimbursement',
  'Other Income',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
}) => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);

  const fin = calculateFinancials(profile, assets, transactions);

  // Form State: Type, Title, Category, Date (default today), Amount, Linked Asset
  const getTodayISO = () => new Date().toISOString().split('T')[0];

  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(
    initialType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
  );
  const [date, setDate] = useState(getTodayISO());
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [error, setError] = useState('');

  // Sync initialType when modal opens
  useEffect(() => {
    if (isOpen) {
      setTxType(initialType);
      setCategory(initialType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    }
  }, [isOpen, initialType]);

  // Close on Escape
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

  const isIncome = txType === 'income';
  const numericAmount = typeof amount === 'number' ? amount : 0;
  const workHoursEquivalent =
    fin.hourlyWage > 0 && numericAmount > 0
      ? (numericAmount / fin.hourlyWage).toFixed(1)
      : '0';

  // Format date for display in list
  const formatDateForDisplay = (isoDate: string) => {
    try {
      const parts = isoDate.split('-').map(Number);
      if (parts.length === 3) {
        const dt = new Date(parts[0], parts[1] - 1, parts[2]);
        const today = new Date();
        if (
          dt.getFullYear() === today.getFullYear() &&
          dt.getMonth() === today.getMonth() &&
          dt.getDate() === today.getDate()
        ) {
          return 'Today';
        }
        return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return isoDate;
  };

  const handleTypeChange = (newType: TransactionType) => {
    setTxType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setSelectedAssetId('');
    setError('');
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    if (!assetId) return;
    const found = assets.find((a) => a.id === assetId);
    if (found) {
      setTitle(`Sale of ${found.name}`);
      if (!amount || amount === 0) {
        setAmount(found.estimatedValue);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(isIncome ? 'Income description is required' : 'Expense description is required');
      return;
    }
    if (numericAmount <= 0) {
      setError('Transaction amount must be greater than 0');
      return;
    }

    const txDate = date || getTodayISO();
    const displayDate = formatDateForDisplay(txDate);

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      title: trimmedTitle,
      type: txType,
      amount: numericAmount,
      category,
      date: displayDate,
      emotionalTrigger: 'Need',
      isImpulse: false,
    };

    apiService
      .createTransaction({
        name: trimmedTitle,
        type: txType,
        amount: numericAmount,
        category,
        date: txDate,
        emotionalTrigger: 'Need',
        isImpulse: false,
      })
      .then((res) => {
        if (res.success && res.data) {
          dispatch(
            addTransaction({
              ...newTx,
              id: res.data.id,
              title: (res.data as any).name || newTx.title,
            })
          );
        } else {
          dispatch(addTransaction(newTx));
        }
      })
      .catch((err) => {
        console.error('Failed to record transaction via API:', err);
        dispatch(addTransaction(newTx));
      });

    // Reset and close
    setTitle('');
    setAmount('');
    setDate(getTodayISO());
    setCategory(EXPENSE_CATEGORIES[0]);
    setSelectedAssetId('');
    setError('');
    onClose();
  };

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            borderTopLeftRadius: 'var(--radius-xl)',
            borderTopRightRadius: 'var(--radius-xl)',
            background: isIncome
              ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.04) 0%, rgba(255, 255, 255, 1) 100%)'
              : 'linear-gradient(135deg, rgba(244, 63, 94, 0.04) 0%, rgba(255, 255, 255, 1) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: isIncome ? 'var(--primary-light)' : 'var(--rose-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isIncome ? 'var(--primary)' : 'var(--rose)',
              }}
            >
              {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isIncome ? 'Record Cash Inflow' : 'Record Cash Outflow'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isIncome ? 'Log asset sales, bonuses, or extra revenue' : 'Log daily expenses and discretionary outflows'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Type Segmented Switch */}
        <div style={{ padding: '14px 20px 0 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg-app)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: !isIncome ? '#FFFFFF' : 'transparent',
                color: !isIncome ? 'var(--rose)' : 'var(--text-secondary)',
                boxShadow: !isIncome ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <TrendingDown size={15} />
              <span>Expense / Outflow</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isIncome ? '#FFFFFF' : 'transparent',
                color: isIncome ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: isIncome ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <TrendingUp size={15} />
              <span>Income / Inflow</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ margin: 0 }}>
          <div
            style={{
              padding: '16px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              zIndex: 20,
              overflow: 'visible',
            }}
          >
            {/* Category Selector */}
            <div>
              <CustomSelect
                label={isIncome ? 'Inflow Category' : 'Expense Category'}
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  if (val !== 'Asset Liquidation / Sale') {
                    setSelectedAssetId('');
                  }
                }}
                options={isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
              />
            </div>

            {/* If Inflow is Asset Liquidation / Sale, provide optional Link to Portfolio Asset */}
            {isIncome && category === 'Asset Liquidation / Sale' && assets.length > 0 && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    marginBottom: '6px',
                  }}
                >
                  Link to Portfolio Asset (Optional)
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleAssetSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    fontFamily: 'Outfit, sans-serif',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- None / Custom Inflow --</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({formatRupiah(asset.estimatedValue)})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Selecting an asset will automatically suggest the description and estimated amount.
                </span>
              </div>
            )}

            {/* Description Input */}
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
                {isIncome ? 'Inflow Description' : 'Expense Description'}
              </label>
              <input
                type="text"
                placeholder={
                  isIncome
                    ? 'e.g. Sold Old Motorcycle, Q4 Performance Bonus, Freelance App Project'
                    : 'e.g. Lunch with team, Fuel refueling, Weekly groceries'
                }
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-chip)',
                  border: '1.5px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Date */}
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
                Transaction Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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

            {/* Amount */}
            <div>
              <CurrencyInput
                label={isIncome ? 'Inflow Amount (Rp)' : 'Outflow Amount (Rp)'}
                placeholder="0"
                min={0}
                value={amount}
                onChange={(val) => {
                  setAmount(val);
                  if (error) setError('');
                }}
                prefix="Rp"
              />
            </div>

            {/* Dynamic Helper Note */}
            {numericAmount > 0 && !isIncome && fin.hourlyWage > 0 && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--rose-light)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                }}
              >
                <Sparkles size={14} color="var(--rose)" />
                <div style={{ color: 'var(--text-secondary)' }}>
                  Equates to <strong style={{ color: 'var(--rose)' }}>{workHoursEquivalent} working hours</strong> of life energy
                </div>
              </div>
            )}

            {numericAmount > 0 && isIncome && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                }}
              >
                <Sparkles size={14} color="var(--primary)" />
                <div style={{ color: 'var(--text-secondary)' }}>
                  Cash inflow of <strong style={{ color: 'var(--primary)' }}>+{formatRupiah(numericAmount)}</strong> will boost your net liquid buffer
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: '12px', color: 'var(--rose)', fontWeight: 600, padding: '2px 0' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-light)',
              borderBottomLeftRadius: 'var(--radius-xl)',
              borderBottomRightRadius: 'var(--radius-xl)',
              background: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                background: isIncome ? 'var(--primary)' : 'var(--rose)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isIncome
                  ? '0 2px 8px rgba(5, 150, 105, 0.25)'
                  : '0 2px 8px rgba(244, 63, 94, 0.25)',
              }}
            >
              <Check size={16} strokeWidth={2.6} />
              {isIncome ? 'Save Inflow' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
