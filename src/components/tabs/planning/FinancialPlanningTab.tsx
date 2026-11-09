import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import {
  TrendingUp,
  CalendarCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PiggyBank,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { formatRupiah } from '../../../utils/financialCalculations';
import { RevenueStreamView } from './RevenueStreamView';
import { FixedCostView } from './FixedCostView';
import { FinancialTargetView } from './FinancialTargetView';
import { DebtView } from './DebtView';

export type PlanningSubTab = 'revenue' | 'fixed-costs' | 'targets' | 'debt';

interface FinancialPlanningTabProps {
  initialSubTab?: PlanningSubTab;
}

export const FinancialPlanningTab: React.FC<FinancialPlanningTabProps> = ({
  initialSubTab,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const revenueStreams = useAppSelector((state) => state.planning.revenueStreams);
  const fixedCosts = useAppSelector((state) => state.planning.fixedCosts);
  const targets = useAppSelector((state) => state.planning.financialTargets);
  const debts = useAppSelector((state) => state.planning.debts);

  // Determine active sub-tab from route or props
  const getActiveSubTab = (): PlanningSubTab => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/debt')) return 'debt';
    if (p.includes('/fixed-cost')) return 'fixed-costs';
    if (p.includes('/target') || p.includes('/financial-target')) return 'targets';
    if (p.includes('/revenue')) return 'revenue';
    return initialSubTab || 'revenue';
  };

  const activeSubTab = getActiveSubTab();

  const handleSubTabChange = (tab: PlanningSubTab) => {
    switch (tab) {
      case 'revenue':
        navigate('/planning/revenue-streams');
        break;
      case 'fixed-costs':
        navigate('/planning/fixed-costs');
        break;
      case 'targets':
        navigate('/planning/financial-targets');
        break;
      case 'debt':
        navigate('/planning/debts');
        break;
    }
  };

  // High-level Financial Planning Computations
  // 1. Monthly Active Inflow
  const activeStreams = revenueStreams.filter((s) => s.status === 'active');
  const monthlyRevenue = activeStreams.reduce((acc, s) => {
    const amt = s.amount;
    switch (s.frequency) {
      case 'weekly':
        return acc + amt * 4.33;
      case 'biweekly':
        return acc + amt * 2.16;
      case 'monthly':
      case 'irregular':
      default:
        return acc + amt;
    }
  }, 0);

  // 2. Committed Monthly Fixed Costs
  const monthlyFixedCost = fixedCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // 3. Active Debts & Monthly Installments
  const activeDebts = debts.filter((d) => d.status === 'active');
  const totalDebtBalance = activeDebts.reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);
  const monthlyDebtPayment = activeDebts.reduce((acc, d) => acc + (Number(d.monthlyPayment) || 0), 0);

  // 4. Net Free Cash Flow
  const netCashFlow = monthlyRevenue - monthlyFixedCost - monthlyDebtPayment;

  // 5. Target Monthly Savings Allocation (for active targets)
  const activeTargets = targets.filter((t) => t.status === 'in_progress');
  const monthlyTargetSavings = activeTargets.reduce(
    (acc, t) => acc + (Number(t.monthlyRequired) || 0),
    0
  );

  // 6. Unallocated Discretionary Buffer
  const discretionaryBuffer = netCashFlow - monthlyTargetSavings;

  // Percentages for allocation ratio bar
  const fixedCostPct =
    monthlyRevenue > 0
      ? Math.min(100, Math.round((monthlyFixedCost / monthlyRevenue) * 100))
      : 0;
  const debtPct =
    monthlyRevenue > 0
      ? Math.min(100 - fixedCostPct, Math.round((monthlyDebtPayment / monthlyRevenue) * 100))
      : 0;
  const savingsPct =
    monthlyRevenue > 0
      ? Math.min(100 - fixedCostPct - debtPct, Math.round((monthlyTargetSavings / monthlyRevenue) * 100))
      : 0;
  const bufferPct = Math.max(0, 100 - fixedCostPct - debtPct - savingsPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '32px' }}>
      {/* Page Content Header */}
      <div>
        <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
          Financial Planning &amp; Targets
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Revenue streams, monthly fixed commitments, targets &amp; debt settlement
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE CASH FLOW & HEALTH RADAR (MASTER SUMMARY)                     */}
      {/* ========================================================================= */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 252, 250, 0.96) 100%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}
            >
              <PiggyBank size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '2px',
                }}
              >
                <Sparkles size={12} />
                <span>Executive Planning Radar</span>
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                }}
              >
                Cash Flow Engine & Capital Allocation
              </h2>
            </div>
          </div>

          {/* Allocation Ratio Bar & Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '280px', flex: '1', maxWidth: '440px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              <span>Monthly Inflow Allocation</span>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                {formatRupiah(monthlyRevenue)} / mo
              </span>
            </div>

            {/* Multi-segment ratio bar */}
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'rgba(0, 0, 0, 0.06)',
                borderRadius: '999px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${fixedCostPct}%`,
                  background: '#F59E0B',
                  transition: 'width 0.4s ease',
                }}
                title={`Fixed Costs: ${fixedCostPct}%`}
              />
              <div
                style={{
                  width: `${debtPct}%`,
                  background: 'var(--rose)',
                  transition: 'width 0.4s ease',
                }}
                title={`Debt Obligations: ${debtPct}%`}
              />
              <div
                style={{
                  width: `${savingsPct}%`,
                  background: 'var(--primary)',
                  transition: 'width 0.4s ease',
                }}
                title={`Target Savings: ${savingsPct}%`}
              />
              <div
                style={{
                  width: `${bufferPct}%`,
                  background: '#6366F1',
                  transition: 'width 0.4s ease',
                }}
                title={`Free Buffer: ${bufferPct}%`}
              />
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                <span>Fixed ({fixedCostPct}%)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rose)' }} />
                <span>Debt ({debtPct}%)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                <span>Goals ({savingsPct}%)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} />
                <span>Buffer ({bufferPct}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 5 Financial Key Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {/* Active Revenue */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <ArrowUpRight size={14} />
              <span>Active Revenue</span>
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatRupiah(monthlyRevenue)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {activeStreams.length} active stream{activeStreams.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Fixed Commitments */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#D97706',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <ArrowDownRight size={14} />
              <span>Fixed Costs</span>
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatRupiah(monthlyFixedCost)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {fixedCosts.length} recurring bill{fixedCosts.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Net Cash Flow */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <Wallet size={14} />
              <span>Net Cash Flow</span>
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: netCashFlow >= 0 ? 'var(--primary)' : 'var(--rose)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatRupiah(netCashFlow)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Revenue − Fixed Bills
            </div>
          </div>

          {/* Target Savings Pace */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#7C3AED',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <Target size={14} />
              <span>Target Savings</span>
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#7C3AED',
                letterSpacing: '-0.4px',
              }}
            >
              {formatRupiah(monthlyTargetSavings)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {activeTargets.length} active goal{activeTargets.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Safe Discretionary Buffer */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#6366F1',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <Sparkles size={14} />
              <span>Free Buffer</span>
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: discretionaryBuffer >= 0 ? '#6366F1' : 'var(--rose)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatRupiah(discretionaryBuffer)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {discretionaryBuffer >= 0 ? 'Safe for lifestyle/invest' : 'Deficit risk'}
            </div>
          </div>

          {/* Active Debt Obligations */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--rose)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <CreditCard size={14} />
              <span>Debt Balance</span>
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: totalDebtBalance > 0 ? 'var(--rose)' : 'var(--text-primary)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatRupiah(totalDebtBalance)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {activeDebts.length} active liabilit{activeDebts.length === 1 ? 'y' : 'ies'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION PILL SWITCHER                                           */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          width: 'fit-content',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Revenue Streams Button */}
        <button
          onClick={() => handleSubTabChange('revenue')}
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'revenue' ? 'var(--primary)' : 'transparent',
            color: activeSubTab === 'revenue' ? '#FFFFFF' : 'var(--text-secondary)',
            boxShadow: activeSubTab === 'revenue' ? '0 2px 8px rgba(72, 176, 125, 0.3)' : 'none',
          }}
        >
          <TrendingUp size={15} color={activeSubTab === 'revenue' ? '#FFFFFF' : 'currentColor'} />
          <span>Revenue Streams</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '10px',
              background: activeSubTab === 'revenue' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.06)',
              color: activeSubTab === 'revenue' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            {revenueStreams.length}
          </span>
        </button>

        {/* Fixed Costs Button */}
        <button
          onClick={() => handleSubTabChange('fixed-costs')}
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'fixed-costs' ? '#D97706' : 'transparent',
            color: activeSubTab === 'fixed-costs' ? '#FFFFFF' : 'var(--text-secondary)',
            boxShadow: activeSubTab === 'fixed-costs' ? '0 2px 8px rgba(217, 119, 6, 0.3)' : 'none',
          }}
        >
          <CalendarCheck size={15} color={activeSubTab === 'fixed-costs' ? '#FFFFFF' : 'currentColor'} />
          <span>Fixed Costs</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '10px',
              background: activeSubTab === 'fixed-costs' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.06)',
              color: activeSubTab === 'fixed-costs' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            {fixedCosts.length}
          </span>
        </button>

        {/* Financial Targets Button */}
        <button
          onClick={() => handleSubTabChange('targets')}
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'targets' ? '#7C3AED' : 'transparent',
            color: activeSubTab === 'targets' ? '#FFFFFF' : 'var(--text-secondary)',
            boxShadow: activeSubTab === 'targets' ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
          }}
        >
          <Target size={15} color={activeSubTab === 'targets' ? '#FFFFFF' : 'currentColor'} />
          <span>Financial Targets</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '10px',
              background: activeSubTab === 'targets' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.06)',
              color: activeSubTab === 'targets' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            {targets.length}
          </span>
        </button>

        {/* Debt Management Button */}
        <button
          onClick={() => handleSubTabChange('debt')}
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'debt' ? 'var(--rose)' : 'transparent',
            color: activeSubTab === 'debt' ? '#FFFFFF' : 'var(--text-secondary)',
            boxShadow: activeSubTab === 'debt' ? '0 2px 8px rgba(225, 29, 72, 0.3)' : 'none',
          }}
        >
          <CreditCard size={15} color={activeSubTab === 'debt' ? '#FFFFFF' : 'currentColor'} />
          <span>Debt Liabilities</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '10px',
              background: activeSubTab === 'debt' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.06)',
              color: activeSubTab === 'debt' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            {debts.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE SUB-VIEW RENDER                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'revenue' && <RevenueStreamView />}
      {activeSubTab === 'fixed-costs' && <FixedCostView />}
      {activeSubTab === 'targets' && <FinancialTargetView />}
      {activeSubTab === 'debt' && <DebtView />}
    </div>
  );
};
