import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Tv,
  Wifi,
  Home,
  Umbrella,
  Dumbbell,
  Layers,
  Edit2,
  Trash2,
  BarChart3,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { FixedCostItem, FixedCostCategory } from '../../../types';
import { formatRupiah } from '../../../utils/financialCalculations';
import { apiService } from '../../../services/apiService';
import {
  setFixedCosts,
  removeFixedCost,
  reorderFixedCosts,
  updateFixedCostPaymentInState,
  setSelectedMonth,
  setFixedCostHistory,
} from '../../../store/slices/planningSlice';
import { AddFixedCostModal } from '../../planning/AddFixedCostModal';

const CATEGORY_META: Record<
  FixedCostCategory,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  utilities: {
    label: 'Utilities',
    color: '#0284C7',
    bg: 'rgba(2, 132, 199, 0.12)',
    icon: <Clock size={13} />,
  },
  subscriptions: {
    label: 'Subscriptions',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    icon: <Tv size={13} />,
  },
  telecom: {
    label: 'Telecom & WiFi',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    icon: <Wifi size={13} />,
  },
  housing: {
    label: 'Housing & Rent',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    icon: <Home size={13} />,
  },
  insurance: {
    label: 'Insurance',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    icon: <Umbrella size={13} />,
  },
  memberships: {
    label: 'Memberships',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    icon: <Dumbbell size={13} />,
  },
  debt_installments: {
    label: 'Debt & Installment',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    icon: <CreditCard size={13} />,
  },
  other: {
    label: 'Other Fixed',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
    icon: <Layers size={13} />,
  },
};

export const FixedCostView: React.FC = () => {
  const dispatch = useAppDispatch();
  const fixedCosts = useAppSelector((state) => state.planning.fixedCosts);
  const selectedMonth = useAppSelector((state) => state.planning.selectedMonth);
  const fixedCostHistory = useAppSelector((state) => state.planning.fixedCostHistory);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | FixedCostCategory>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [_isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [costToEdit, setCostToEdit] = useState<FixedCostItem | null>(null);

  // Drag and drop state
  const [draggedCostId, setDraggedCostId] = useState<string | null>(null);
  const [dragOverCostId, setDragOverCostId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedCostId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCostId !== id) {
      setDragOverCostId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedCostId || draggedCostId === targetId) {
      setDraggedCostId(null);
      setDragOverCostId(null);
      return;
    }

    const sourceIdx = fixedCosts.findIndex((c) => c.id === draggedCostId);
    const targetIdx = fixedCosts.findIndex((c) => c.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...fixedCosts];
      const [movedItem] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, movedItem);

      dispatch(reorderFixedCosts(updated));
      apiService.reorderFixedCosts(updated.map((c) => c.id)).catch(console.error);
    }

    setDraggedCostId(null);
    setDragOverCostId(null);
  };

  const handleDragEnd = () => {
    setDraggedCostId(null);
    setDragOverCostId(null);
  };

  // Parse current selected month for display
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(year, (month || 1) - 1, 1);
  const formattedMonthName = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === currentMonthStr;
  const currentDay = currentDate.getDate();

  // Load costs for selected month
  const loadMonthData = async (monthStr: string) => {
    try {
      setIsLoading(true);
      const res = await apiService.getFixedCosts({ month: monthStr });
      if (res.success && res.data) {
        dispatch(setFixedCosts(res.data));
      }
    } catch (err) {
      console.error('Failed to load fixed costs for month:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load history data
  const loadHistoryData = async () => {
    try {
      const res = await apiService.getFixedCostHistory(6);
      if (res.success && res.data) {
        dispatch(setFixedCostHistory(res.data));
      }
    } catch (err) {
      console.error('Failed to load fixed cost history:', err);
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
    dispatch(setSelectedMonth(newMonthStr));
    loadMonthData(newMonthStr);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
    dispatch(setSelectedMonth(newMonthStr));
    loadMonthData(newMonthStr);
  };

  const handleJumpToCurrentMonth = () => {
    if (selectedMonth !== currentMonthStr) {
      dispatch(setSelectedMonth(currentMonthStr));
      loadMonthData(currentMonthStr);
    }
  };

  useEffect(() => {
    loadMonthData(selectedMonth);
    loadHistoryData();
  }, []);

  // Payment toggle handler
  const handleTogglePaid = async (cost: FixedCostItem) => {
    const newStatus = !cost.isPaid;
    dispatch(
      updateFixedCostPaymentInState({
        id: cost.id,
        isPaid: newStatus,
        paidAmount: newStatus ? cost.amount : 0,
        paidAt: newStatus ? new Date().toISOString() : null,
      })
    );

    try {
      const res = await apiService.toggleFixedCostPaid(cost.id, {
        monthYear: selectedMonth,
        isPaid: newStatus,
        paidAmount: newStatus ? cost.amount : 0,
      });
      if (res.success && res.data) {
        dispatch(
          updateFixedCostPaymentInState({
            id: cost.id,
            isPaid: res.data.isPaid,
            paidAmount: res.data.paidAmount,
            paidAt: res.data.paidAt ?? null,
          })
        );
      }
      loadHistoryData();
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
      dispatch(
        updateFixedCostPaymentInState({
          id: cost.id,
          isPaid: !newStatus,
          paidAmount: !newStatus ? cost.amount : 0,
          paidAt: null,
        })
      );
    }
  };

  // Delete handler
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete fixed cost "${name}"?`)) return;
    try {
      const res = await apiService.deleteFixedCost(id);
      if (res.success) {
        dispatch(removeFixedCost(id));
        loadHistoryData();
      }
    } catch (err) {
      console.error('Failed to delete fixed cost:', err);
    }
  };

  // Edit handler
  const handleEdit = (cost: FixedCostItem) => {
    setCostToEdit(cost);
    setIsModalOpen(true);
  };

  // Filter calculations
  const filteredCosts = fixedCosts.filter((cost) => {
    const matchesCategory =
      selectedCategory === 'all' || cost.category === selectedCategory;
    const matchesSearch =
      cost.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cost.notes && cost.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'paid' && cost.isPaid) ||
      (paymentFilter === 'pending' && !cost.isPaid);
    return matchesCategory && matchesSearch && matchesPayment;
  });

  // Summary Metrics
  const totalObligation = fixedCosts.reduce((acc, c) => acc + c.amount, 0);
  const totalPaid = fixedCosts
    .filter((c) => c.isPaid)
    .reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);
  const totalPending = Math.max(0, totalObligation - totalPaid);
  const paidCount = fixedCosts.filter((c) => c.isPaid).length;
  const settlementRate =
    totalObligation > 0 ? Math.round((totalPaid / totalObligation) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Month Selector */}
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
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              flexShrink: 0,
            }}
          >
            <CalendarCheck size={22} />
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
              Monthly Fixed Costs
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Track recurring financial commitments & monthly bill settlements
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Previous / Month / Next */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-app)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div
              style={{
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                minWidth: '140px',
                justifyContent: 'center',
              }}
            >
              <Calendar size={13} color="var(--primary)" />
              <span>{formattedMonthName}</span>
            </div>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={handleJumpToCurrentMonth}
              style={{
                padding: '7px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              Current Month
            </button>
          )}

          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              background: showHistoryDrawer ? 'var(--text-primary)' : '#FFFFFF',
              color: showHistoryDrawer ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <BarChart3 size={14} />
            <span>6-Month Trend</span>
          </button>

          <button
            onClick={() => {
              setCostToEdit(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>Add Fixed Cost</span>
          </button>
        </div>
      </div>

      {/* 6-Month Trend Drawer */}
      {showHistoryDrawer && (
        <div
          className="glass"
          style={{
            padding: '20px 24px',
            borderRadius: 'var(--radius-xl)',
            background: '#FFFFFF',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--primary)" />
              <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-primary)' }}>
                Historical Monthly Spending (Last 6 Months)
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click any month to view details
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {fixedCostHistory.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', gridColumn: '1 / -1' }}>
                No historical records found yet.
              </div>
            ) : (
              fixedCostHistory.map((hist) => {
                const [hYear, hMonth] = hist.monthYear.split('-').map(Number);
                const hDate = new Date(hYear, hMonth - 1, 1);
                const hLabel = hDate.toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                });
                const isSelected = hist.monthYear === selectedMonth;
                const rate =
                  hist.settlementRate ??
                  (hist.totalObligation > 0
                    ? Math.round((hist.totalPaid / hist.totalObligation) * 100)
                    : 0);

                return (
                  <button
                    key={hist.monthYear}
                    onClick={() => {
                      dispatch(setSelectedMonth(hist.monthYear));
                      loadMonthData(hist.monthYear);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: isSelected ? 'var(--primary-light)' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {hLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          background: rate === 100 ? 'rgba(5, 150, 105, 0.12)' : rate > 0 ? 'rgba(217, 119, 6, 0.12)' : 'rgba(0,0,0,0.06)',
                          color: rate === 100 ? 'var(--emerald)' : rate > 0 ? '#D97706' : 'var(--text-muted)',
                        }}
                      >
                        {rate}%
                      </span>
                    </div>

                    <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {formatRupiah(hist.totalPaid)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      of {formatRupiah(hist.totalObligation)}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                      <div
                        style={{
                          width: `${rate}%`,
                          height: '100%',
                          background: rate === 100 ? 'var(--emerald)' : '#F59E0B',
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Monthly Settlement Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* Total Obligation */}
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
              Total Obligation
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <CalendarCheck size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalObligation)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {fixedCosts.length} recurring commitment{fixedCosts.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Settled This Month */}
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
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--emerald)' }}>
              Settled This Month
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--emerald)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalPaid)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {paidCount} of {fixedCosts.length} bills settled
          </p>
        </div>

        {/* Pending Bills */}
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
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#D97706' }}>
              Pending Bills
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#D97706', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalPending)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {fixedCosts.length - paidCount} remaining to settle
          </p>
        </div>

        {/* Settlement Progress */}
        <div
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                Settlement Progress
              </span>
              <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {settlementRate}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${settlementRate}%`,
                  height: '100%',
                  background: settlementRate === 100 ? 'var(--emerald)' : 'var(--primary)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {settlementRate === 100
              ? '🎉 All fixed commitments fully settled for this month!'
              : `${formatRupiah(totalPending)} left to clear all bills`}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="glass"
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: '#FFFFFF',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
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
              placeholder="Search fixed cost name, notes, provider..."
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

          {/* Payment Status Filter Buttons */}
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
              onClick={() => setPaymentFilter('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: paymentFilter === 'all' ? '#FFFFFF' : 'transparent',
                color: paymentFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: paymentFilter === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              All Status
            </button>
            <button
              onClick={() => setPaymentFilter('paid')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: paymentFilter === 'paid' ? 'var(--emerald)' : 'transparent',
                color: paymentFilter === 'paid' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              <CheckCircle2 size={13} />
              <span>Paid ({paidCount})</span>
            </button>
            <button
              onClick={() => setPaymentFilter('pending')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: paymentFilter === 'pending' ? '#D97706' : 'transparent',
                color: paymentFilter === 'pending' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              <Clock size={13} />
              <span>Pending ({fixedCosts.length - paidCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid var(--border-light)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedCategory === 'all' ? 'var(--text-primary)' : '#FFFFFF',
              color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            All Categories ({fixedCosts.length})
          </button>
          {(Object.keys(CATEGORY_META) as FixedCostCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = fixedCosts.filter((c) => c.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: isSelected ? 'none' : '1px solid var(--border-light)',
                  fontSize: '12px',
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
                <span style={{ opacity: 0.8, fontSize: '11px' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Costs List / Checklist Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredCosts.length === 0 ? (
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
              <CalendarCheck size={28} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No Fixed Costs Found
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px' }}>
                {searchQuery || selectedCategory !== 'all' || paymentFilter !== 'all'
                  ? 'No recurring costs match your current search and filter criteria.'
                  : 'Start organizing your recurring monthly obligations like electricity, wifi, subscriptions, or rent.'}
              </p>
            </div>
            <button
              onClick={() => {
                setCostToEdit(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', marginTop: '6px' }}
            >
              <Plus size={16} />
              <span>Add Your First Fixed Cost</span>
            </button>
          </div>
        ) : (
          <>
            {filteredCosts.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <GripVertical size={13} />
                  <span>Drag items to reorder</span>
                </span>
              </div>
            )}
            {filteredCosts.map((cost) => {
              const meta = CATEGORY_META[cost.category] || CATEGORY_META.other;
              const isDuePassed =
                isCurrentMonth && !cost.isPaid && cost.dueDay < currentDay;
              const isDueSoon =
                isCurrentMonth &&
                !cost.isPaid &&
                cost.dueDay >= currentDay &&
                cost.dueDay <= currentDay + 3;
              const isBeingDragged = draggedCostId === cost.id;
              const isOver = dragOverCostId === cost.id && !isBeingDragged;

              return (
                <div
                  key={cost.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, cost.id)}
                  onDragOver={(e) => handleDragOver(e, cost.id)}
                  onDragLeave={() => {
                    if (dragOverCostId === cost.id) setDragOverCostId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(cost.id);
                  }}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg)',
                    background: isBeingDragged ? 'var(--bg-app)' : cost.isPaid ? 'rgba(5, 150, 105, 0.04)' : '#FFFFFF',
                    border: isOver
                      ? '2px dashed var(--primary)'
                      : cost.isPaid
                      ? '1px solid rgba(5, 150, 105, 0.25)'
                      : '1px solid var(--border-light)',
                    boxShadow: isOver ? '0 0 0 4px var(--primary-light)' : 'var(--shadow-xs)',
                    opacity: isBeingDragged ? 0.45 : 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'grab',
                  }}
                >
                  {/* Left Side: Drag handle + Checkbox + Information */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
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
                      <GripVertical size={16} />
                    </div>

                    {/* Paid / Unpaid Checkbox Button */}
                  <button
                    onClick={() => handleTogglePaid(cost)}
                    title={
                      cost.isPaid
                        ? 'Click to mark as unpaid for this month'
                        : 'Click to mark as paid for this month'
                    }
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      border: cost.isPaid ? 'none' : '2px solid #CBD5E1',
                      background: cost.isPaid ? 'var(--emerald)' : '#FFFFFF',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {cost.isPaid && <CheckCircle2 size={18} />}
                  </button>

                  {/* Name and Meta */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: cost.isPaid ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: cost.isPaid ? 'line-through' : 'none',
                        }}
                      >
                        {cost.name}
                      </h4>

                      {/* Category Badge */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
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

                      {/* Due Status Pill */}
                      {isDuePassed && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: 'var(--rose)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <AlertTriangle size={11} />
                          <span>Overdue (Day {cost.dueDay})</span>
                        </span>
                      )}
                      {isDueSoon && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(217, 119, 6, 0.12)',
                            color: '#D97706',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={11} />
                          <span>Due soon (Day {cost.dueDay})</span>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>Due on day {cost.dueDay} of month</span>
                      {cost.notes && (
                        <span>• <em>{cost.notes}</em></span>
                      )}
                      {cost.isPaid && cost.paidAt && (
                        <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                          • Paid on{' '}
                          {new Date(cost.paidAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: cost.isPaid ? 'var(--emerald)' : 'var(--text-primary)',
                      }}
                    >
                      {formatRupiah(cost.amount)}
                    </div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                      {cost.isPaid ? 'Settled' : 'Unpaid'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleEdit(cost)}
                      title="Edit Fixed Cost"
                      style={{
                        padding: '7px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cost.id, cost.name)}
                      title="Delete Fixed Cost"
                      style={{
                        padding: '7px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        color: 'var(--rose)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </>
        )}
      </div>

      {/* Add / Edit Fixed Cost Modal */}
      <AddFixedCostModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCostToEdit(null);
        }}
        costToEdit={costToEdit}
      />
    </div>
  );
};
