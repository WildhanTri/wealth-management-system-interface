import React from 'react';
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
} from 'lucide-react';
import { ExpenseBarChart } from '../charts/ExpenseBarChart';
import { AssetGrowthLineChart } from '../charts/AssetGrowthLineChart';
import appLogoInverted from '../../assets/logo-inverted.png';

interface BerandaTabProps {
  onNavigateTab: (tab: 'Beranda' | 'Transaksi' | 'Planning' | 'Asset' | 'Profile') => void;
  onOpenAddTx: () => void;
}

export const BerandaTab: React.FC<BerandaTabProps> = ({ onNavigateTab, onOpenAddTx }) => {
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);
  const snapshots = useAppSelector((state) => state.snapshot.items);
  const savedMoneyTotal = useAppSelector((state) => state.decision.savedMoneyTotal);

  const fin = calculateFinancials(profile, assets, transactions);

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
              Welcome back, {profile?.name || 'Investor'} 👋
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
    </div>
  );
};
