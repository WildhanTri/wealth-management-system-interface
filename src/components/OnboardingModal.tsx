import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setProfile } from '../store/slices/userSlice';
import { addAsset, setAssets } from '../store/slices/assetSlice';
import { UserProfile, AssetItem } from '../types';
import confetti from 'canvas-confetti';
import {
  User,
  DollarSign,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  X,
} from 'lucide-react';
import { formatRupiah } from '../utils/financialCalculations';
import { apiService } from '../services/apiService';
import { CustomSelect } from './CustomSelect';
import { CurrencyInput } from './CurrencyInput';
import { NumberInput } from './NumberInput';
import { AssetBuilderStep } from './AssetBuilderStep';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector((state) => state.user.profile);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Profil Dasar
  const [name, setName] = useState(currentProfile?.name || '');
  const [age, setAge] = useState<number | ''>(currentProfile?.age || '');
  const [industry, setIndustry] = useState(currentProfile?.industry || '');
  const [jobRole, setJobRole] = useState(currentProfile?.jobRole || '');
  const [isMarried, setIsMarried] = useState(currentProfile?.isMarried || false);
  const [hasDependents, setHasDependents] = useState(currentProfile?.hasDependents || false);
  const [dependentsCount, setDependentsCount] = useState<number | ''>(currentProfile?.dependentsCount || '');

  // Step 2: Profil Keuangan
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>(currentProfile?.monthlyIncome || '');
  const [monthlyInstallments, setMonthlyInstallments] = useState<number | ''>(currentProfile?.monthlyInstallments || '');
  const [weeklyWorkHours, setWeeklyWorkHours] = useState<number | ''>('');

  // Step 3: Profil Kekayaan (Dynamic 5-Category List)
  const currentAssets = useAppSelector((state) => state.asset.items);
  const [assetsList, setAssetsList] = useState<AssetItem[]>(currentAssets || []);

  if (!isOpen) return null;

  const numMonthlyIncome = Number(monthlyIncome) || 0;
  const numMonthlyInstallments = Number(monthlyInstallments) || 0;
  const numWeeklyWorkHours = Number(weeklyWorkHours) || 40;

  // Real-time calculation for Life Energy preview in Step 2
  const monthlyWorkHours = (numWeeklyWorkHours * 52) / 12;
  const estimatedHourlyRate = monthlyWorkHours > 0 && numMonthlyIncome > 0 ? Math.round(numMonthlyIncome / monthlyWorkHours) : 0;
  const dti = numMonthlyIncome > 0 ? (numMonthlyInstallments / numMonthlyIncome) * 100 : 0;

  const handleFinish = () => {
    const newProfile: UserProfile = {
      name: name.trim() || 'Crescent Wealth User',
      age: Number(age) || 25,
      industry,
      jobRole: jobRole.trim() || 'Professional',
      isMarried,
      hasDependents,
      dependentsCount: hasDependents ? Number(dependentsCount) || 0 : 0,
      monthlyIncome: numMonthlyIncome,
      monthlyInstallments: numMonthlyInstallments,
      joinedAt: currentProfile?.joinedAt || Date.now(),
    };

    dispatch(setProfile(newProfile));
    dispatch(setAssets(assetsList));

    // Sync with PostgreSQL backend API
    apiService
      .completeOnboarding({
        profile: newProfile,
        initialAssets: assetsList,
      })
      .catch((err) => console.error('Failed to update onboarding via API:', err));

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(24, 47, 36, 0.45)',
        backdropFilter: 'blur(10px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 60px rgba(24, 47, 36, 0.16)',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header / Steps progress */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Setup Profile — Crescent Wealth</h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper indicator */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: step >= s ? 'var(--primary)' : 'var(--border-light)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {step === 1 && 'Step 1 of 3: Core Profile & Demographics'}
            {step === 2 && 'Step 2 of 3: Financial Baseline & Life Energy'}
            {step === 3 && 'Step 3 of 3: Wealth Architecture (3-Tier Portfolio)'}
          </div>
        </div>

        {/* Content Wizard */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <NumberInput
                  label="Age (Years)"
                  value={age}
                  onChange={(val) => setAge(val)}
                  placeholder="e.g. 25"
                  min={17}
                  max={80}
                  suffix="Years"
                />

                <div>
                  <CustomSelect
                    label="Industry Sector"
                    value={industry}
                    onChange={(val) => setIndustry(val)}
                    placeholder="Select Industry Sector..."
                    options={[
                      { value: 'Technology / IT', label: 'Technology / IT', badge: 'High Growth' },
                      { value: 'Finance & Banking', label: 'Finance & Banking', badge: 'Formal' },
                      { value: 'Creative & Media', label: 'Creative & Media', badge: 'Dynamic' },
                      { value: 'FMCG & Retail', label: 'FMCG & Retail', badge: 'Consumer' },
                      { value: 'Education & Healthcare', label: 'Education & Healthcare', badge: 'Essential' },
                      { value: 'Entrepreneurship / Self-Employed', label: 'Entrepreneurship / Self-Employed', badge: 'Business' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Job Role / Title
                </label>
                <input
                  type="text"
                  placeholder="Enter job role or profession"
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
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                <label
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: isMarried ? 'var(--primary-light)' : 'var(--bg-chip)',
                    border: `1px solid ${isMarried ? 'var(--primary)' : 'var(--border-light)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isMarried}
                    onChange={(e) => setIsMarried(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Married</span>
                </label>

                <label
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: hasDependents ? 'var(--primary-light)' : 'var(--bg-chip)',
                    border: `1px solid ${hasDependents ? 'var(--primary)' : 'var(--border-light)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasDependents}
                    onChange={(e) => {
                      setHasDependents(e.target.checked);
                      if (e.target.checked && dependentsCount === 0) setDependentsCount(1);
                    }}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Has Dependents</span>
                </label>
              </div>

              {hasDependents && (
                <NumberInput
                  label="Number of Dependents (Children / Elderly)"
                  value={dependentsCount}
                  onChange={(val) => setDependentsCount(val)}
                  placeholder="1"
                  min={1}
                  max={20}
                  suffix="Persons"
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <CurrencyInput
                label="Net Monthly Base Income"
                value={monthlyIncome}
                onChange={(val) => setMonthlyIncome(val)}
                placeholder="0"
                prefix="Rp"
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                <CurrencyInput
                  label="Total Monthly Debt Installments (Mortgages, Vehicle, Loans)"
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
                  suffix="hrs/week"
                />
              </div>

              {/* Real-time Calculation Badge */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '8px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} />
                  <span>Automated Life Energy Value Calculation</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Value of 1 Hour of Life:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                      {formatRupiah(estimatedHourlyRate)} / hr
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Debt-to-Income (DTI):</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: dti <= 30 ? 'var(--emerald)' : 'var(--rose)', fontFamily: 'Outfit, sans-serif' }}>
                      {dti.toFixed(1)}% {dti <= 30 ? '(Healthy)' : '(High)'}
                    </div>
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

        {/* Footer Navigation */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="btn-secondary"
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
              }}
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
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn-primary"
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-gradient)',
                boxShadow: '0 4px 18px rgba(72, 176, 125, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={16} />
              Complete &amp; Enter System
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
