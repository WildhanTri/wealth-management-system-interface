import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { logout } from './store/slices/authSlice';
import { setProfile, resetOnboarding, setHydrated } from './store/slices/userSlice';
import { setTransactions } from './store/slices/transactionSlice';
import { setAssets } from './store/slices/assetSlice';
import { setQuarantineState } from './store/slices/decisionSlice';
import { setSnapshots } from './store/slices/snapshotSlice';
import { setPlans } from './store/slices/planSlice';
import {
  setRevenueStreams,
  setFixedCosts,
  setFinancialTargets,
  setDebts,
} from './store/slices/planningSlice';
import { initializeAppState } from './services/appInit';
import { apiService } from './services/apiService';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { calculateFinancials } from './utils/financialCalculations';
import { TransactionType } from './types';
import {
  Home,
  ArrowUpDown,
  Layers,
  User,
  LogOut,
  Compass,
  ChevronDown,
  TrendingUp,
  CalendarCheck,
  Target,
  CreditCard,
} from 'lucide-react';
import './App.css';
import appLogo from './assets/logo.png';

// Tabs
import { BerandaTab } from './components/tabs/BerandaTab';
import { TransaksiTab } from './components/tabs/TransaksiTab';
import { AssetTab } from './components/tabs/AssetTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { FinancialPlanningTab } from './components/tabs/planning/FinancialPlanningTab';

// Modals
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddAssetModal } from './components/AddAssetModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SecretDBInspector } from './components/dev/SecretDBInspector';

type TabType = 'Beranda' | 'Transaksi' | 'Planning' | 'Asset' | 'Profile';

export function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveRouteTab = (): TabType => {
    const p = location.pathname.toLowerCase();
    if (p.startsWith('/transaction') || p.startsWith('/transaksi')) return 'Transaksi';
    if (
      p.startsWith('/planning') ||
      p.startsWith('/revenue') ||
      p.startsWith('/fixed-cost') ||
      p.startsWith('/target') ||
      p.startsWith('/financial-target')
    ) {
      return 'Planning';
    }
    if (p.startsWith('/asset') || p.startsWith('/net-worth')) return 'Asset';
    if (p.startsWith('/profile')) return 'Profile';
    return 'Beranda';
  };

  const activeTab = getActiveRouteTab();

  const handleNavigateTab = (tab: TabType) => {
    switch (tab) {
      case 'Beranda':
        navigate('/dashboard');
        break;
      case 'Transaksi':
        navigate('/transactions');
        break;
      case 'Planning':
        navigate('/planning');
        break;
      case 'Asset':
        navigate('/assets');
        break;
      case 'Profile':
        navigate('/profile');
        break;
    }
  };

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxInitialType, setAddTxInitialType] = useState<TransactionType>('expense');
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSecretInspectorOpen, setIsSecretInspectorOpen] = useState(false);
  const [_brandClickCount, setBrandClickCount] = useState(0);

  const handleOpenAddTx = (type: TransactionType = 'expense') => {
    setAddTxInitialType(type);
    setIsAddTxOpen(true);
  };

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authUser = useAppSelector((state) => state.auth.user);
  const isHydrated = useAppSelector((state) => state.user.isHydrated);
  const isOnboarded = useAppSelector((state) => state.user.isOnboarded);
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);
  const plans = useAppSelector((state) => state.plan.items);
  const fixedCosts = useAppSelector((state) => state.planning.fixedCosts);
  const revenueStreams = useAppSelector((state) => state.planning.revenueStreams);
  const financialTargets = useAppSelector((state) => state.planning.financialTargets);
  const debts = useAppSelector((state) => state.planning.debts);

  const [isPlanningMenuOpen, setIsPlanningMenuOpen] = useState(false);

  useEffect(() => {
    if (
      location.pathname.startsWith('/planning') ||
      location.pathname.startsWith('/debts') ||
      location.pathname.startsWith('/debt')
    ) {
      setIsPlanningMenuOpen(true);
    }
  }, [location.pathname]);

  // Financial calculations for live status pill in desktop header
  const fin = calculateFinancials(profile, assets, transactions);

  // Load user data from PostgreSQL backend API
  const loadUserData = useCallback(() => {
    initializeAppState()
      .then((data) => {
        if (data.isOnboarded && data.profile) {
          dispatch(setProfile(data.profile));
          dispatch(setTransactions(data.transactions));
          dispatch(setAssets(data.assets));
          dispatch(setSnapshots(data.snapshots || []));
          dispatch(setPlans(data.plannedExpenses || []));
          if (data.revenueStreams) dispatch(setRevenueStreams(data.revenueStreams));
          if (data.fixedCosts) dispatch(setFixedCosts(data.fixedCosts));
          if (data.financialTargets) dispatch(setFinancialTargets(data.financialTargets));
          if (data.debts) dispatch(setDebts(data.debts));
          dispatch(
            setQuarantineState({
              quarantineItems: data.quarantineItems,
              savedMoneyTotal: data.savedMoneyTotal,
              preventedCount: data.preventedCount,
            })
          );
          dispatch(setHydrated({ profile: data.profile, isOnboarded: true }));
        } else {
          if (data.revenueStreams) dispatch(setRevenueStreams(data.revenueStreams));
          if (data.fixedCosts) dispatch(setFixedCosts(data.fixedCosts));
          if (data.financialTargets) dispatch(setFinancialTargets(data.financialTargets));
          if (data.debts) dispatch(setDebts(data.debts));
          dispatch(setHydrated({ profile: data.profile || null, isOnboarded: data.isOnboarded }));
        }
      })
      .catch((err) => {
        console.error('Failed to initialize app state:', err);
        dispatch(setHydrated({ profile: null, isOnboarded: false }));
      });
  }, [dispatch]);

  // Synchronize on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated, loadUserData]);

  // Secret developer keyboard shortcut: Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsSecretInspectorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSecretBrandClick = () => {
    setBrandClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsSecretInspectorOpen(true);
        return 0;
      }
      return next;
    });
  };

  const handleSignOut = () => {
    if (window.confirm('Sign out of Crescent Wealth Management System?')) {
      dispatch(logout());
      dispatch(setHydrated({ profile: null, isOnboarded: false }));
      navigate('/login');
    }
  };

  const handleRestartOnboarding = async () => {
    if (window.confirm('Reset all saved financial data and restart the onboarding process?')) {
      await apiService.resetPortfolio();
      dispatch(resetOnboarding());
      dispatch(setTransactions([]));
      dispatch(setAssets([]));
      dispatch(setSnapshots([]));
      dispatch(setPlans([]));
      dispatch(
        setQuarantineState({
          quarantineItems: [],
          savedMoneyTotal: 0,
          preventedCount: 0,
        })
      );
      navigate('/onboarding');
    }
  };

  // 1. Authentication Gate: If not authenticated, render AuthScreen with routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthScreen initialMode="login" onSuccess={loadUserData} />} />
        <Route path="/register" element={<AuthScreen initialMode="register" onSuccess={loadUserData} />} />
        <Route path="/forgot-password" element={<AuthScreen initialMode="forgot" onSuccess={loadUserData} />} />
        <Route path="/reset-password" element={<AuthScreen initialMode="reset" onSuccess={loadUserData} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 2. Loading State while data initializes
  if (!isHydrated) {
    return (
      <div
        style={{
          height: '100dvh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '18px',
          background: 'var(--bg-app)',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.98) 100%)',
            border: '1.5px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(72, 176, 125, 0.25)',
            padding: '8px',
          }}
        >
          <img src={appLogo} alt="Crescent Wealth Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Loading Crescent Wealth Management System...
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Synchronizing your financial portfolio...
          </p>
        </div>
      </div>
    );
  }

  // 3. First-time Opening: Direct to Onboarding Screen First!
  if (!isOnboarded) {
    return (
      <div className="onboarding-desktop-viewport">
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />
        <div className="onboarding-desktop-canvas">
          <Routes>
            <Route path="/onboarding" element={<OnboardingScreen onFinish={() => navigate('/dashboard')} />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Active plans count
  const activePlansCount = plans.filter((p) => p.status === 'active').length;

  // Header Titles
  const getTabHeader = () => {
    switch (activeTab) {
      case 'Beranda':
        return {
          title: 'Financial Command Center',
          subtitle: 'Real-Time Financial Radar & Health Assessment',
        };
      case 'Transaksi':
        return {
          title: 'Cash Flow & Planned Expenses',
          subtitle: 'Expense Tracking, Emotional Velocity & Sinking Funds',
        };
      case 'Planning':
        return {
          title: 'Financial Planning & Targets',
          subtitle: 'Revenue Streams, Monthly Fixed Commitments & Wealth Milestones',
        };
      case 'Asset':
        return {
          title: 'Wealth Hierarchy & Asset Portfolio',
          subtitle: '3-Tier Liquidity Structure & Periodic Valuation History',
        };
      case 'Profile':
        return {
          title: 'Financial Profile & Discipline',
          subtitle: 'Impulse Guard Jar, Work-Hour Equivalent & Achievements',
        };
    }
  };

  const currentHeader = getTabHeader();

  // 3. Main Desktop Application (After Onboarding is Completed)
  return (
    <div className="app-shell">
      {/* Ambient background glows */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Desktop & Laptop)                             */}
      {/* ========================================================================= */}
      <aside className="app-sidebar">
        <div>
          {/* Brand header */}
          <div
            className="sidebar-brand"
            onClick={handleSecretBrandClick}
            title="Crescent Wealth Management System"
          >
            <div
              className="sidebar-brand-icon"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.98) 100%)',
                border: '1px solid var(--border-subtle)',
                padding: '4px',
              }}
            >
              <img src={appLogo} alt="Crescent Wealth" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">Crescent Wealth</div>
              <div className="sidebar-brand-badge">Management System</div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="sidebar-nav">
            <button
              onClick={() => navigate('/dashboard')}
              className={`sidebar-nav-item ${activeTab === 'Beranda' ? 'active' : ''}`}
            >
              <Home size={18} />
              <span className="sidebar-label">Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/transactions')}
              className={`sidebar-nav-item ${activeTab === 'Transaksi' ? 'active' : ''}`}
            >
              <ArrowUpDown size={18} />
              <span className="sidebar-label">Cash Flow & Plans</span>
              {activePlansCount > 0 && (
                <span className="sidebar-nav-badge">{activePlansCount}</span>
              )}
            </button>

            {/* Financial Planning Parent Item with Dropdown Accordion */}
            <div className="sidebar-nav-group">
              <button
                onClick={() => {
                  setIsPlanningMenuOpen((prev) => !prev);
                  if (activeTab !== 'Planning') {
                    navigate('/planning');
                  }
                }}
                className={`sidebar-nav-item ${activeTab === 'Planning' ? 'active' : ''}`}
              >
                <Compass size={18} />
                <span className="sidebar-label">Financial Planning</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {revenueStreams.length + fixedCosts.length + financialTargets.length + debts.length > 0 && (
                    <span className="sidebar-nav-badge">
                      {revenueStreams.length + fixedCosts.length + financialTargets.length + debts.length}
                    </span>
                  )}
                  <div
                    style={{
                      transform: isPlanningMenuOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronDown size={14} />
                  </div>
                </div>
              </button>

              {isPlanningMenuOpen && (
                <div className="sidebar-nav-subitems">
                  <button
                    onClick={() => navigate('/planning/revenue-streams')}
                    className={`sidebar-nav-subitem ${location.pathname.includes('/revenue') ? 'active' : ''
                      }`}
                  >
                    <TrendingUp size={14} />
                    <span>Revenue Streams</span>
                    {revenueStreams.length > 0 && (
                      <span className="sidebar-nav-subitem-badge">{revenueStreams.length}</span>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/planning/fixed-costs')}
                    className={`sidebar-nav-subitem ${location.pathname.includes('/fixed-cost') ? 'active' : ''
                      }`}
                  >
                    <CalendarCheck size={14} />
                    <span>Fixed Costs</span>
                    {fixedCosts.length > 0 && (
                      <span className="sidebar-nav-subitem-badge">{fixedCosts.length}</span>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/planning/financial-targets')}
                    className={`sidebar-nav-subitem ${location.pathname.includes('/financial-targets') ? 'active' : ''
                      }`}
                  >
                    <Target size={14} />
                    <span>Financial Targets</span>
                    {financialTargets.length > 0 && (
                      <span className="sidebar-nav-subitem-badge">{financialTargets.length}</span>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/planning/debts')}
                    className={`sidebar-nav-subitem ${location.pathname.includes('/debt') ? 'active' : ''
                      }`}
                  >
                    <CreditCard size={14} />
                    <span>Debt Liabilities</span>
                    {debts.length > 0 && (
                      <span className="sidebar-nav-subitem-badge">{debts.length}</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/assets')}
              className={`sidebar-nav-item ${activeTab === 'Asset' ? 'active' : ''}`}
            >
              <Layers size={18} />
              <span className="sidebar-label">Wealth & Assets</span>
              <span className="sidebar-nav-badge">{assets.length}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* User Account Info & Profile Navigation Card */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card-subtle)',
              border: activeTab === 'Profile' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  minWidth: 0,
                  cursor: 'pointer',
                  flex: 1,
                }}
                title="View Profile & Insights"
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary-gradient)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {(authUser?.fullname || profile?.name || 'U')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {authUser?.fullname || profile?.name || 'User'}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {authUser?.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--rose)',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <LogOut size={15} />
              </button>
            </div>

            {/* Profile & Insights Button */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-sm)',
                margin: 0,
                background: activeTab === 'Profile' ? 'var(--primary)' : 'var(--primary-light)',
                color: activeTab === 'Profile' ? '#ffffff' : 'var(--primary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              <User size={15} />
              <span>Profile & Insights</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. STICKY TOPBAR HEADER                                                   */}
      {/* ========================================================================= */}
      <header className="app-topbar">
        <div className="topbar-title-section">
          <span className="topbar-subtitle">{currentHeader.subtitle}</span>
          <h1 className="topbar-title">{currentHeader.title}</h1>
        </div>

        <div className="topbar-actions-section">
          {/* Live Status Pill: Financial Health Score (FHS) */}
          <div className="topbar-status-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background:
                    fin.healthScore >= 75
                      ? 'var(--emerald)'
                      : fin.healthScore >= 50
                        ? 'var(--amber)'
                        : 'var(--rose)',
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>FHS:</span>
              <strong
                style={{
                  color:
                    fin.healthScore >= 75
                      ? 'var(--emerald)'
                      : fin.healthScore >= 50
                        ? 'var(--amber)'
                        : 'var(--rose)',
                  fontWeight: 800,
                }}
                className="tabular-nums"
              >
                {fin.healthScore}
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE CONTENT AREA                                            */}
      {/* ========================================================================= */}
      <main className="app-main-workspace">
        <div className="workspace-container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <BerandaTab
                  onNavigateTab={handleNavigateTab}
                  onOpenAddTx={() => handleOpenAddTx('expense')}
                />
              }
            />
            <Route path="/beranda" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/transactions"
              element={<TransaksiTab onOpenAddTx={handleOpenAddTx} />}
            />
            <Route path="/transaksi" element={<Navigate to="/transactions" replace />} />
            <Route path="/planning" element={<FinancialPlanningTab />} />
            <Route
              path="/planning/revenue-streams"
              element={<FinancialPlanningTab initialSubTab="revenue" />}
            />
            <Route
              path="/planning/fixed-costs"
              element={<FinancialPlanningTab initialSubTab="fixed-costs" />}
            />
            <Route
              path="/planning/financial-targets"
              element={<FinancialPlanningTab initialSubTab="targets" />}
            />
            <Route
              path="/planning/debts"
              element={<FinancialPlanningTab initialSubTab="debt" />}
            />
            <Route path="/planning/debt" element={<Navigate to="/planning/debts" replace />} />
            <Route path="/debts" element={<Navigate to="/planning/debts" replace />} />
            <Route path="/debt" element={<Navigate to="/planning/debts" replace />} />
            <Route path="/revenue-streams" element={<Navigate to="/planning/revenue-streams" replace />} />
            <Route path="/fixed-costs" element={<Navigate to="/planning/fixed-costs" replace />} />
            <Route path="/financial-targets" element={<Navigate to="/planning/financial-targets" replace />} />
            <Route path="/smart-buddy" element={<Navigate to="/dashboard" replace />} />
            <Route path="/decision-lab" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/assets"
              element={<AssetTab onOpenAddAsset={() => setIsAddAssetOpen(true)} />}
            />
            <Route path="/net-worth" element={<Navigate to="/assets" replace />} />
            <Route
              path="/profile"
              element={
                <ProfileTab
                  onRestartOnboarding={handleRestartOnboarding}
                  onSecretTrigger={() => setIsSecretInspectorOpen(true)}
                  onSignOut={handleSignOut}
                />
              }
            />
            {/* Redirect auth & onboarding routes if already authenticated & onboarded */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
            <Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
            <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. MOBILE BOTTOM NAVIGATION (Only triggers at < 768px)                    */}
      {/* ========================================================================= */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => navigate('/dashboard')}
          className={`mobile-nav-btn ${activeTab === 'Beranda' ? 'active' : ''}`}
        >
          <Home size={19} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => navigate('/transactions')}
          className={`mobile-nav-btn ${activeTab === 'Transaksi' ? 'active' : ''}`}
        >
          <ArrowUpDown size={19} />
          <span>Cash Flow</span>
        </button>

        <button
          onClick={() => navigate('/planning')}
          className={`mobile-nav-btn ${activeTab === 'Planning' ? 'active' : ''}`}
        >
          <Compass size={19} />
          <span>Planning</span>
        </button>

        <button
          onClick={() => navigate('/assets')}
          className={`mobile-nav-btn ${activeTab === 'Asset' ? 'active' : ''}`}
        >
          <Layers size={19} />
          <span>Assets</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`mobile-nav-btn ${activeTab === 'Profile' ? 'active' : ''}`}
        >
          <User size={19} />
          <span>Profile</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE MODALS                                                     */}
      {/* ========================================================================= */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        initialType={addTxInitialType}
      />

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <SecretDBInspector
        isOpen={isSecretInspectorOpen}
        onClose={() => setIsSecretInspectorOpen(false)}
      />
    </div>
  );
}

export default App;
