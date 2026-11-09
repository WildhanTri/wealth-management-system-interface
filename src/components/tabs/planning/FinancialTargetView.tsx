import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  Target,
  Plus,
  Search,
  Calendar,
  PiggyBank,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Edit2,
  Trash2,
  Coins,
  Umbrella,
  Home,
  Car,
  GraduationCap,
  Plane,
  Laptop,
  Heart,
  Sunset,
  GripVertical,
  Wrench,
  ShoppingBag,
  Music,
  ShieldCheck,
  RotateCcw,
  Check,
  Layers,
} from 'lucide-react';
import {
  FinancialTargetItem,
  TargetCategory,
  TargetPriority,
  TargetType,
  TargetTimeframe,
  TransactionItem,
} from '../../../types';
import { formatRupiah } from '../../../utils/financialCalculations';
import { apiService } from '../../../services/apiService';
import {
  removeFinancialTarget,
  reorderFinancialTargets,
  updateFinancialTargetInState,
} from '../../../store/slices/planningSlice';
import { addTransaction } from '../../../store/slices/transactionSlice';
import { AddFinancialTargetModal } from '../../planning/AddFinancialTargetModal';
import { AllocateTargetFundsModal } from '../../planning/AllocateTargetFundsModal';

export const CATEGORY_META: Record<
  TargetCategory,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  // Needs - Minor / Small Targets
  vehicle_maintenance: {
    label: 'Vehicle Maintenance (Car & Bike)',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <Wrench size={13} />,
  },
  home_maintenance: {
    label: 'Home Repairs & Routine Care',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    icon: <Home size={13} />,
  },
  medical_health: {
    label: 'Healthcare & Medical Care',
    color: '#E11D48',
    bg: 'rgba(225, 29, 72, 0.12)',
    icon: <Heart size={13} />,
  },
  tax_bill: {
    label: 'Annual Taxes & Mandatory Dues',
    color: '#0284C7',
    bg: 'rgba(2, 132, 199, 0.12)',
    icon: <Target size={13} />,
  },
  other_needs_short: {
    label: 'Other Minor Essential Needs',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <ShieldCheck size={13} />,
  },

  // Needs - Major / Big Targets
  property: {
    label: 'Home & Real Estate',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    icon: <Home size={13} />,
  },
  emergency_fund: {
    label: 'Emergency Fund & Safety Cushion',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <Umbrella size={13} />,
  },
  education: {
    label: 'Education & Career Training',
    color: '#0284C7',
    bg: 'rgba(2, 132, 199, 0.12)',
    icon: <GraduationCap size={13} />,
  },
  retirement: {
    label: 'Retirement & Independence (FIRE)',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    icon: <Sunset size={13} />,
  },
  other_needs_long: {
    label: 'Other Major Essential Targets',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <ShieldCheck size={13} />,
  },

  // Wants - Minor / Small Targets
  gadget: {
    label: 'Tech & Gadgets (Phone, Laptop)',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    icon: <Laptop size={13} />,
  },
  shopping: {
    label: 'Fashion, Apparel & Shopping',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    icon: <ShoppingBag size={13} />,
  },
  entertainment: {
    label: 'Entertainment & Concerts',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    icon: <Music size={13} />,
  },
  hobby: {
    label: 'Hobbies & Lifestyle Recreation',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    icon: <Sparkles size={13} />,
  },
  other_wants_short: {
    label: 'Other Minor Wants',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    icon: <Target size={13} />,
  },

  // Wants - Major / Big Targets
  travel: {
    label: 'Dream Vacation & Travel',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    icon: <Plane size={13} />,
  },
  vehicle: {
    label: 'Dream Vehicle (Car / Motorbike)',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.12)',
    icon: <Car size={13} />,
  },
  wedding: {
    label: 'Wedding & Family Celebration',
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.12)',
    icon: <Heart size={13} />,
  },
  investment: {
    label: 'Business Venture & Investment Capital',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
    icon: <TrendingUp size={13} />,
  },
  other_wants_long: {
    label: 'Other Major Wants',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
    icon: <Sparkles size={13} />,
  },

  // Legacy fallback
  other: {
    label: 'Other Financial Target',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
    icon: <Target size={13} />,
  },
};

const PRIORITY_META: Record<
  TargetPriority,
  { label: string; color: string; bg: string }
> = {
  high: {
    label: 'High Priority',
    color: 'var(--rose)',
    bg: 'rgba(244, 63, 94, 0.12)',
  },
  medium: {
    label: 'Medium Priority',
    color: '#D97706',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  low: {
    label: 'Low Priority',
    color: 'var(--text-secondary)',
    bg: 'rgba(0, 0, 0, 0.06)',
  },
};

export function getTargetClassification(target: FinancialTargetItem): {
  targetType: TargetType;
  timeframe: TargetTimeframe;
} {
  if (target.targetType && target.timeframe) {
    return { targetType: target.targetType, timeframe: target.timeframe };
  }
  const cat = target.category;
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

export const FinancialTargetView: React.FC = () => {
  const dispatch = useAppDispatch();
  const targets = useAppSelector((state) => state.planning.financialTargets);

  const [searchQuery, setSearchQuery] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | TargetType>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | TargetTimeframe>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | TargetCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'paused'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TargetPriority>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetToEdit, setTargetToEdit] = useState<FinancialTargetItem | null>(null);
  const [targetToAllocate, setTargetToAllocate] = useState<FinancialTargetItem | null>(null);

  // Drag and drop states
  const [draggedTargetId, setDraggedTargetId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTargetId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTargetId !== id) {
      setDragOverTargetId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedTargetId || draggedTargetId === targetId) {
      setDraggedTargetId(null);
      setDragOverTargetId(null);
      return;
    }

    const currentOrder = [...targets];
    const dragIdx = currentOrder.findIndex((t) => t.id === draggedTargetId);
    const dropIdx = currentOrder.findIndex((t) => t.id === targetId);

    if (dragIdx === -1 || dropIdx === -1) return;

    const [draggedItem] = currentOrder.splice(dragIdx, 1);
    currentOrder.splice(dropIdx, 0, draggedItem);

    dispatch(reorderFinancialTargets(currentOrder));
    setDraggedTargetId(null);
    setDragOverTargetId(null);

    const reorderedIds = currentOrder.map((t) => t.id);
    apiService.reorderFinancialTargets(reorderedIds).catch((err) => {
      console.error('Failed to sync target order:', err);
    });
  };

  const handleDragEnd = () => {
    setDraggedTargetId(null);
    setDragOverTargetId(null);
  };

  // Delete handler
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete target "${name}"?`)) return;
    try {
      const res = await apiService.deleteFinancialTarget(id);
      if (res.success) {
        dispatch(removeFinancialTarget(id));
      }
    } catch (err) {
      console.error('Failed to delete target:', err);
    }
  };

  // Edit handler
  const handleEdit = (target: FinancialTargetItem) => {
    setTargetToEdit(target);
    setIsModalOpen(true);
  };

  // Realize Target into expense transaction (consolidated from planned expense)
  const handleRealizeTarget = async (target: FinancialTargetItem) => {
    const shouldAddTx = window.confirm(
      `Realize target "${target.name}"?\n\nThe target will be marked as 'Goal Achieved'.\n\nClick OK if you also want to log an expense of ${formatRupiah(
        target.targetAmount
      )} to your Cash Flow ledger automatically!`
    );

    if (shouldAddTx) {
      const classification = getTargetClassification(target);
      const newTx: TransactionItem = {
        id: `tx-target-${Date.now()}`,
        title: target.name,
        type: 'expense',
        amount: target.targetAmount,
        category: target.category,
        date: new Date().toISOString().split('T')[0],
        emotionalTrigger: classification.targetType === 'needs' ? 'Need' : 'StressReward',
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
          emotionalTrigger: newTx.emotionalTrigger,
          isImpulse: false,
        })
        .catch(console.warn);
    }

    try {
      const res = await apiService.updateFinancialTarget(target.id, {
        status: 'completed',
        currentAmount: Math.max(target.currentAmount, target.targetAmount),
      });
      if (res.success && res.data) {
        dispatch(updateFinancialTargetInState(res.data));
      }
    } catch (err) {
      console.warn('Failed to complete target:', err);
    }
  };

  // Reopen completed target
  const handleReopenTarget = async (target: FinancialTargetItem) => {
    if (window.confirm(`Reopen target "${target.name}" to 'In Progress'?`)) {
      try {
        const res = await apiService.updateFinancialTarget(target.id, {
          status: 'in_progress',
        });
        if (res.success && res.data) {
          dispatch(updateFinancialTargetInState(res.data));
        }
      } catch (err) {
        console.warn('Failed to reopen target:', err);
      }
    }
  };

  // Filter calculation
  const filteredTargets = targets.filter((target) => {
    const classification = getTargetClassification(target);
    const matchesType =
      targetTypeFilter === 'all' || classification.targetType === targetTypeFilter;
    const matchesTimeframe =
      timeframeFilter === 'all' || classification.timeframe === timeframeFilter;
    const matchesCategory =
      selectedCategory === 'all' || target.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' || target.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' || target.priority === priorityFilter;
    const matchesSearch =
      target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (target.notes && target.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      matchesType &&
      matchesTimeframe &&
      matchesCategory &&
      matchesStatus &&
      matchesPriority &&
      matchesSearch
    );
  });

  // Aggregated Portfolio Metrics
  const totalTargetGoal = targets.reduce((acc, t) => acc + t.targetAmount, 0);
  const totalAllocated = targets.reduce((acc, t) => acc + t.currentAmount, 0);
  const totalRemaining = Math.max(0, totalTargetGoal - totalAllocated);
  const activeTargets = targets.filter((t) => t.status === 'in_progress');
  const totalMonthlySavingsRequired = activeTargets.reduce(
    (acc, t) => acc + (t.monthlyRequired || 0),
    0
  );
  const overallProgress =
    totalTargetGoal > 0 ? Math.round((totalAllocated / totalTargetGoal) * 100) : 0;

  // Breakdown metrics for Needs vs Wants and Minor (Small) vs Major (Big)
  const needsTargets = targets.filter((t) => getTargetClassification(t).targetType === 'needs');
  const wantsTargets = targets.filter((t) => getTargetClassification(t).targetType === 'wants');

  const needsShortTargets = needsTargets.filter(
    (t) => getTargetClassification(t).timeframe === 'short_term'
  );
  const needsLongTargets = needsTargets.filter(
    (t) => getTargetClassification(t).timeframe === 'long_term'
  );

  const needsShortAmount = needsShortTargets.reduce((acc, t) => acc + t.targetAmount, 0);
  const needsLongAmount = needsLongTargets.reduce((acc, t) => acc + t.targetAmount, 0);
  const wantsAmount = wantsTargets.reduce((acc, t) => acc + t.targetAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 250, 0.95) 100%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(5, 150, 105, 0.12)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0,
            }}
          >
            <Target size={22} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px',
              }}
            >
              Financial Targets &amp; Sinking Funds
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Consolidated capital targets for essential needs (minor &amp; major) and personal wants
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTargetToEdit(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>New Financial Target</span>
        </button>
      </div>

      {/* Aggregate Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {/* Total Target Goal */}
        <div
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
              Total Goals Capital
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Target size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalTargetGoal)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Across {targets.length} defined milestone{targets.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Breakdown Needs */}
        <div
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} />
              <span>Essential Needs Target</span>
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Home size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#059669', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(needsShortAmount + needsLongAmount)}
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} />
              <span>Minor: <strong>{formatRupiah(needsShortAmount)}</strong></span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Target size={11} />
              <span>Major: <strong>{formatRupiah(needsLongAmount)}</strong></span>
            </span>
          </div>
        </div>

        {/* Breakdown Wants */}
        <div
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Personal Wants Target</span>
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Plane size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(wantsAmount)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {wantsTargets.length} aspiration &amp; lifestyle goal{wantsTargets.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Capital Saved / Allocated */}
        <div
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--primary)' }}>
              Capital Saved
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <PiggyBank size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalAllocated)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {overallProgress}% achieved • {formatRupiah(totalRemaining)} remaining
          </p>
        </div>

        {/* Required Monthly Pace */}
        <div
          style={{
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(240, 253, 244, 0.6) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Coins size={12} />
              <span>Monthly Savings Pace</span>
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalMonthlySavingsRequired)}
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>/ mo</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Required savings across active targets
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass"
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: '#FFFFFF',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Row 1: Target Nature (Needs vs Wants) & Target Scale (Minor vs Major) */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Nature: All | Needs | Wants */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Nature:</span>
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-app)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                gap: '4px',
              }}
            >
              <button
                onClick={() => setTargetTypeFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: targetTypeFilter === 'all' ? '#FFFFFF' : 'transparent',
                  color: targetTypeFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: targetTypeFilter === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                All Types ({targets.length})
              </button>
              <button
                onClick={() => setTargetTypeFilter('needs')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: targetTypeFilter === 'needs' ? '#059669' : 'transparent',
                  color: targetTypeFilter === 'needs' ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                <ShieldCheck size={13} />
                <span>Needs ({needsTargets.length})</span>
              </button>
              <button
                onClick={() => setTargetTypeFilter('wants')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: targetTypeFilter === 'wants' ? '#7C3AED' : 'transparent',
                  color: targetTypeFilter === 'wants' ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                <Sparkles size={13} />
                <span>Wants ({wantsTargets.length})</span>
              </button>
            </div>
          </div>

          {/* Scale: All Scope | Minor Target (Small) | Major Target (Big) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Scale:</span>
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-app)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                gap: '4px',
              }}
            >
              <button
                onClick={() => setTimeframeFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: timeframeFilter === 'all' ? '#FFFFFF' : 'transparent',
                  color: timeframeFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: timeframeFilter === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                All Scope
              </button>
              <button
                onClick={() => setTimeframeFilter('short_term')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: timeframeFilter === 'short_term' ? '#0284C7' : 'transparent',
                  color: timeframeFilter === 'short_term' ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                <Clock size={13} />
                <span>Minor Target (Small)</span>
              </button>
              <button
                onClick={() => setTimeframeFilter('long_term')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: timeframeFilter === 'long_term' ? '#D97706' : 'transparent',
                  color: timeframeFilter === 'long_term' ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                <Target size={13} />
                <span>Major Target (Big)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search Bar & Status/Priority Pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search target name, notes, purpose (e.g. bike service, property, vacation)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-app)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-app)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === 'all' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: statusFilter === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === 'in_progress' ? 'var(--primary)' : 'transparent',
                color: statusFilter === 'in_progress' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === 'completed' ? '#059669' : 'transparent',
                color: statusFilter === 'completed' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              Achieved
            </button>
          </div>

          {/* Priority Filter */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-app)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setPriorityFilter('all')}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: priorityFilter === 'all' ? '#FFFFFF' : 'transparent',
                color: priorityFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              All Priority
            </button>
            <button
              onClick={() => setPriorityFilter('high')}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: priorityFilter === 'high' ? 'var(--rose)' : 'transparent',
                color: priorityFilter === 'high' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              High
            </button>
            <button
              onClick={() => setPriorityFilter('medium')}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: priorityFilter === 'medium' ? '#D97706' : 'transparent',
                color: priorityFilter === 'medium' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              Medium
            </button>
          </div>
        </div>

        {/* Row 3: Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              border: '1px solid var(--border-light)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedCategory === 'all' ? 'var(--text-primary)' : '#FFFFFF',
              color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            All Categories ({targets.length})
          </button>
          {(Object.keys(CATEGORY_META) as TargetCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = targets.filter((t) => t.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: isSelected ? 'none' : '1px solid var(--border-light)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected ? meta.color : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span style={{ opacity: 0.8, fontSize: '10px' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
        {filteredTargets.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              gridColumn: '1 / -1',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--bg-app)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Target size={28} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No Financial Targets Found
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px' }}>
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || targetTypeFilter !== 'all'
                  ? 'No targets match your current filter or search criteria.'
                  : 'Establish targets for essential needs (routine servicing, emergency cushion) or personal dreams.'}
              </p>
            </div>
            <button
              onClick={() => {
                setTargetToEdit(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', marginTop: '6px' }}
            >
              <Plus size={16} />
              <span>Create Your First Target</span>
            </button>
          </div>
        ) : (
          <>
            {filteredTargets.length > 1 && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginBottom: '-6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <GripVertical size={13} />
                  <span>Drag cards to reorder priority</span>
                </span>
              </div>
            )}
            {filteredTargets.map((target) => {
              const meta = CATEGORY_META[target.category] || CATEGORY_META.other;
              const priorityMeta = PRIORITY_META[target.priority] || PRIORITY_META.medium;
              const classification = getTargetClassification(target);
              const isCompleted = target.status === 'completed' || target.currentAmount >= target.targetAmount;
              const remainingMonths = target.remainingMonths ?? 0;
              const deadlineFormatted = new Date(target.deadlineDate).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
              );
              const isBeingDragged = draggedTargetId === target.id;
              const isOver = dragOverTargetId === target.id && !isBeingDragged;

              return (
                <div
                  key={target.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, target.id)}
                  onDragOver={(e) => handleDragOver(e, target.id)}
                  onDragLeave={() => {
                    if (dragOverTargetId === target.id) setDragOverTargetId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(target.id);
                  }}
                  onDragEnd={handleDragEnd}
                  className="glass"
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-xl)',
                    background: isBeingDragged ? 'var(--bg-app)' : '#FFFFFF',
                    border: isOver
                      ? '2px dashed var(--primary)'
                      : '1px solid var(--border-light)',
                    boxShadow: isOver ? '0 0 0 4px var(--primary-light)' : 'var(--shadow-xs)',
                    opacity: isBeingDragged ? 0.45 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'grab',
                  }}
                >
                  <div>
                    {/* Top Bar: Badges + Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--text-muted)',
                            cursor: 'grab',
                            padding: '2px',
                          }}
                          title="Drag to reorder"
                        >
                          <GripVertical size={15} />
                        </div>

                        {/* Classification Nature Tag */}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background:
                              classification.targetType === 'needs'
                                ? 'rgba(5, 150, 105, 0.12)'
                                : 'rgba(124, 58, 237, 0.12)',
                            color: classification.targetType === 'needs' ? '#059669' : '#7C3AED',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {classification.targetType === 'needs' ? (
                            <>
                              <ShieldCheck size={11} />
                              <span>Needs</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} />
                              <span>Wants</span>
                            </>
                          )}
                        </span>

                        {/* Target Scale Tag (Minor vs Major) */}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background:
                              classification.timeframe === 'short_term'
                                ? 'rgba(2, 132, 199, 0.12)'
                                : 'rgba(217, 119, 6, 0.12)',
                            color: classification.timeframe === 'short_term' ? '#0284C7' : '#D97706',
                          }}
                        >
                          {classification.timeframe === 'short_term' ? 'Minor Target' : 'Major Target'}
                        </span>

                        {/* Category Tag */}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: meta.bg,
                            color: meta.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {meta.icon}
                          <span>{meta.label}</span>
                        </span>

                        {/* Priority Tag */}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: priorityMeta.bg,
                            color: priorityMeta.color,
                          }}
                        >
                          {priorityMeta.label}
                        </span>

                        {/* Status Tag */}
                        {isCompleted ? (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(5, 150, 105, 0.12)',
                              color: 'var(--emerald)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={11} />
                            <span>Goal Achieved</span>
                          </span>
                        ) : target.status === 'paused' ? (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(0,0,0,0.06)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Paused
                          </span>
                        ) : null}
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleEdit(target)}
                          title="Edit Target"
                          style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(target.id, target.name)}
                          title="Delete Target"
                          style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            color: 'var(--rose)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Target Name and Deadline Info */}
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                        {target.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} color="var(--text-muted)" />
                          <span>Deadline: {deadlineFormatted}</span>
                        </span>
                        <span>•</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: remainingMonths <= 2 && !isCompleted ? 'var(--rose)' : 'var(--text-secondary)',
                          }}
                        >
                          {isCompleted
                            ? 'Milestone Fully Reached'
                            : remainingMonths <= 0
                            ? 'Deadline Reached'
                            : `${remainingMonths} month${remainingMonths === 1 ? '' : 's'} remaining`}
                        </span>
                      </div>
                      {target.notes && (
                        <p style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {target.notes}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Funding Progress</span>
                        <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {target.progressPercent || 0}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, target.progressPercent || 0)}%`,
                            height: '100%',
                            background: isCompleted ? 'var(--emerald)' : (target.progressPercent || 0) > 50 ? 'var(--primary)' : '#7C3AED',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Metric Value Boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'var(--bg-app)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Allocated So Far
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--emerald)', marginTop: '2px' }}>
                          {formatRupiah(target.currentAmount)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          of {formatRupiah(target.targetAmount)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'var(--bg-app)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Remaining Gap
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formatRupiah(target.remainingAmount ?? Math.max(0, target.targetAmount - target.currentAmount))}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {isCompleted ? 'Goal funded' : 'Left to save'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Highlight Box: Monthly Savings Pace, Allocation Button, and Realize Target */}
                  <div>
                    {!isCompleted ? (
                      <div
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, rgba(235, 247, 240, 0.9) 0%, rgba(214, 239, 225, 0.5) 100%)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Coins size={12} />
                            <span>Monthly Savings Allocation</span>
                          </div>
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              marginTop: '2px',
                            }}
                          >
                            {formatRupiah(target.monthlyRequired || 0)}
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '3px' }}>
                              / mo
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            Paced across remaining {remainingMonths} month{remainingMonths === 1 ? '' : 's'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => setTargetToAllocate(target)}
                            className="btn-primary"
                            style={{ padding: '7px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                          >
                            <Plus size={13} />
                            <span>Allocate Funds</span>
                          </button>

                          <button
                            onClick={() => handleRealizeTarget(target)}
                            className="btn-secondary"
                            title="Realize goal and log expense to Cash Flow ledger"
                            style={{
                              padding: '7px 12px',
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                              background: '#FFFFFF',
                              color: '#059669',
                              borderColor: '#059669',
                            }}
                          >
                            <Check size={13} />
                            <span>Realize Goal</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--primary-light)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--emerald)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Financial Milestone Fully Reached!</span>
                        </div>

                        <button
                          onClick={() => handleReopenTarget(target)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>Reopen Target</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add / Edit Target Modal */}
      <AddFinancialTargetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTargetToEdit(null);
        }}
        targetToEdit={targetToEdit}
      />

      {/* Allocate Funds Modal */}
      <AllocateTargetFundsModal
        isOpen={Boolean(targetToAllocate)}
        onClose={() => setTargetToAllocate(null)}
        target={targetToAllocate}
      />
    </div>
  );
};
