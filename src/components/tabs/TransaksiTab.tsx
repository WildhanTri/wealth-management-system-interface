import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { formatRupiah } from '../../utils/financialCalculations';
import { deleteTransaction, addTransaction } from '../../store/slices/transactionSlice';
import { apiService } from '../../services/apiService';
import { deletePlan, updatePlan } from '../../store/slices/planSlice';
import {
  PlusCircle,
  Trash2,
  Tag,
  Filter,
  AlertTriangle,
  Target,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Edit3,
  PiggyBank,
  Sparkles,
  Check,
  ChevronRight,
  Clock,
  Plus,
  RotateCcw,
  CheckCircle,
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';
import { EmotionalTrigger, PlannedExpense, PlanPriority, TransactionItem, TransactionType } from '../../types';
import { AddPlanModal } from '../AddPlanModal';
import { AllocateFundsModal } from '../AllocateFundsModal';

interface TransaksiTabProps {
  onOpenAddTx: (type?: TransactionType) => void;
}

export const TransaksiTab: React.FC<TransaksiTabProps> = ({ onOpenAddTx }) => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((state) => state.transaction.items);
  const plans = useAppSelector((state) => state.plan.items);

  // Sub-Tab: 'arus_kas' | 'rencana'
  const [activeSubTab, setActiveSubTab] = useState<'arus_kas' | 'rencana'>('arus_kas');

  // Arus Kas Filter: All, Income, Outflow/Expense, Essential Needs, Impulsive
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'needs' | 'impulse'>('all');

  // Rencana Filter
  const [planFilter, setPlanFilter] = useState<'all' | 'active' | 'completed' | 'high_priority'>('all');

  // Modals for Rencana
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<PlannedExpense | null>(null);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [planToAllocate, setPlanToAllocate] = useState<PlannedExpense | null>(null);

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

  // ----------------------------------------------------------------------
  // PLANS CALCULATIONS & HELPERS
  // ----------------------------------------------------------------------
  const activePlans = plans.filter((p) => p.status === 'active');
  const completedPlans = plans.filter((p) => p.status === 'completed');

  const filteredPlans = plans.filter((p) => {
    if (planFilter === 'active') return p.status === 'active';
    if (planFilter === 'completed') return p.status === 'completed';
    if (planFilter === 'high_priority') return p.priority === 'high';
    return true;
  });

  const totalPlannedActiveTarget = activePlans.reduce((sum, p) => sum + p.targetAmount, 0);
  const totalPlannedActiveCurrent = activePlans.reduce((sum, p) => sum + (p.currentAmount || 0), 0);
  const overallActiveProgressPct =
    totalPlannedActiveTarget > 0
      ? Math.min(100, Math.round((totalPlannedActiveCurrent / totalPlannedActiveTarget) * 100))
      : 0;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Elektronik & Gadget':
      case 'Electronics & Gadgets':
        return '💻';
      case 'Kendaraan & Transportasi':
      case 'Vehicles & Transport':
        return '🚗';
      case 'Liburan & Wisata':
      case 'Travel & Vacation':
        return '🏖️';
      case 'Pendidikan & Kursus':
      case 'Education & Courses':
        return '🎓';
      case 'Kebutuhan Rumah Tangga':
      case 'Home & Living':
        return '🏠';
      case 'Keluarga & Hadiah':
      case 'Family & Gifts':
        return '🎁';
      case 'Kesehatan & Wellness':
      case 'Health & Wellness':
        return '💊';
      case 'Tagihan & Kewajiban':
      case 'Bills & Obligations':
        return '📄';
      default:
        return '🎯';
    }
  };

  const getPriorityBadge = (priority: PlanPriority) => {
    switch (priority) {
      case 'high':
        return { label: 'High Priority', color: 'var(--rose)', bg: 'rgba(244, 63, 94, 0.12)' };
      case 'medium':
        return { label: 'Medium Priority', color: '#D97706', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'low':
      default:
        return { label: 'Flexible', color: 'var(--primary)', bg: 'rgba(72, 176, 125, 0.12)' };
    }
  };

  const getRemainingDaysInfo = (targetDateStr: string, status: string) => {
    if (status === 'completed') {
      return { text: 'Achieved', color: 'var(--primary)', bg: 'rgba(72, 176, 125, 0.12)' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = targetDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      if (diffDays === 1) {
        return { text: 'Tomorrow', color: '#D97706', bg: 'rgba(245, 158, 11, 0.12)' };
      }
      return { text: `${diffDays} days left`, color: 'var(--text-secondary)', bg: '#F1F5F3' };
    } else if (diffDays === 0) {
      return { text: 'Today!', color: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' };
    } else {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'var(--rose)', bg: 'rgba(244, 63, 94, 0.12)' };
    }
  };

  // Handle Realize Plan into cash flow transaction
  const handleRealizePlan = async (plan: PlannedExpense) => {
    const shouldAddTx = window.confirm(
      `Realize plan "${plan.title}"?\n\nThe plan will be marked as 'Achieved'.\n\nClick OK if you also want to automatically log an expense of ${formatRupiah(
        plan.targetAmount
      )} to your Cash Flow ledger!`
    );

    if (shouldAddTx) {
      const newTx: TransactionItem = {
        id: `tx-plan-${Date.now()}`,
        title: plan.title,
        type: 'expense',
        amount: plan.targetAmount,
        category: plan.category,
        date: new Date().toISOString().split('T')[0],
        emotionalTrigger: 'Need',
        isImpulse: false,
      };
      dispatch(addTransaction(newTx));
      apiService
        .createTransaction({
          name: newTx.title,
          type: 'expense',
          amount: newTx.amount,
          category: newTx.category,
          date: newTx.date,
          emotionalTrigger: 'Need',
          isImpulse: false,
        })
        .catch(console.warn);
    }

    const updatedPlan: PlannedExpense = {
      ...plan,
      status: 'completed',
      currentAmount: Math.max(plan.currentAmount, plan.targetAmount),
      updatedAt: Date.now(),
    };
    dispatch(updatePlan(updatedPlan));
    apiService.updatePlan(plan.id, { status: 'completed' }).catch(console.warn);
  };

  // Reopen completed plan
  const handleReopenPlan = async (plan: PlannedExpense) => {
    if (window.confirm(`Reopen plan "${plan.title}"?`)) {
      const updatedPlan: PlannedExpense = {
        ...plan,
        status: 'active',
        updatedAt: Date.now(),
      };
      dispatch(updatePlan(updatedPlan));
      apiService.updatePlan(plan.id, { status: 'active' }).catch(console.warn);
    }
  };

  // Delete plan
  const handleDeletePlan = async (id: string, title: string) => {
    if (window.confirm(`Delete plan "${title}"?`)) {
      dispatch(deletePlan(id));
      apiService.deletePlan(id).catch(console.warn);
    }
  };

  return (
    <div className="tab-pane animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Segmented Sub-Tab Switcher & Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            background: '#EAEFEA',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setActiveSubTab('arus_kas')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeSubTab === 'arus_kas' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'arus_kas' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeSubTab === 'arus_kas' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <ArrowUpDown size={15} color={activeSubTab === 'arus_kas' ? 'var(--primary)' : 'currentColor'} />
            <span>Cash Flow Ledger</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '10px',
                background: activeSubTab === 'arus_kas' ? 'var(--primary-light)' : 'rgba(0,0,0,0.06)',
                color: activeSubTab === 'arus_kas' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('rencana')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeSubTab === 'rencana' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'rencana' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeSubTab === 'rencana' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <Target size={15} color={activeSubTab === 'rencana' ? 'var(--primary)' : 'currentColor'} />
            <span>Planned Expenses</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '10px',
                background: activeSubTab === 'rencana' ? 'var(--primary-light)' : 'rgba(0,0,0,0.06)',
                color: activeSubTab === 'rencana' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {activePlans.length}
            </span>
          </button>
        </div>

        {/* Action button based on active sub tab */}
        {activeSubTab === 'arus_kas' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onOpenAddTx('income')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Record additional income (e.g. asset sales, bonuses, side income)"
            >
              <TrendingUp size={15} />
              <span>+ Record Inflow</span>
            </button>
            <button onClick={() => onOpenAddTx('expense')} className="btn-primary">
              <PlusCircle size={15} />
              <span>Record Expense</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setPlanToEdit(null);
              setIsAddPlanOpen(true);
            }}
            className="btn-primary"
          >
            <PlusCircle size={16} />
            Create Planned Expense
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CASH FLOW (Desktop Master-Detail 4 + 8)                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'arus_kas' && (
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
                      Inflow & Outflow Balance
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
                    <span>Inflow (Income & Assets)</span>
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
          <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  Displaying {filteredTransactions.length} of {transactions.length} records &bull; Inflow: <strong style={{ color: 'var(--emerald)' }}>+{formatRupiah(totalIncome)}</strong> | Outflow: <strong style={{ color: 'var(--rose)' }}>-{formatRupiah(totalExpense)}</strong>
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
                Sort: Most Recent
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
                  No transactions recorded under this filter
                </h4>
                <p style={{ fontSize: '12px', maxWidth: '340px' }}>
                  {filterType === 'income'
                    ? 'No cash inflows found. Click below to log income from asset liquidation, bonus, or extra earnings.'
                    : 'No cash flow records match your current filter. Click below to record a transaction.'}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={() => onOpenAddTx('income')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-light)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--primary)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <TrendingUp size={14} />
                    <span>Record Inflow</span>
                  </button>
                  <button onClick={() => onOpenAddTx('expense')} className="btn-primary" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                    <PlusCircle size={14} />
                    <span>Record Outflow</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const badge = getTriggerBadge(tx.emotionalTrigger);

                  return (
                    <div
                      key={tx.id}
                      className="glass"
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFFFFF',
                        border: isIncome ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid var(--border-light)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Left: Icon & Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                            fontSize: '18px',
                            flexShrink: 0,
                            color: isIncome ? 'var(--primary)' : 'inherit',
                          }}
                        >
                          {isIncome ? '💰' : tx.isImpulse ? '🛍️' : '🛒'}
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
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.date}</span>
                            <span style={{ color: 'var(--border-medium)', fontSize: '10px' }}>&bull;</span>
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
                        <button
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
                            transition: 'color 0.2s',
                          }}
                          title="Delete transaction record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PLANS (Horizontal Metrics + Multi-Column Card Grid)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'rencana' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top 3 Horizontal Summary Cards */}
          <div className="bento-grid">
            <div
              className="col-span-4 glass"
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total Target: Active Plans
              </span>
              <div
                className="tabular-nums"
                style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}
              >
                {formatRupiah(totalPlannedActiveTarget)}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Across {activePlans.length} active funding targets
              </span>
            </div>

            <div
              className="col-span-4 glass"
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Funds Allocated / Saved
              </span>
              <div
                className="tabular-nums"
                style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}
              >
                {formatRupiah(totalPlannedActiveCurrent)}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Remaining target: {formatRupiah(Math.max(0, totalPlannedActiveTarget - totalPlannedActiveCurrent))}
              </span>
            </div>

            <div
              className="col-span-4 glass"
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Global Funding Readiness
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {completedPlans.length} Achieved
                </span>
              </div>
              <div
                className="tabular-nums"
                style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}
              >
                {overallActiveProgressPct}%
              </div>
              {/* Mini progress bar */}
              <div
                style={{
                  height: '6px',
                  background: '#E2ECE5',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '8px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${overallActiveProgressPct}%`,
                    background: 'var(--primary-gradient)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPlanFilter('all')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: planFilter === 'all' ? 'var(--primary)' : 'var(--bg-chip)',
                  color: planFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${planFilter === 'all' ? 'var(--primary)' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                }}
              >
                All ({plans.length})
              </button>
              <button
                onClick={() => setPlanFilter('active')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: planFilter === 'active' ? 'var(--primary)' : 'var(--bg-chip)',
                  color: planFilter === 'active' ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${planFilter === 'active' ? 'var(--primary)' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                }}
              >
                In Progress ({activePlans.length})
              </button>
              <button
                onClick={() => setPlanFilter('completed')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: planFilter === 'completed' ? 'var(--emerald)' : 'var(--bg-chip)',
                  color: planFilter === 'completed' ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${planFilter === 'completed' ? 'var(--emerald)' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                }}
              >
                Achieved ({completedPlans.length})
              </button>
              <button
                onClick={() => setPlanFilter('high_priority')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: planFilter === 'high_priority' ? 'var(--rose)' : 'var(--bg-chip)',
                  color: planFilter === 'high_priority' ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${planFilter === 'high_priority' ? 'var(--rose)' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                }}
              >
                High Priority ({plans.filter((p) => p.priority === 'high').length})
              </button>
            </div>
          </div>

          {/* Multi-Column Card Grid for Desktop */}
          {filteredPlans.length === 0 ? (
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
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Target size={26} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {planFilter === 'all'
                  ? 'No Planned Expenses Yet'
                  : 'No Plans Found Under This Filter'}
              </h4>
              <p style={{ fontSize: '12.5px', maxWidth: '380px', lineHeight: 1.5 }}>
                Record planned future investments, equipment, or major milestones to ensure funding discipline and curb impulse splurges.
              </p>
              <button
                onClick={() => {
                  setPlanToEdit(null);
                  setIsAddPlanOpen(true);
                }}
                className="btn-primary"
                style={{ marginTop: '6px' }}
              >
                <Plus size={16} />
                Create First Plan
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredPlans.map((plan) => {
                const priorityBadge = getPriorityBadge(plan.priority);
                const daysInfo = getRemainingDaysInfo(plan.targetDate, plan.status);
                const currentAmt = plan.currentAmount || 0;
                const pct =
                  plan.targetAmount > 0
                    ? Math.min(100, Math.round((currentAmt / plan.targetAmount) * 100))
                    : 0;
                const isCompleted = plan.status === 'completed';

                return (
                  <div
                    key={plan.id}
                    className="glass"
                    style={{
                      padding: '18px 20px',
                      borderRadius: 'var(--radius-lg)',
                      background: '#FFFFFF',
                      border: `1px solid ${
                        isCompleted
                          ? 'rgba(72, 176, 125, 0.4)'
                          : plan.priority === 'high'
                          ? 'rgba(244, 63, 94, 0.3)'
                          : 'var(--border-light)'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      {/* Top Row: Category Icon + Title + Priority */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: isCompleted ? 'rgba(72, 176, 125, 0.12)' : '#F1F6F3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              flexShrink: 0,
                            }}
                          >
                            {getCategoryIcon(plan.category)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <h4
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 800,
                                  color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                }}
                              >
                                {plan.title}
                              </h4>
                              {isCompleted && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    color: 'var(--primary)',
                                    background: 'rgba(72, 176, 125, 0.15)',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  ✓ Achieved
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {plan.category}
                              </span>
                              <span style={{ color: 'var(--border-medium)', fontSize: '10px' }}>&bull;</span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: priorityBadge.color,
                                  background: priorityBadge.bg,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {priorityBadge.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Target Date Badge */}
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: daysInfo.bg,
                              color: daysInfo.color,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Calendar size={12} />
                            {daysInfo.text}
                          </span>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            Target: {plan.targetDate}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Amounts Box */}
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: '#F9FCFA',
                          border: '1px solid var(--border-light)',
                          marginTop: '12px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: '6px',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Funds Saved</span>
                            <div className="tabular-nums" style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--primary)' }}>
                              {formatRupiah(currentAmt)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Target Budget</span>
                            <div className="tabular-nums" style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {formatRupiah(plan.targetAmount)}
                            </div>
                          </div>
                        </div>

                        <div style={{ height: '7px', background: '#E0ECE4', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: isCompleted
                                ? 'var(--emerald)'
                                : pct >= 80
                                ? 'linear-gradient(90deg, #48B07D 0%, #10B981 100%)'
                                : 'linear-gradient(90deg, #F59E0B 0%, #48B07D 100%)',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            marginTop: '6px',
                            fontWeight: 600,
                          }}
                        >
                          <span>Progress: {pct}%</span>
                          <span className="tabular-nums">
                            {isCompleted
                              ? 'Fully Funded'
                              : `Remaining: ${formatRupiah(Math.max(0, plan.targetAmount - currentAmt))}`}
                          </span>
                        </div>
                      </div>

                      {/* Notes if available */}
                      {plan.notes && (
                        <p
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--text-secondary)',
                            background: '#F8FAF9',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontStyle: 'italic',
                            margin: '10px 0 0',
                          }}
                        >
                          💬 &ldquo;{plan.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isCompleted ? (
                          <>
                            <button
                              onClick={() => {
                                setPlanToAllocate(plan);
                                setIsAllocateOpen(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(72, 176, 125, 0.12)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(72, 176, 125, 0.25)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <PiggyBank size={14} />
                              + Allocate Funds
                            </button>
                            <button
                              onClick={() => handleRealizePlan(plan)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--primary-gradient)',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 8px rgba(72, 176, 125, 0.25)',
                              }}
                              title="Mark as achieved & record into cash flow"
                            >
                              <CheckCircle2 size={14} />
                              Realize
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReopenPlan(plan)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: '#F1F5F3',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-light)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RotateCcw size={13} />
                            Reactivate
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => {
                            setPlanToEdit(plan);
                            setIsAddPlanOpen(true);
                          }}
                          style={{
                            padding: '7px',
                            borderRadius: '6px',
                            background: 'var(--bg-chip)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                          title="Edit Plan"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.title)}
                          style={{
                            padding: '7px',
                            borderRadius: '6px',
                            background: 'var(--bg-chip)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--rose)',
                            cursor: 'pointer',
                          }}
                          title="Delete Plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddPlanModal
        isOpen={isAddPlanOpen}
        onClose={() => {
          setIsAddPlanOpen(false);
          setPlanToEdit(null);
        }}
        planToEdit={planToEdit}
      />

      <AllocateFundsModal
        isOpen={isAllocateOpen}
        onClose={() => {
          setIsAllocateOpen(false);
          setPlanToAllocate(null);
        }}
        plan={planToAllocate}
      />
    </div>
  );
};
