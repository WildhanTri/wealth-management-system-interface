import {
  UserProfile,
  AssetItem,
  TransactionItem,
  QuarantineItem,
  AssetSnapshot,
  PlannedExpense,
  RevenueStreamItem,
  FixedCostItem,
  FinancialTargetItem,
  DebtItem,
} from '../types';
import { apiService } from './apiService';

export interface AppInitState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  transactions: TransactionItem[];
  assets: AssetItem[];
  quarantineItems: QuarantineItem[];
  snapshots: AssetSnapshot[];
  plannedExpenses: PlannedExpense[];
  revenueStreams: RevenueStreamItem[];
  fixedCosts: FixedCostItem[];
  financialTargets: FinancialTargetItem[];
  debts: DebtItem[];
  savedMoneyTotal: number;
  preventedCount: number;
  isBackendConnected: boolean;
}

/**
 * Bootstraps application state by fetching directly from the Crescent Wealth Express/PostgreSQL backend API.
 */
export async function initializeAppState(): Promise<AppInitState> {
  try {
    const health = await apiService.checkHealth();
    if (!health.success) {
      console.warn('⚠️ Crescent Wealth Backend API is currently unreachable.');
      return createEmptyState(false);
    }

    console.log('📡 Connected to Crescent Wealth Core Backend API (PostgreSQL)');

    // Fetch all entities concurrently from backend
    const [
      profileRes,
      assetsRes,
      txRes,
      plansRes,
      quarantineRes,
      snapshotsRes,
      revenueRes,
      fixedCostRes,
      targetRes,
      debtRes,
    ] = await Promise.all([
      apiService.getProfile(),
      apiService.getAssets(),
      apiService.getTransactions(),
      apiService.getPlans(),
      apiService.getQuarantineItems(),
      apiService.getSnapshots(),
      apiService.getRevenueStreams(),
      apiService.getFixedCosts(),
      apiService.getFinancialTargets(),
      apiService.getDebts(),
    ]);

    const profile = profileRes.data?.profile || null;
    const isOnboarded = profileRes.data?.isOnboarded ?? false;
    const assets: AssetItem[] = (assetsRes.data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      assetClass: a.assetClass || a.asset_class,
      type: a.type,
      estimatedValue: Number(a.estimatedValue || a.estimated_value) || 0,
      liquidityTier: a.liquidityTier || a.liquidity_tier,
      riskLevel: a.riskLevel || a.risk_level,
      appreciationType: a.appreciationType || a.appreciation_type || undefined,
      displayOrder: a.displayOrder ?? a.display_order ?? 0,
    }));

    const transactions: TransactionItem[] = (txRes.data || []).map((t: any) => ({
      id: t.id,
      title: t.name || t.title || 'Untitled Transaction',
      type: (t.type as any) || 'expense',
      amount: Number(t.amount) || 0,
      category: t.category,
      date: t.date,
      emotionalTrigger: t.emotionalTrigger || t.emotional_trigger || 'Need',
      isImpulse: Boolean(t.isImpulse ?? t.is_impulse),
    }));

    const plannedExpenses: PlannedExpense[] = (plansRes.data || []).map((p: any) => ({
      id: p.id,
      title: p.name || p.title || 'Untitled Plan',
      targetAmount: Number(p.targetAmount || p.target_amount) || 0,
      currentAmount: Number(p.currentAmount || p.current_amount) || 0,
      category: p.category,
      targetDate: p.targetDate || p.target_date,
      priority: p.priority || 'medium',
      status: p.status || 'active',
      notes: p.notes,
      createdAt: p.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now(),
    }));

    const revenueStreams: RevenueStreamItem[] = (revenueRes.data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category || 'main_job',
      amount: Number(r.amount) || 0,
      frequency: r.frequency || 'monthly',
      status: r.status || 'active',
      notes: r.notes,
      displayOrder: Number(r.displayOrder ?? r.display_order) || 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    const fixedCosts: FixedCostItem[] = (fixedCostRes.data || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      category: f.category || 'utilities',
      amount: Number(f.amount) || 0,
      dueDay: Number(f.dueDay ?? f.due_day) || 1,
      notes: f.notes,
      currentMonth: f.currentMonth,
      isPaid: Boolean(f.isPaid),
      paidAmount: Number(f.paidAmount) || 0,
      paidAt: f.paidAt,
      paymentNotes: f.paymentNotes,
      displayOrder: Number(f.displayOrder ?? f.display_order) || 0,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    const financialTargets: FinancialTargetItem[] = (targetRes.data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category || 'emergency_fund',
      targetAmount: Number(t.targetAmount || t.target_amount) || 0,
      currentAmount: Number(t.currentAmount || t.current_amount) || 0,
      deadlineDate: t.deadlineDate || t.deadline_date,
      priority: t.priority || 'medium',
      status: t.status || 'in_progress',
      notes: t.notes,
      remainingAmount: Number(t.remainingAmount) || 0,
      remainingMonths: Number(t.remainingMonths) || 1,
      monthlyRequired: Number(t.monthlyRequired) || 0,
      progressPercent: Number(t.progressPercent) || 0,
      displayOrder: Number(t.displayOrder ?? t.display_order) || 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    const debts: DebtItem[] = (debtRes.data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      category: d.category || 'other',
      lender: d.lender,
      totalAmount: Number(d.totalAmount ?? d.total_amount) || 0,
      remainingAmount: Number(d.remainingAmount ?? d.remaining_amount) || 0,
      paidAmount: Number(d.paidAmount ?? d.paid_amount) || 0,
      monthlyPayment: d.monthlyPayment !== undefined && d.monthlyPayment !== null ? Number(d.monthlyPayment) : null,
      interestRate: d.interestRate !== undefined && d.interestRate !== null ? Number(d.interestRate) : null,
      deadlineDate: d.deadlineDate || d.deadline_date,
      status: d.status || 'active',
      notes: d.notes,
      payoffPercent: Number(d.payoffPercent) || 0,
      remainingMonths: Number(d.remainingMonths) || 0,
      displayOrder: Number(d.displayOrder ?? d.display_order) || 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    const quarantineItems: QuarantineItem[] = (quarantineRes.data || []).map((q: any) => ({
      id: q.id,
      name: q.name,
      price: Number(q.price) || 0,
      category: q.category,
      createdAt: q.createdAt ? new Date(q.createdAt).getTime() : Date.now(),
      quarantineUntil: q.quarantineUntil
        ? typeof q.quarantineUntil === 'number'
          ? q.quarantineUntil
          : new Date(q.quarantineUntil).getTime()
        : Date.now() + 48 * 3600 * 1000,
      workHoursCost: Number(q.workHoursCost || q.work_hours_cost) || 0,
      dailyS2SImpact: Number(q.dailyS2SImpact || q.daily_s2s_impact) || 0,
      urgency: q.urgency || 'wants',
    }));

    const snapshots: AssetSnapshot[] = (snapshotsRes.data || []).map((s: any) => ({
      id: s.id,
      snapshotDate: s.snapshotDate || s.snapshot_date,
      totalNetWorth: Number(s.totalNetWorth || s.total_net_worth) || 0,
      totalCash: Number(s.totalCash || s.total_cash) || 0,
      totalHard: Number(s.totalHard || s.total_hard) || 0,
      totalInvestment: Number(s.totalInvestment || s.total_investment) || 0,
      notes: s.notes,
      items: s.itemsSnapshot || s.items || [],
      createdAt: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
      updatedAt: s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now(),
    }));

    const savedMoneyTotal = quarantineRes.meta?.savedMoneyTotal || 0;
    const preventedCount = quarantineRes.meta?.preventedCount || 0;

    return {
      profile,
      isOnboarded,
      transactions,
      assets,
      quarantineItems,
      snapshots,
      plannedExpenses,
      revenueStreams,
      fixedCosts,
      financialTargets,
      debts,
      savedMoneyTotal,
      preventedCount,
      isBackendConnected: true,
    };
  } catch (error) {
    console.error('Failed to initialize app state from Backend API:', error);
    return createEmptyState(false);
  }
}

/**
 * Handles completing first-time Onboarding directly with Backend API.
 */
export async function completeFirstOnboarding(
  profile: UserProfile,
  initialAssets:
    | {
        cashBalance: number;
        hardAssetVal: number;
        investmentVal: number;
      }
    | AssetItem[]
) {
  const assetsToInsert: AssetItem[] = [];

  if (Array.isArray(initialAssets)) {
    assetsToInsert.push(...initialAssets);
  } else {
    if (initialAssets.cashBalance > 0) {
      assetsToInsert.push({
        id: `ast-${Date.now()}-1`,
        name: 'Bank Account & Liquid Cash',
        assetClass: 'cash_equivalent',
        type: 'Primary Savings',
        estimatedValue: initialAssets.cashBalance,
        liquidityTier: 'instant_liquid',
        riskLevel: 'very_low',
      });
    }

    if (initialAssets.hardAssetVal > 0) {
      assetsToInsert.push({
        id: `ast-${Date.now()}-2`,
        name: 'Physical Hard Assets (Gold / Vehicle / Real Estate)',
        assetClass: 'hard_asset_movable',
        type: 'Physical Assets',
        estimatedValue: initialAssets.hardAssetVal,
        liquidityTier: 'marketable_semi_liquid',
        riskLevel: 'low',
      });
    }

    if (initialAssets.investmentVal > 0) {
      assetsToInsert.push({
        id: `ast-${Date.now()}-3`,
        name: 'Investment Portfolio (Mutual Funds / Equities)',
        assetClass: 'investment',
        type: 'Capital Market Investments',
        estimatedValue: initialAssets.investmentVal,
        liquidityTier: 'marketable_semi_liquid',
        riskLevel: 'medium',
      });
    }
  }

  // Send onboarding payload to PostgreSQL backend API
  const apiRes = await apiService.completeOnboarding({
    profile,
    initialAssets: assetsToInsert,
  });

  if (!apiRes.success) {
    console.warn('Backend onboarding response:', apiRes.message);
  }

  // Re-fetch clean synchronized state from backend
  const cleanState = await initializeAppState();
  return {
    profile: cleanState.profile || profile,
    assets: cleanState.assets.length > 0 ? cleanState.assets : assetsToInsert,
    transactions: cleanState.transactions,
    quarantineItems: cleanState.quarantineItems,
    snapshots: cleanState.snapshots,
    savedMoneyTotal: cleanState.savedMoneyTotal,
    preventedCount: cleanState.preventedCount,
  };
}

function createEmptyState(isConnected: boolean): AppInitState {
  return {
    profile: null,
    isOnboarded: false,
    transactions: [],
    assets: [],
    quarantineItems: [],
    snapshots: [],
    plannedExpenses: [],
    revenueStreams: [],
    fixedCosts: [],
    financialTargets: [],
    debts: [],
    savedMoneyTotal: 0,
    preventedCount: 0,
    isBackendConnected: isConnected,
  };
}
