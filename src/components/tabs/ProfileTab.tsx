import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { calculateFinancials, formatRupiah } from '../../utils/financialCalculations';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import appLogo from '../../assets/logo.png';
import {
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Award,
  RotateCcw,
  Briefcase,
  Layers,
  HeartHandshake,
  DollarSign,
  TrendingUp,
  Percent,
  KeyRound,
  LogOut,
  Lock,
  Mail,
} from 'lucide-react';

interface ProfileTabProps {
  onRestartOnboarding: () => void;
  onSecretTrigger?: () => void;
  onSignOut?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onRestartOnboarding, onSecretTrigger, onSignOut }) => {
  const dispatch = useAppDispatch();
  const [footerClicks, setFooterClicks] = useState(0);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const authUser = useAppSelector((state) => state.auth.user);
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);
  const savedMoneyTotal = useAppSelector((state) => state.decision.savedMoneyTotal);
  const preventedCount = useAppSelector((state) => state.decision.preventedCount);

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out of Crescent Wealth?')) {
      dispatch(logout());
      onSignOut?.();
    }
  };

  const fin = calculateFinancials(profile, assets, transactions);

  // Calculate life energy hours saved
  const hoursSaved = fin.hourlyWage > 0 ? (savedMoneyTotal / fin.hourlyWage).toFixed(1) : '0';

  return (
    <div className="tab-pane animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
          Financial Profile &amp; Discipline
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Life energy calibration, anti-impulsive efficiency, and wealth discipline milestones
        </p>
      </div>

      {/* Two-Column Balanced Layout (5 + 7) */}
      <div className="bento-grid" style={{ alignItems: 'start' }}>
        {/* Left Column: Profile Info, Parameters, Reset */}
        <div className="col-span-12" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* User Header Profile Card */}
          <div
            className="glass"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7F3 100%)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(72, 176, 125, 0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '22px',
                boxShadow: '0 8px 24px rgba(72, 176, 125, 0.35)',
                flexShrink: 0,
                border: '2px solid rgba(255, 255, 255, 0.9)',
              }}
            >
              {profile?.name
                ? profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                : 'U'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {profile?.name || 'User'}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontWeight: 800,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  PRO
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {profile?.jobRole || 'Professional'} • {profile?.industry || 'General Industry'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span>{profile?.age ? `${profile.age} Yrs` : '-'}</span>
                <span>•</span>
                <span>{profile?.isMarried ? 'Married' : 'Single'}</span>
                <span>•</span>
                <span>{profile?.hasDependents ? `${profile.dependentsCount} Dependents` : 'No Dependents'}</span>
              </div>
            </div>
          </div>

          {/* Financial Parameters & Life Energy */}
          <div
            className="glass"
            style={{
              padding: '22px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Briefcase size={17} color="var(--primary)" />
              <span>Financial Parameters &amp; Work Energy</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-chip)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monthly Net Income</span>
                <p className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
                  {formatRupiah(profile?.monthlyIncome || 0)}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-chip)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monthly Debt Service</span>
                <p className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: fin.dtiPercentage > 30 ? 'var(--rose)' : 'var(--text-primary)', marginTop: '3px' }}>
                  {formatRupiah(profile?.monthlyInstallments || 0)}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-chip)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Value of 1 Working Hour</span>
                <p className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '3px' }}>
                  {formatRupiah(fin.hourlyWage)}/hr
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-chip)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Debt-to-Income (DTI)</span>
                <p className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: fin.dtiPercentage <= 30 ? 'var(--emerald)' : 'var(--rose)', marginTop: '3px' }}>
                  {fin.dtiPercentage.toFixed(1)}% {fin.dtiPercentage <= 30 ? '(Healthy)' : '(Elevated)'}
                </p>
              </div>
            </div>

            {/* 3-Tier Wealth Hierarchy Breakdown */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Three-Tier Wealth Architecture:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tier 1: Liquid Cash Buffer</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatRupiah(fin.totalLiquidCash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tier 2: Tangible Physical Assets</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatRupiah(fin.totalHardAssets)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tier 3: Market Investments</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatRupiah(fin.totalInvestments)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Security & Authentication Card */}
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
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Lock size={17} color="var(--primary)" />
              <span>Account &amp; Security</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Mail size={15} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>{authUser?.email || 'Authenticated User'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="btn-secondary"
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <KeyRound size={14} />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn-neutral"
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: 'var(--rose)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Reset Onboarding Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              onClick={() => {
                setFooterClicks((prev) => {
                  const next = prev + 1;
                  if (next >= 5) {
                    onSecretTrigger?.();
                    return 0;
                  }
                  return next;
                });
              }}
              title="Crescent Wealth Management System"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                marginTop: '6px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <img src={appLogo} alt="Logo" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
              <span>Crescent Wealth Management System v1.0.0 &bull; CrescentLabz</span>
            </div>
          </div>
        </div>
      </div>
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
