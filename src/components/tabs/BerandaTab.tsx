import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { calculateFinancials, formatRupiah } from '../../utils/financialCalculations';
import {
  Sparkles,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Wallet,
  Clock,
  Zap,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { ExpenseBarChart } from '../charts/ExpenseBarChart';
import { AssetGrowthLineChart } from '../charts/AssetGrowthLineChart';
import appLogoInverted from '../../assets/logo-inverted.png';

interface BerandaTabProps {
  onNavigateTab: (tab: 'Beranda' | 'Transaksi' | 'Planning' | 'Asset' | 'Profile') => void;
  onOpenAddTx: () => void;
}

export const BerandaTab: React.FC<BerandaTabProps> = ({ onNavigateTab, onOpenAddTx }) => {
  const navigate = useNavigate();
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);
  const snapshots = useAppSelector((state) => state.snapshot.items);
  const savedMoneyTotal = useAppSelector((state) => state.decision.savedMoneyTotal);
  const financialTargets = useAppSelector((state) => state.planning.financialTargets);

  const fin = calculateFinancials(profile, assets, transactions);

  // Financial Target Sorting State
  type TargetSortField = 'target' | 'remaining' | 'deadline';
  type SortOrder = 'asc' | 'desc';

  const [targetSortField, setTargetSortField] = useState<TargetSortField>('deadline');
  const [targetSortOrder, setTargetSortOrder] = useState<SortOrder>('asc');

  const handleSortClick = (field: TargetSortField) => {
    if (targetSortField === field) {
      setTargetSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTargetSortField(field);
      setTargetSortOrder(field === 'deadline' ? 'asc' : 'desc');
    }
  };

  const sortedTargets = useMemo(() => {
    return [...financialTargets].sort((a, b) => {
      const remainingA = Math.max(0, a.targetAmount - a.currentAmount);
      const remainingB = Math.max(0, b.targetAmount - b.currentAmount);

      let diff = 0;
      if (targetSortField === 'target') {
        diff = a.targetAmount - b.targetAmount;
      } else if (targetSortField === 'remaining') {
        diff = remainingA - remainingB;
      } else if (targetSortField === 'deadline') {
        const dateA = new Date(a.deadlineDate).getTime();
        const dateB = new Date(b.deadlineDate).getTime();
        diff = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      }

      return targetSortOrder === 'asc' ? diff : -diff;
    });
  }, [financialTargets, targetSortField, targetSortOrder]);

  const formatDeadlineInfo = (deadlineDateStr: string) => {
    if (!deadlineDateStr) return { formatted: 'No date', relative: '', isOverdue: false };
    const deadline = new Date(deadlineDateStr);
    if (isNaN(deadline.getTime())) return { formatted: deadlineDateStr, relative: '', isOverdue: false };

    const formatted = deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { formatted, relative: 'Overdue', isOverdue: true };
    } else if (diffDays === 0) {
      return { formatted, relative: 'Due today', isOverdue: false };
    } else if (diffDays < 30) {
      return { formatted, relative: `${diffDays}d left`, isOverdue: false };
    } else {
      const diffMonths = Math.round(diffDays / 30);
      return { formatted, relative: `${diffMonths}mo left`, isOverdue: false };
    }
  };

  // Status color helpers
  const scoreColor =
    fin.healthScore >= 75 ? 'var(--emerald)' : fin.healthScore >= 50 ? 'var(--amber)' : 'var(--rose)';

  // Pillar 1: Liquidity Buffer (30 pts)
  const liquidityRatio = Math.min(1, fin.emergencyRunwayMonths / fin.targetEmergencyMonths);
  const liquidityPts = Math.round(liquidityRatio * 30);

  // Pillar 2: DTI (25 pts)
  let dtiPts = 25;
  if (fin.dtiPercentage > 40) dtiPts = 5;
  else if (fin.dtiPercentage > 30) dtiPts = 15;

  // Pillar 3: Savings/Asset Ratio (25 pts)
  const assetRatio = Math.min(1, (fin.totalInvestments + fin.totalLiquidCash) / (Math.max(1, profile?.monthlyIncome || 0) * 3));
  const savingsPts = Math.round(assetRatio * 25);

  // Pillar 4: Discretionary Spending Velocity (20 pts)
  const totalCurrentSpent = transactions
    .filter((tx) => tx.type !== 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const impulseSpent = transactions
    .filter((tx) => tx.type !== 'income' && tx.isImpulse)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const impulseRatio = impulseSpent / Math.max(1, totalCurrentSpent);
  const spendingPts = Math.max(0, Math.round(20 - impulseRatio * 20));

  return (
    <div className="bento-grid animate-fade-in">
      {/* Page Content Header */}
      <div className="col-span-12" style={{ marginBottom: '2px' }}>
        <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
          Financial Command Center
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Real-time financial radar, liquidity diagnostics &amp; health calibration
        </p>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: WELCOME & CRESCENT AI LIVE NUDGE BANNER (Span 12)                  */}
      {/* ========================================================================= */}
      <div
        className="col-span-12 bento-card bento-card-hero"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px', flex: 1 }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(72, 176, 125, 0.35)',
              padding: '6px',
              flexShrink: 0,
            }}
          >
            <img src={appLogoInverted} alt="Crescent Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Crescent Wealth Advisor
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                }}
              >
                Live
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              Welcome back, {profile?.name || 'Investor'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '640px', lineHeight: 1.5 }}>
              {fin.emergencyRunwayMonths < fin.targetEmergencyMonths ? (
                <>
                  Your current liquid reserves provide <strong>{fin.emergencyRunwayMonths} months</strong> of emergency runway (calibrated target: {fin.targetEmergencyMonths} months). Build up your protective safety cushion!
                </>
              ) : (
                <>
                  Your cash flow is in prime condition! Your discretionary daily allowance is <strong>{formatRupiah(fin.safeToSpendDaily)}</strong>. Continue channeling your surplus towards your financial targets and wealth accumulation.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: CORE FINANCIAL HEALTH METRICS (Span 4 + Span 4 + Span 4)           */}
      {/* ========================================================================= */}

      {/* Card 1: Financial Health Score (Span 4) */}
      <div className="col-span-4 bento-card" style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Financial Health
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                Financial Health Score
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: scoreColor,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-chip)',
              }}
            >
              {fin.healthGrade}
            </span>
          </div>

          {/* Gauge & Main Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '20px 0 16px' }}>
            <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
              <svg width="92" height="92" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E2ECE5" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="10"
                  strokeDasharray={`${(fin.healthScore / 100) * 251} 251`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }} className="tabular-nums">
                  {fin.healthScore}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>/ 100</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Real-time evaluation across 4 pillars of personal financial resilience.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Status: <strong style={{ color: scoreColor }}>{fin.healthStatus.toUpperCase()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              <span>1. Liquidity Buffer</span>
              <strong className="tabular-nums">{liquidityPts} / 30 Pts</strong>
            </div>
            <div style={{ height: '5px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(liquidityPts / 30) * 100}%`, background: 'var(--emerald)', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              <span>2. Debt-to-Income (DTI)</span>
              <strong className="tabular-nums">{dtiPts} / 25 Pts</strong>
            </div>
            <div style={{ height: '5px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(dtiPts / 25) * 100}%`, background: dtiPts >= 20 ? 'var(--emerald)' : 'var(--amber)', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              <span>3. Savings &amp; Asset Ratio</span>
              <strong className="tabular-nums">{savingsPts} / 25 Pts</strong>
            </div>
            <div style={{ height: '5px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(savingsPts / 25) * 100}%`, background: 'var(--secondary)', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              <span>4. Non-Impulsive Discipline</span>
              <strong className="tabular-nums">{spendingPts} / 20 Pts</strong>
            </div>
            <div style={{ height: '5px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(spendingPts / 20) * 100}%`, background: spendingPts >= 15 ? 'var(--emerald)' : 'var(--rose)', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Safe-to-Spend Daily & Weekly (Span 4) */}
      <div className="col-span-4 bento-card" style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Discretionary Budget
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                Safe-to-Spend (S2S)
              </h3>
            </div>
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
              <Zap size={18} />
            </div>
          </div>

          <div style={{ margin: '18px 0 14px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Daily Safe Allowance:</span>
            <div
              style={{
                fontSize: '30px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'Outfit, sans-serif',
                marginTop: '4px',
                letterSpacing: '-0.5px',
              }}
              className="tabular-nums"
            >
              {formatRupiah(fin.safeToSpendDaily)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Weekly Allocation: <strong style={{ color: 'var(--text-primary)' }} className="tabular-nums">{formatRupiah(fin.safeToSpendWeekly)}</strong>
            </div>
          </div>
        </div>

        <div>
          {/* DTI Ratio Card in S2S */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-chip)',
              border: '1px solid var(--border-light)',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Debt Service (DTI):</span>
              <strong style={{ color: fin.dtiPercentage > 30 ? 'var(--amber)' : 'var(--emerald)' }} className="tabular-nums">
                {fin.dtiPercentage}% (Healthy Limit: 30%)
              </strong>
            </div>
            <div style={{ height: '6px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (fin.dtiPercentage / 40) * 100)}%`,
                  background: fin.dtiPercentage > 30 ? 'var(--amber)' : 'var(--emerald)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span>Work Value: <strong className="tabular-nums">{formatRupiah(fin.hourlyWage)}/hr</strong></span>
          </div>
        </div>
      </div>

      {/* Card 3: Net Worth & Emergency Runway (Span 4) */}
      <div className="col-span-4 bento-card" style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Wealth &amp; Resilience
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                Portfolio &amp; Runway
              </h3>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--emerald-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald)',
              }}
            >
              <Wallet size={18} />
            </div>
          </div>

          <div style={{ margin: '18px 0 14px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Estimated Total Net Worth:</span>
            <div
              style={{
                fontSize: '30px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'Outfit, sans-serif',
                marginTop: '4px',
                letterSpacing: '-0.5px',
              }}
              className="tabular-nums"
            >
              {formatRupiah(fin.totalNetWorth)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {assets.length} Active Asset Holdings
            </div>
          </div>
        </div>

        <div>
          {/* Runway Box */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-chip)',
              border: '1px solid var(--border-light)',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Liquid Cash Reserve:</span>
              <strong style={{ color: 'var(--emerald)' }} className="tabular-nums">{formatRupiah(fin.totalLiquidCash)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Emergency Runway:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {fin.emergencyRunwayMonths} Months (Target: {fin.targetEmergencyMonths} Mo)
              </strong>
            </div>
            <div style={{ height: '6px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (fin.emergencyRunwayMonths / fin.targetEmergencyMonths) * 100)}%`,
                  background: 'var(--primary-gradient)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Saved Wealth: <strong style={{ color: 'var(--primary)' }} className="tabular-nums">{formatRupiah(savedMoneyTotal)}</strong></span>
            <button
              onClick={() => onNavigateTab('Asset')}
              style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              View Assets &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: ANALYTICS CHARTS SIDE-BY-SIDE (Span 6 + Span 6)                    */}
      {/* ========================================================================= */}
      <div className="col-span-6">
        <ExpenseBarChart transactions={transactions} />
      </div>

      <div className="col-span-6">
        <AssetGrowthLineChart
          snapshots={snapshots}
          onOpenSnapshotModal={() => onNavigateTab('Asset')}
        />
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: FINANCIAL TARGETS (Span 12)                                        */}
      {/* ========================================================================= */}
      <div
        className="col-span-12 bento-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '22px 24px',
        }}
      >
        {/* Card Header: Title & Sort Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Target size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Financial Targets
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '1px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                  className="tabular-nums"
                >
                  {financialTargets.length} {financialTargets.length === 1 ? 'Target' : 'Targets'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Active target milestones, deadlines, and progress toward financial freedom
              </p>
            </div>
          </div>

          {/* Sort Controls & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Sort:
            </span>

            {/* Sort by Deadline */}
            <button
              type="button"
              onClick={() => handleSortClick('deadline')}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: targetSortField === 'deadline' ? 700 : 500,
                background: targetSortField === 'deadline' ? 'var(--primary)' : 'var(--bg-chip)',
                color: targetSortField === 'deadline' ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${targetSortField === 'deadline' ? 'var(--primary)' : 'var(--border-light)'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Sort by target deadline date"
            >
              <Calendar size={12} />
              <span>Deadline</span>
              {targetSortField === 'deadline' && (
                targetSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
              )}
            </button>

            {/* Sort by Target Amount */}
            <button
              type="button"
              onClick={() => handleSortClick('target')}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: targetSortField === 'target' ? 700 : 500,
                background: targetSortField === 'target' ? 'var(--primary)' : 'var(--bg-chip)',
                color: targetSortField === 'target' ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${targetSortField === 'target' ? 'var(--primary)' : 'var(--border-light)'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Sort by target goal amount"
            >
              <Target size={12} />
              <span>Target Amount</span>
              {targetSortField === 'target' && (
                targetSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
              )}
            </button>

            {/* Sort by Remaining */}
            <button
              type="button"
              onClick={() => handleSortClick('remaining')}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: targetSortField === 'remaining' ? 700 : 500,
                background: targetSortField === 'remaining' ? 'var(--primary)' : 'var(--bg-chip)',
                color: targetSortField === 'remaining' ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${targetSortField === 'remaining' ? 'var(--primary)' : 'var(--border-light)'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Sort by remaining balance to target"
            >
              <span>Remaining</span>
              {targetSortField === 'remaining' && (
                targetSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/planning/targets')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '4px',
              }}
            >
              <span>Manage Targets</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {sortedTargets.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-chip)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-light)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Target size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                No Financial Targets Defined Yet
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 12px', maxWidth: '380px' }}>
                Create structured financial targets (Emergency Buffer, Asset Purchases, Milestone Goals) to track your wealth trajectory.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/planning/targets')}
              className="btn-primary"
              style={{ padding: '7px 16px', fontSize: '12.5px' }}
            >
              <PlusCircle size={14} />
              <span>Set First Financial Target</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '12px',
            }}
          >
            {sortedTargets.map((target) => {
              const remaining = Math.max(0, target.targetAmount - target.currentAmount);
              const progress = target.targetAmount > 0
                ? Math.min(100, Math.round((target.currentAmount / target.targetAmount) * 100))
                : 0;
              const isAchieved = target.status === 'completed' || remaining === 0;
              const deadlineInfo = formatDeadlineInfo(target.deadlineDate);

              return (
                <div
                  key={target.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-chip)',
                    border: isAchieved
                      ? '1px solid rgba(5, 150, 105, 0.3)'
                      : '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Target Title & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={target.name}
                      >
                        {target.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isAchieved ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                            color: isAchieved ? 'var(--emerald)' : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {isAchieved ? <CheckCircle2 size={11} /> : <Target size={11} />}
                          <span>{isAchieved ? 'Achieved' : 'In Progress'}</span>
                        </span>

                        {target.priority && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: target.priority === 'high' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                              color: target.priority === 'high' ? 'var(--rose)' : 'var(--text-muted)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {target.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: isAchieved ? 'rgba(5, 150, 105, 0.15)' : 'var(--primary-light)',
                        color: isAchieved ? 'var(--emerald)' : 'var(--primary)',
                        flexShrink: 0,
                      }}
                    >
                      {progress}%
                    </span>
                  </div>

                  {/* 3 Metric Pills: Target, Sisa Target, Deadline */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '10px 12px',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                        Target Goal
                      </span>
                      <div
                        className="tabular-nums"
                        style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}
                      >
                        {formatRupiah(target.targetAmount)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                        Remaining
                      </span>
                      <div
                        className="tabular-nums"
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: isAchieved ? 'var(--emerald)' : 'var(--rose)',
                          marginTop: '2px',
                        }}
                      >
                        {formatRupiah(remaining)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                        Deadline
                      </span>
                      <div
                        style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}
                      >
                        {deadlineInfo.formatted}
                      </div>
                      {deadlineInfo.relative && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: deadlineInfo.isOverdue ? 'var(--rose)' : 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          {deadlineInfo.relative}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Saved Info */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Saved: <strong className="tabular-nums" style={{ color: 'var(--primary)' }}>{formatRupiah(target.currentAmount)}</strong></span>
                      <span className="tabular-nums">{progress}% achieved</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#E2ECE5', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: isAchieved ? 'var(--emerald)' : 'var(--primary-gradient)',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
