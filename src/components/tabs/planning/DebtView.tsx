import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Home,
  Car,
  Zap,
  Building2,
  Users,
  Layers,
  Edit2,
  Trash2,
  TrendingDown,
  DollarSign,
  GripVertical,
} from 'lucide-react';
import { DebtItem, DebtCategory } from '../../../types';
import { formatRupiah } from '../../../utils/financialCalculations';
import { apiService } from '../../../services/apiService';
import { removeDebt, reorderDebts } from '../../../store/slices/planningSlice';
import { AddDebtModal } from '../../planning/AddDebtModal';
import { RecordDebtPaymentModal } from '../../planning/RecordDebtPaymentModal';

const CATEGORY_META: Record<
  DebtCategory,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  credit_card: {
    label: 'Credit Card',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    icon: <CreditCard size={13} />,
  },
  mortgage: {
    label: 'Mortgage / KPR',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    icon: <Home size={13} />,
  },
  vehicle_loan: {
    label: 'Vehicle Loan',
    color: '#0284C7',
    bg: 'rgba(2, 132, 199, 0.12)',
    icon: <Car size={13} />,
  },
  paylater: {
    label: 'PayLater / FinTech',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    icon: <Zap size={13} />,
  },
  personal_loan: {
    label: 'Personal Bank Loan',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <Building2 size={13} />,
  },
  peer_loan: {
    label: 'Peer & Family',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    icon: <Users size={13} />,
  },
  other: {
    label: 'Other Liability',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
    icon: <Layers size={13} />,
  },
};

export const DebtView: React.FC = () => {
  const dispatch = useAppDispatch();
  const debts = useAppSelector((state) => state.planning.debts);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | DebtCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid_off'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtItem | null>(null);
  const [debtToPay, setDebtToPay] = useState<DebtItem | null>(null);

  // Drag and drop state
  const [draggedDebtId, setDraggedDebtId] = useState<string | null>(null);
  const [dragOverDebtId, setDragOverDebtId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedDebtId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDebtId !== id) {
      setDragOverDebtId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedDebtId || draggedDebtId === targetId) {
      setDraggedDebtId(null);
      setDragOverDebtId(null);
      return;
    }

    const sourceIdx = debts.findIndex((d) => d.id === draggedDebtId);
    const targetIdx = debts.findIndex((d) => d.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...debts];
      const [movedItem] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, movedItem);

      dispatch(reorderDebts(updated));
      apiService.reorderDebts(updated.map((d) => d.id)).catch(console.error);
    }

    setDraggedDebtId(null);
    setDragOverDebtId(null);
  };

  const handleDragEnd = () => {
    setDraggedDebtId(null);
    setDragOverDebtId(null);
  };

  // Delete handler
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete debt liability "${name}"?`)) return;
    try {
      const res = await apiService.deleteDebt(id);
      if (res.success) {
        dispatch(removeDebt(id));
      }
    } catch (err) {
      console.error('Failed to delete debt:', err);
    }
  };

  // Edit handler
  const handleEdit = (debt: DebtItem) => {
    setDebtToEdit(debt);
    setIsAddModalOpen(true);
  };

  // Filter calculation
  const filteredDebts = debts.filter((debt) => {
    const matchesCategory =
      selectedCategory === 'all' || debt.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' || debt.status === statusFilter;
    const matchesSearch =
      debt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (debt.lender && debt.lender.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (debt.notes && debt.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const totalPrincipal = debts.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalRemaining = debts.reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalPaidOff = Math.max(0, totalPrincipal - totalRemaining);
  const activeDebts = debts.filter((d) => d.status === 'active' && d.remainingAmount > 0);
  const totalMonthlyCommitment = activeDebts.reduce(
    (acc, d) => acc + (d.monthlyPayment || 0),
    0
  );
  const overallPayoffRate =
    totalPrincipal > 0 ? Math.round((totalPaidOff / totalPrincipal) * 100) : 0;

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
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rose)',
              flexShrink: 0,
            }}
          >
            <CreditCard size={22} />
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
              Debt & Liabilities Management
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Manage borrowed funds, monthly installments, payoff deadliness & remaining balance
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDebtToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>Add Debt / Loan</span>
        </button>
      </div>

      {/* Aggregate Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* Total Principal Debt */}
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
              Total Borrowed (Principal)
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalPrincipal)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Across {debts.length} loan commitment{debts.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Current Remaining Balance */}
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
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--rose)' }}>
              Remaining Debt Balance
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose)' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--rose)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalRemaining)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {activeDebts.length} active liability accounts
          </p>
        </div>

        {/* Total Settled / Paid Off */}
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
              Principal Paid Down
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--emerald)', letterSpacing: '-0.4px', marginTop: '4px' }}>
            {formatRupiah(totalPaidOff)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {overallPayoffRate}% of aggregate debt cleared
          </p>
        </div>

        {/* Monthly Installment Commitment */}
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
                Overall Payoff Rate
              </span>
              <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {overallPayoffRate}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallPayoffRate}%`,
                  height: '100%',
                  background: overallPayoffRate === 100 ? 'var(--emerald)' : 'var(--primary)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Monthly Installment:</span>
            <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {formatRupiah(totalMonthlyCommitment)} / mo
            </strong>
          </div>
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
          gap: '12px',
        }}
      >
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
              placeholder="Search debt name, lender / bank, notes..."
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
              All Debts ({debts.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === 'active' ? 'var(--rose)' : 'transparent',
                color: statusFilter === 'active' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              Active ({activeDebts.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid_off')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === 'paid_off' ? 'var(--emerald)' : 'transparent',
                color: statusFilter === 'paid_off' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              Paid Off ({debts.length - activeDebts.length})
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
            All Categories ({debts.length})
          </button>
          {(Object.keys(CATEGORY_META) as DebtCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = debts.filter((d) => d.category === cat).length;
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

      {/* Debt Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredDebts.length === 0 ? (
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
              <CreditCard size={28} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No Debt Commitments Found
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px' }}>
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'No debt records match your current search and filter settings.'
                  : 'Track your debts, loans, installments, and deadlines to strategically eliminate liabilities.'}
              </p>
            </div>
            <button
              onClick={() => {
                setDebtToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', marginTop: '6px' }}
            >
              <Plus size={16} />
              <span>Add Your First Debt</span>
            </button>
          </div>
        ) : (
          <>
            {filteredDebts.length > 1 && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginBottom: '-6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <GripVertical size={13} />
                  <span>Drag cards to reorder</span>
                </span>
              </div>
            )}
            {filteredDebts.map((debt) => {
              const meta = CATEGORY_META[debt.category] || CATEGORY_META.other;
              const isPaidOff = debt.status === 'paid_off' || debt.remainingAmount <= 0;
              const payoffPct = debt.totalAmount > 0
                ? Math.min(100, Math.round(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100))
                : 0;
              const remainingMonths = debt.remainingMonths ?? 0;
              const deadlineFormatted = new Date(debt.deadlineDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const isBeingDragged = draggedDebtId === debt.id;
              const isOver = dragOverDebtId === debt.id && !isBeingDragged;

              return (
                <div
                  key={debt.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, debt.id)}
                  onDragOver={(e) => handleDragOver(e, debt.id)}
                  onDragLeave={() => {
                    if (dragOverDebtId === debt.id) setDragOverDebtId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(debt.id);
                  }}
                  onDragEnd={handleDragEnd}
                  className="glass"
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-xl)',
                    background: isBeingDragged ? 'var(--bg-app)' : isPaidOff ? 'rgba(5, 150, 105, 0.03)' : '#FFFFFF',
                    border: isOver
                      ? '2px dashed var(--primary)'
                      : isPaidOff
                      ? '1px solid rgba(5, 150, 105, 0.2)'
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

                        {/* Category Badge */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
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

                      {/* Creditor / Lender Tag */}
                      {debt.lender && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-app)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          {debt.lender}
                        </span>
                      )}

                      {/* Status Tag */}
                      {isPaidOff ? (
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
                          <span>Fully Settled</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--rose)',
                          }}
                        >
                          Active Debt
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleEdit(debt)}
                        title="Edit Debt"
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
                        onClick={() => handleDelete(debt.id, debt.name)}
                        title="Delete Debt"
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

                  {/* Name and Deadline */}
                  <div style={{ marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                      {debt.name}
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
                          color: remainingMonths <= 2 && !isPaidOff ? 'var(--rose)' : 'var(--text-secondary)',
                        }}
                      >
                        {isPaidOff
                          ? 'Debt-free'
                          : remainingMonths <= 0
                          ? 'Due Date Reached'
                          : `${remainingMonths} month${remainingMonths === 1 ? '' : 's'} remaining`}
                      </span>
                    </div>
                    {debt.notes && (
                      <p style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {debt.notes}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>Payoff Progress</span>
                      <span className="tabular-nums" style={{ color: isPaidOff ? 'var(--emerald)' : 'var(--text-primary)' }}>
                        {payoffPct}% Paid
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${payoffPct}%`,
                          height: '100%',
                          background: isPaidOff ? 'var(--emerald)' : 'var(--primary)',
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
                        Total Borrowed
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {formatRupiah(debt.totalAmount)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Original Principal
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
                      <div style={{ fontSize: '10px', fontWeight: 800, color: isPaidOff ? 'var(--emerald)' : 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Remaining Balance
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '14px', fontWeight: 800, color: isPaidOff ? 'var(--emerald)' : 'var(--rose)', marginTop: '2px' }}>
                        {formatRupiah(debt.remainingAmount)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {isPaidOff ? 'Zero balance' : 'Left to settle'}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Installment & Interest info if present */}
                  {(debt.monthlyPayment || debt.interestRate) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', padding: '0 4px' }}>
                      {debt.monthlyPayment ? (
                        <span>Installment: <strong style={{ color: 'var(--text-primary)' }} className="tabular-nums">{formatRupiah(debt.monthlyPayment)}/mo</strong></span>
                      ) : <span />}
                      {debt.interestRate ? (
                        <span>Interest: <strong style={{ color: 'var(--text-primary)' }}>{debt.interestRate}% p.a.</strong></span>
                      ) : <span />}
                    </div>
                  )}
                </div>

                {/* Bottom Highlight Box: Action */}
                <div>
                  {!isPaidOff ? (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 250, 0.9) 100%)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
                          Remaining to Pay Off
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--rose)', marginTop: '1px' }}>
                          {formatRupiah(debt.remainingAmount)}
                        </div>
                      </div>

                      <button
                        onClick={() => setDebtToPay(debt)}
                        className="btn-primary"
                        style={{ padding: '7px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      >
                        <DollarSign size={14} />
                        <span>Record Payment</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-light)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: 'var(--emerald)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>🎉 Fully Settled & Debt-Free!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </>
        )}
      </div>

      {/* Add / Edit Debt Modal */}
      <AddDebtModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setDebtToEdit(null);
        }}
        debtToEdit={debtToEdit}
      />

      {/* Record Payment Modal */}
      <RecordDebtPaymentModal
        isOpen={Boolean(debtToPay)}
        onClose={() => setDebtToPay(null)}
        debt={debtToPay}
      />
    </div>
  );
};

