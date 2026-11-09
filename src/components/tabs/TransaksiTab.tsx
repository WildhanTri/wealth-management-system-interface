import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { formatRupiah } from '../../utils/financialCalculations';
import { deleteTransaction, reorderTransactions } from '../../store/slices/transactionSlice';
import { apiService } from '../../services/apiService';
import {
  PlusCircle,
  Trash2,
  Pencil,
  ArrowUpDown,
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  Wallet,
  Calendar,
  GripVertical,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { EmotionalTrigger, TransactionType, TransactionItem } from '../../types';
import { AddTransactionModal } from '../AddTransactionModal';
import { CashFlowTrendChart } from '../charts/CashFlowTrendChart';

interface TransaksiTabProps {
  onOpenAddTx: (type?: TransactionType) => void;
}

export const TransaksiTab: React.FC<TransaksiTabProps> = ({ onOpenAddTx }) => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((state) => state.transaction.items);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);

  // Arus Kas Filter: All, Income, Outflow/Expense, Essential Needs, Impulsive
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'needs' | 'impulse'>('all');

  // ----------------------------------------------------------------------
  // CASH FLOW CALCULATIONS (INFLOW + OUTFLOW)
  // ----------------------------------------------------------------------
  const incomeTransactions = transactions.filter((tx) => tx.type === 'income');
  const expenseTransactions = transactions.filter((tx) => tx.type !== 'income');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const netCashFlow = totalIncome - totalExpense;

  const totalImpulse = expenseTransactions
    .filter((t) => t.isImpulse)
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const impulsePercentage = totalExpense > 0 ? Math.round((totalImpulse / totalExpense) * 100) : 0;

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'income') return tx.type === 'income';
    if (filterType === 'expense') return tx.type !== 'income';
    if (filterType === 'needs') return tx.type !== 'income' && !tx.isImpulse;
    if (filterType === 'impulse') return tx.type !== 'income' && tx.isImpulse;
    return true;
  });

  // Date normalization helper (YYYY-MM-DD)
  const normalizeDateKey = (dateStr?: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const trimmed = dateStr.trim();
    const lower = trimmed.toLowerCase();
    const today = new Date();
    if (lower === 'today') {
      return today.toISOString().split('T')[0];
    }
    if (lower === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return yest.toISOString().split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return trimmed;
  };

  const formatDateHeader = (dateKey: string) => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yestISO = yest.toISOString().split('T')[0];

    let relativeBadge: string | null = null;
    if (dateKey === todayISO) {
      relativeBadge = 'Today';
    } else if (dateKey === yestISO) {
      relativeBadge = 'Yesterday';
    }

    const parts = dateKey.split('-').map(Number);
    let dayOfWeek = '';
    let formattedDate = dateKey;

    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
      formattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return { dayOfWeek, formattedDate, relativeBadge };
  };

  interface DateGroup {
    dateKey: string;
    dayOfWeek: string;
    formattedDate: string;
    relativeBadge: string | null;
    transactions: TransactionItem[];
    totalInflow: number;
    totalOutflow: number;
  }

  // Group filtered transactions by date (descending order)
  const groupedByDate: DateGroup[] = useMemo(() => {
    const map = new Map<string, TransactionItem[]>();

    filteredTransactions.forEach((tx) => {
      const key = normalizeDateKey(tx.date);
      const existing = map.get(key) || [];
      existing.push(tx);
      map.set(key, existing);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map((dateKey) => {
      const txList = map.get(dateKey) || [];
      const { dayOfWeek, formattedDate, relativeBadge } = formatDateHeader(dateKey);
      const totalInflow = txList
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalOutflow = txList
        .filter((t) => t.type !== 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      return {
        dateKey,
        dayOfWeek,
        formattedDate,
        relativeBadge,
        transactions: txList,
        totalInflow,
        totalOutflow,
      };
    });
  }, [filteredTransactions]);

  // Drag and drop state for reordering within date groups
  const [draggedTxId, setDraggedTxId] = useState<string | null>(null);
  const [dragOverTxId, setDragOverTxId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedTxId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTxId !== id) {
      setDragOverTxId(id);
    }
  };

  const handleDrop = (targetId: string, groupDateKey: string) => {
    if (!draggedTxId || draggedTxId === targetId) {
      setDraggedTxId(null);
      setDragOverTxId(null);
      return;
    }

    const sourceIdx = transactions.findIndex((t) => t.id === draggedTxId);
    const targetIdx = transactions.findIndex((t) => t.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...transactions];
      const [movedItem] = updated.splice(sourceIdx, 1);
      const updatedMoved = {
        ...movedItem,
        date: groupDateKey,
      };
      updated.splice(targetIdx, 0, updatedMoved);

      dispatch(reorderTransactions(updated));
      apiService.reorderTransactions(updated.map((t) => t.id)).catch(console.error);
    }

    setDraggedTxId(null);
    setDragOverTxId(null);
  };

  const handleDragEnd = () => {
    setDraggedTxId(null);
    setDragOverTxId(null);
  };

  const getTriggerBadge = (trigger: EmotionalTrigger) => {
    switch (trigger) {
      case 'FOMO':
        return { label: 'FOMO / Trend', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
      case 'FlashSale':
        return { label: 'Flash Sale / Promo', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'StressReward':
        return { label: 'Self Reward / Stress', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
      case 'Boredom':
        return { label: 'Boredom / Impulse', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
      case 'Need':
      default:
        return { label: 'Essential Need', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    }
  };

  return (
    <div className="tab-pane animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Page Content Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
            Cash Flow Ledger &amp; Transactions
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Daily cash movements, outflow discipline &amp; discretionary expense tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 800,
            }}
            className="tabular-nums"
          >
            {transactions.length} Transactions
          </span>
          <button onClick={() => onOpenAddTx('expense')} className="btn-primary">
            <PlusCircle size={15} />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 1. Cash Flow Dynamics Chart (Stand-alone Top Full-Width Row) */}
      <CashFlowTrendChart transactions={transactions} onOpenAddTx={onOpenAddTx} />

      {/* 2. CASH FLOW (Desktop Master-Detail 4 + 8) */}
      <div className="bento-grid" style={{ alignItems: 'start' }}>
        {/* Left Column: Cash Flow Overview & Filters (Sticky Desktop) */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '88px' }}>
          {/* 1. Master Consolidated Net Cash Flow Card */}
          <div
            className="glass"
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Net Cash Flow
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Inflow &amp; Outflow Balance
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: netCashFlow >= 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: netCashFlow >= 0 ? 'var(--emerald)' : 'var(--rose)',
                }}
              >
                {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Consolidated Balance
              </span>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: netCashFlow >= 0 ? 'var(--emerald)' : 'var(--rose)',
                  marginTop: '2px',
                }}
              >
                {netCashFlow >= 0 ? `+${formatRupiah(netCashFlow)}` : `-${formatRupiah(Math.abs(netCashFlow))}`}
              </div>
            </div>

            {/* Inflow vs Outflow Mini Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(5, 150, 105, 0.04)',
                  border: '1px solid rgba(5, 150, 105, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--emerald)', fontWeight: 700 }}>
                  <TrendingUp size={13} />
                  <span>Inflow</span>
                </div>
                <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--emerald)', marginTop: '2px' }}>
                  +{formatRupiah(totalIncome)}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{incomeTransactions.length} records</span>
              </div>

              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(244, 63, 94, 0.04)',
                  border: '1px solid rgba(244, 63, 94, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--rose)', fontWeight: 700 }}>
                  <TrendingDown size={13} />
                  <span>Outflow</span>
                </div>
                <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--rose)', marginTop: '2px' }}>
                  -{formatRupiah(totalExpense)}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{expenseTransactions.length} records</span>
              </div>
            </div>
          </div>

          {/* 2. Impulse Velocity / Spending Quality Card */}
          <div
            className="glass"
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: impulsePercentage > 40 ? 'var(--rose-light)' : 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: impulsePercentage > 40 ? 'var(--rose)' : 'var(--primary)',
                }}
              >
                <PieChart size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Impulse Velocity
                </h4>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Outflow Discipline Index</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Impulsive Outflow Rate
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: impulsePercentage > 40 ? 'var(--rose)' : 'var(--emerald)',
                  }}
                >
                  {impulsePercentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: '8px',
                  background: '#E2ECE5',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  margin: '8px 0 10px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${impulsePercentage}%`,
                    background: 'linear-gradient(90deg, #F59E0B 0%, #F43F5E 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Breakdown Amounts */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-light)',
                fontSize: '11.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--emerald)' }}></span>
                  Essential Needs:
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                  {formatRupiah(totalExpense - totalImpulse)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--rose)' }}></span>
                  Impulsive / Wants:
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--rose)' }}>
                  {formatRupiah(totalImpulse)}
                </span>
              </div>
            </div>

            {/* Filter Buttons in Card */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Filter Cash Flow Ledger:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button
                  onClick={() => setFilterType('all')}
                  style={{
                    width: '100%',
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: filterType === 'all' ? 'var(--primary-light)' : 'var(--bg-chip)',
                    color: filterType === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                    border: `1px solid ${filterType === 'all' ? 'var(--border-subtle)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span>All Cash Flow</span>
                  <span className="tabular-nums">{transactions.length}</span>
                </button>

                <button
                  onClick={() => setFilterType('income')}
                  style={{
                    width: '100%',
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: filterType === 'income' ? 'rgba(5, 150, 105, 0.12)' : 'var(--bg-chip)',
                    color: filterType === 'income' ? 'var(--emerald)' : 'var(--text-secondary)',
                    border: `1px solid ${filterType === 'income' ? 'rgba(5, 150, 105, 0.3)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span>Inflow (Income &amp; Assets)</span>
                  <span className="tabular-nums">{incomeTransactions.length}</span>
                </button>

                <button
                  onClick={() => setFilterType('expense')}
                  style={{
                    width: '100%',
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: filterType === 'expense' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-chip)',
                    color: filterType === 'expense' ? 'var(--rose)' : 'var(--text-secondary)',
                    border: `1px solid ${filterType === 'expense' ? 'rgba(244, 63, 94, 0.25)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span>Outflow (Expenses)</span>
                  <span className="tabular-nums">{expenseTransactions.length}</span>
                </button>

                <button
                  onClick={() => setFilterType('needs')}
                  style={{
                    width: '100%',
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: filterType === 'needs' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-chip)',
                    color: filterType === 'needs' ? 'var(--emerald)' : 'var(--text-secondary)',
                    border: `1px solid ${filterType === 'needs' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span>&bull; Essential Needs Only</span>
                  <span className="tabular-nums">{expenseTransactions.filter((t) => !t.isImpulse).length}</span>
                </button>

                <button
                  onClick={() => setFilterType('impulse')}
                  style={{
                    width: '100%',
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: filterType === 'impulse' ? 'var(--rose-light)' : 'var(--bg-chip)',
                    color: filterType === 'impulse' ? 'var(--rose)' : 'var(--text-secondary)',
                    border: `1px solid ${filterType === 'impulse' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span>&bull; Impulsive &amp; Wants</span>
                  <span className="tabular-nums">{expenseTransactions.filter((t) => t.isImpulse).length}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ledger Detail List */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            className="glass"
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Cash Flow Ledger
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Showing {filteredTransactions.length} of {transactions.length} transactions &bull; Inflow: <strong style={{ color: 'var(--emerald)' }}>+{formatRupiah(totalIncome)}</strong> | Outflow: <strong style={{ color: 'var(--rose)' }}>-{formatRupiah(totalExpense)}</strong>
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-chip)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              Sort: Newest
            </span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div
              className="glass"
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <ArrowUpDown size={24} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No transactions found in this filter
              </h4>
              <p style={{ fontSize: '12px', maxWidth: '340px' }}>
                No cash flow records match the selected filter.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button onClick={() => onOpenAddTx('expense')} className="btn-primary" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                  <PlusCircle size={14} />
                  <span>Record Expense</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {groupedByDate.map((group) => (
                <div
                  key={group.dateKey}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {/* Date Group Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border-light)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={14} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {group.dayOfWeek ? `${group.dayOfWeek}, ${group.formattedDate}` : group.formattedDate}
                        </span>
                        {group.relativeBadge && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: group.relativeBadge === 'Today' ? 'rgba(5, 150, 105, 0.12)' : 'var(--bg-chip)',
                              color: group.relativeBadge === 'Today' ? 'var(--emerald)' : 'var(--text-secondary)',
                              border: `1px solid ${group.relativeBadge === 'Today' ? 'rgba(5, 150, 105, 0.25)' : 'var(--border-light)'}`,
                            }}
                          >
                            {group.relativeBadge}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          &bull; {group.transactions.length} {group.transactions.length === 1 ? 'record' : 'records'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700 }}>
                      {group.totalInflow > 0 && (
                        <span style={{ color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <TrendingUp size={12} />
                          +{formatRupiah(group.totalInflow)}
                        </span>
                      )}
                      {group.totalOutflow > 0 && (
                        <span style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <TrendingDown size={12} />
                          -{formatRupiah(group.totalOutflow)}
                        </span>
                      )}
                      {group.totalInflow === 0 && group.totalOutflow === 0 && (
                        <span style={{ color: 'var(--text-muted)' }}>Rp 0</span>
                      )}
                    </div>
                  </div>

                  {/* Transaction cards within this date group */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.transactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const badge = getTriggerBadge(tx.emotionalTrigger);
                      const isBeingDragged = draggedTxId === tx.id;
                      const isOver = dragOverTxId === tx.id && !isBeingDragged;

                      return (
                        <div
                          key={tx.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, tx.id)}
                          onDragOver={(e) => handleDragOver(e, tx.id)}
                          onDragLeave={() => {
                            if (dragOverTxId === tx.id) setDragOverTxId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(tx.id, group.dateKey);
                          }}
                          onDragEnd={handleDragEnd}
                          className="glass"
                          style={{
                            padding: '14px 18px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isBeingDragged ? 'var(--bg-app)' : '#FFFFFF',
                            border: isOver
                              ? '2px dashed var(--primary)'
                              : isIncome
                              ? '1px solid rgba(5, 150, 105, 0.2)'
                              : '1px solid var(--border-light)',
                            boxShadow: isOver
                              ? '0 0 0 4px var(--primary-light)'
                              : '0 1px 3px rgba(0,0,0,0.02)',
                            opacity: isBeingDragged ? 0.45 : 1,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Left: Grip Handle + Icon & Details */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--text-muted)',
                                cursor: 'grab',
                                padding: '4px 2px',
                                transition: 'color 0.15s ease',
                              }}
                              title="Drag to reorder within this date"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <GripVertical size={16} />
                            </div>

                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: isIncome
                                  ? 'var(--primary-light)'
                                  : tx.isImpulse
                                  ? 'var(--rose-light)'
                                  : 'rgba(0, 0, 0, 0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {isIncome ? (
                                <Wallet size={19} color="var(--primary)" />
                              ) : tx.isImpulse ? (
                                <ShoppingBag size={19} color="var(--rose)" />
                              ) : (
                                <ShoppingCart size={19} color="var(--text-secondary)" />
                              )}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{ fontSize: '14.5px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                                  {tx.title}
                                </h4>
                                {isIncome ? (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      color: 'var(--emerald)',
                                      background: 'rgba(5, 150, 105, 0.12)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <ArrowDownLeft size={10} />
                                    Inflow
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      color: badge.color,
                                      background: badge.bg,
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    padding: '1px 7px',
                                    borderRadius: '4px',
                                    color: isIncome ? 'var(--emerald)' : 'var(--primary)',
                                    background: isIncome ? 'rgba(5, 150, 105, 0.08)' : 'var(--primary-light)',
                                  }}
                                >
                                  {tx.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount & Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                className="tabular-nums"
                                style={{
                                  fontSize: '15.5px',
                                  fontWeight: 800,
                                  color: isIncome
                                    ? 'var(--emerald)'
                                    : tx.isImpulse
                                    ? 'var(--rose)'
                                    : 'var(--text-primary)',
                                }}
                              >
                                {isIncome ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                              </div>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {isIncome
                                  ? 'Liquid Inflow'
                                  : tx.isImpulse
                                  ? 'Impulsive Outflow'
                                  : 'Essential Outflow'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingTx(tx)}
                                style={{
                                  color: 'var(--text-muted)',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  background: 'var(--bg-chip)',
                                  border: '1px solid var(--border-light)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--primary)';
                                  e.currentTarget.style.borderColor = 'var(--primary)';
                                  e.currentTarget.style.background = 'var(--primary-light)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-muted)';
                                  e.currentTarget.style.borderColor = 'var(--border-light)';
                                  e.currentTarget.style.background = 'var(--bg-chip)';
                                }}
                                title="Edit transaction"
                                aria-label={`Edit transaction ${tx.title}`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete transaction "${tx.title}"?`)) {
                                    dispatch(deleteTransaction(tx.id));
                                    apiService.deleteTransaction(tx.id).catch(console.error);
                                  }
                                }}
                                style={{
                                  color: 'var(--text-muted)',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  background: 'var(--bg-chip)',
                                  border: '1px solid var(--border-light)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--rose)';
                                  e.currentTarget.style.borderColor = 'var(--rose)';
                                  e.currentTarget.style.background = 'var(--rose-light)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-muted)';
                                  e.currentTarget.style.borderColor = 'var(--border-light)';
                                  e.currentTarget.style.background = 'var(--bg-chip)';
                                }}
                                title="Delete transaction"
                                aria-label={`Delete transaction ${tx.title}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <AddTransactionModal
          isOpen={Boolean(editingTx)}
          onClose={() => setEditingTx(null)}
          transactionToEdit={editingTx}
        />
      )}
    </div>
  );
};
