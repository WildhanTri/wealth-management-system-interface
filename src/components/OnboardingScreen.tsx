import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { setProfile, setHydrated } from '../store/slices/userSlice';
import { setAssets } from '../store/slices/assetSlice';
import { setTransactions } from '../store/slices/transactionSlice';
import { setQuarantineState } from '../store/slices/decisionSlice';
import { setSnapshots } from '../store/slices/snapshotSlice';
import { completeFirstOnboarding } from '../services/appInit';
import { formatRupiah } from '../utils/financialCalculations';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  TrendingUp,
  Clock,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import appLogo from '../assets/logo.png';
import { AssetItem } from '../types';
import { CustomSelect } from './CustomSelect';
import { CurrencyInput } from './CurrencyInput';
import { NumberInput } from './NumberInput';
import { AssetBuilderStep } from './AssetBuilderStep';

interface OnboardingScreenProps {
  onFinish?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Demographics
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [industry, setIndustry] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [isMarried, setIsMarried] = useState(false);
  const [hasDependents, setHasDependents] = useState(false);
  const [dependentsCount, setDependentsCount] = useState<number | ''>('');

  // Step 2: Financial Baseline
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [monthlyInstallments, setMonthlyInstallments] = useState<number | ''>('');
  const [weeklyWorkHours, setWeeklyWorkHours] = useState<number | ''>('');

  // Step 3: Starting Assets (Dynamic 5-Category List)
  const [assetsList, setAssetsList] = useState<AssetItem[]>([]);

  // Live Calculations
  const numMonthlyIncome = Number(monthlyIncome) || 0;
  const numMonthlyInstallments = Number(monthlyInstallments) || 0;
  const numWeeklyWorkHours = Number(weeklyWorkHours) || 40;

  const monthlyWorkHours = Math.max(1, numWeeklyWorkHours * 4.33);
  const estimatedHourlyRate = numMonthlyIncome > 0 ? Math.round(numMonthlyIncome / monthlyWorkHours) : 0;
  const dti = numMonthlyIncome > 0 ? (numMonthlyInstallments / numMonthlyIncome) * 100 : 0;

  // Emergency target calibration
  let targetEmergencyMonths = 3;
  if (isMarried) {
    targetEmergencyMonths = hasDependents ? 9 : 6;
  } else if (hasDependents) {
    targetEmergencyMonths = 6;
  }

  // Live total net worth from entered assets
  const liveNetWorth = assetsList.reduce((sum, a) => sum + (a.estimatedValue || 0), 0) - numMonthlyInstallments;

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#48B07D', '#3AA06F', '#6EE7B7', '#10B981'],
        });
      } catch (e) {
        // Safe fallback
      }

      const userProfile = {
        name: name.trim() || 'User',
        industry: industry || 'Other',
        jobRole: jobRole.trim() || 'Professional',
        age: Number(age) || 0,
        monthlyIncome: numMonthlyIncome,
        isMarried,
        hasDependents,
        dependentsCount: hasDependents ? Number(dependentsCount) || 0 : 0,
        monthlyInstallments: numMonthlyInstallments,
        joinedAt: Date.now(),
      };

      // Synchronize directly with PostgreSQL backend API
      const initResult = await completeFirstOnboarding(userProfile, assetsList);

      // Synchronize Redux store
      dispatch(setProfile(userProfile));
      dispatch(setAssets(initResult.assets));
      dispatch(setTransactions(initResult.transactions));
      dispatch(setSnapshots(initResult.snapshots || []));
      dispatch(
        setQuarantineState({
          quarantineItems: initResult.quarantineItems,
          savedMoneyTotal: initResult.savedMoneyTotal,
          preventedCount: initResult.preventedCount,
        })
      );
      dispatch(setHydrated({ profile: userProfile, isOnboarded: true }));

      if (onFinish) {
        onFinish();
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* LEFT PANEL: BRANDING & LIVE DIAGNOSTIC (Desktop Split-Screen 42%)          */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(155deg, #13271D 0%, #1A3628 50%, #112219 100%)',
          color: '#FFFFFF',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Brand header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                padding: '6px',
              }}
            >
              <img src={appLogo} alt="Crescent Wealth Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0 }}>
                Crescent Wealth
              </h2>
              <span style={{ fontSize: '11px', color: '#84D8A9', fontWeight: 700, letterSpacing: '0.5px' }}>
                Management System
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#E2ECE5', lineHeight: 1.35, marginBottom: '24px' }}>
            Build Your Anti-Impulsive Financial Foundation
          </h3>

          {/* Vertical Stepper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
            {/* Step 1 Item */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: step > 1 ? 'var(--primary)' : step === 1 ? 'rgba(72, 176, 125, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${step >= 1 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: step > 1 ? '#fff' : step === 1 ? '#84D8A9' : '#8A9E94',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {step > 1 ? <Check size={14} strokeWidth={3} /> : '1'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: step === 1 ? '#FFFFFF' : '#A3BAAE' }}>
                  Personal & Career Profile
                </div>
                <div style={{ fontSize: '11px', color: '#6F8C7D', marginTop: '1px' }}>
                  Identity, age, industry & family responsibilities
                </div>
              </div>
            </div>

            {/* Step 2 Item */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: step > 2 ? 'var(--primary)' : step === 2 ? 'rgba(72, 176, 125, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${step >= 2 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: step > 2 ? '#fff' : step === 2 ? '#84D8A9' : '#8A9E94',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {step > 2 ? <Check size={14} strokeWidth={3} /> : '2'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: step === 2 ? '#FFFFFF' : '#A3BAAE' }}>
                  Cash Flow & Life Energy Rate
                </div>
                <div style={{ fontSize: '11px', color: '#6F8C7D', marginTop: '1px' }}>
                  Monthly income, debt obligations & value of 1 working hour
                </div>
              </div>
            </div>

            {/* Step 3 Item */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: step === 3 ? 'rgba(72, 176, 125, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${step === 3 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: step === 3 ? '#84D8A9' : '#8A9E94',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: step === 3 ? '#FFFFFF' : '#A3BAAE' }}>
                  Foundation Asset Holdings (5 Tiers)
                </div>
                <div style={{ fontSize: '11px', color: '#6F8C7D', marginTop: '1px' }}>
                  3 Liquidity layers: Cash buffer, Hard assets & Investments
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Diagnostic Preview Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(72, 176, 125, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: '#84D8A9', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            <Zap size={14} />
            Live Diagnostic Preview
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#8A9E94' }}>Value of 1 Working Hour:</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }} className="tabular-nums">
                {formatRupiah(estimatedHourlyRate)}/hr
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#8A9E94' }}>Debt-to-Income (DTI):</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: dti <= 30 ? '#48B07D' : '#F43F5E',
                  marginTop: '2px',
                }}
                className="tabular-nums"
              >
                {dti.toFixed(1)}% {dti <= 30 ? '(Healthy)' : '(High)'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#8A9E94' }}>Target Emergency Buffer:</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {targetEmergencyMonths} Months Runway
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#8A9E94' }}>Estimated Net Worth:</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#84D8A9', marginTop: '2px' }} className="tabular-nums">
                {formatRupiah(Math.max(0, liveNetWorth))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: FORM WORKSPACE (Desktop Split-Screen 58%)                   */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: '#FFFFFF',
        }}
      >
        {/* Step Header */}
        <div
          style={{
            padding: '24px 32px 18px',
            borderBottom: '1px solid var(--border-light)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Step {step} of 3
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {step === 1 && 'Personal & Career Profile'}
                {step === 2 && 'Cash Flow & Life Energy Baseline'}
                {step === 3 && 'Starting Asset Holdings (5 Tiers)'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    width: '32px',
                    height: '5px',
                    borderRadius: '3px',
                    background: step >= s ? 'var(--primary)' : 'var(--border-light)',
                    transition: 'all 0.25s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Welcome to Crescent Wealth Management System!</strong> Complete this quick setup to calibrate your personal wealth dashboard and financial health score.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                <NumberInput
                  label="Age (Years)"
                  value={age}
                  onChange={(val) => setAge(val)}
                  placeholder="e.g. 28"
                  min={17}
                  max={80}
                  suffix="Years"
                />

                <div>
                  <CustomSelect
                    label="Industry Sector"
                    value={industry}
                    onChange={(val) => setIndustry(val)}
                    placeholder="Select industry sector..."
                    options={[
                      { value: 'Technology / IT', label: 'Technology / IT', badge: 'High Growth' },
                      { value: 'Finance & Banking', label: 'Finance & Banking', badge: 'Formal' },
                      { value: 'Creative & Media', label: 'Creative & Media', badge: 'Dynamic' },
                      { value: 'FMCG & Retail', label: 'FMCG & Retail', badge: 'Consumer' },
                      { value: 'Healthcare & Medical', label: 'Healthcare & Medical', badge: 'Essential' },
                      { value: 'Education & Research', label: 'Education & Research', badge: 'Academic' },
                      { value: 'Entrepreneurship', label: 'Entrepreneurship / Business', badge: 'Enterprise' },
                      { value: 'Other', label: 'Other Industries', badge: 'General' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Job Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer, Product Designer, VP of Operations"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isMarried ? 'var(--primary-light)' : 'var(--bg-chip)',
                    border: `1px solid ${isMarried ? 'var(--primary)' : 'var(--border-light)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isMarried}
                    onChange={(e) => setIsMarried(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Married Status</span>
                </label>

                <label
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: hasDependents ? 'var(--primary-light)' : 'var(--bg-chip)',
                    border: `1px solid ${hasDependents ? 'var(--primary)' : 'var(--border-light)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasDependents}
                    onChange={(e) => {
                      setHasDependents(e.target.checked);
                      if (e.target.checked && dependentsCount === 0) setDependentsCount(1);
                    }}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Has Dependents</span>
                </label>
              </div>

              {hasDependents && (
                <NumberInput
                  label="Number of Dependents (Children / Dependent Parents)"
                  value={dependentsCount}
                  onChange={(val) => setDependentsCount(val)}
                  placeholder="1"
                  min={1}
                  max={20}
                  suffix="Dependents"
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <CurrencyInput
                label="Monthly Net Take-Home Income"
                value={monthlyIncome}
                onChange={(val) => setMonthlyIncome(val)}
                placeholder="0"
                prefix="Rp"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <CurrencyInput
                  label="Monthly Debt Repayments (Mortgage, Loans, Credit)"
                  value={monthlyInstallments}
                  onChange={(val) => setMonthlyInstallments(val)}
                  placeholder="0"
                  prefix="Rp"
                />

                <NumberInput
                  label="Working Hours / Week"
                  value={weeklyWorkHours}
                  onChange={(val) => setWeeklyWorkHours(val)}
                  placeholder="40"
                  min={1}
                  max={168}
                  suffix="Hrs/wk"
                />
              </div>

              {/* Live Card Highlight */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  <Zap size={15} />
                  Life Energy &amp; Debt Calibration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Value of 1 Hour Worked:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="tabular-nums">
                      {formatRupiah(estimatedHourlyRate)} / hr
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Impulse evaluation benchmark</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Debt-to-Income (DTI):</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: dti <= 30 ? 'var(--emerald)' : 'var(--rose)', marginTop: '2px' }} className="tabular-nums">
                      {dti.toFixed(1)}% {dti <= 30 ? '(Healthy)' : '(Elevated)'}
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Healthy threshold is ≤ 30%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <AssetBuilderStep
              assets={assetsList}
              onChange={setAssetsList}
            />
          )}
        </div>

        {/* Desktop Footer Actions */}
        <div
          style={{
            padding: '18px 32px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: '#FFFFFF',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="btn-neutral"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="btn-primary"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Saving Records...' : 'Complete & Launch Dashboard'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
