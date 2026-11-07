import { UserProfile, AssetItem, TransactionItem } from '../types';

export interface CalculatedFinancials {
  healthScore: number;
  healthGrade: string;
  healthStatus: 'healthy' | 'caution' | 'critical';
  safeToSpendDaily: number;
  safeToSpendWeekly: number;
  totalLiquidCash: number;
  totalHardAssets: number;
  totalInvestments: number;
  totalNetWorth: number;
  dtiPercentage: number;
  emergencyRunwayMonths: number;
  targetEmergencyMonths: number;
  hourlyWage: number;
}

export function calculateFinancials(
  profile: UserProfile | null,
  assets: AssetItem[],
  transactions: TransactionItem[]
): CalculatedFinancials {
  const income = profile?.monthlyIncome || 0;
  const installments = profile?.monthlyInstallments || 0;
  const hourlyWage = income > 0 ? Math.round(income / 160) : 0; // 160 jam kerja standar/bulan

  // 1. Group assets by class
  let totalLiquidCash = 0;
  let totalHardAssets = 0;
  let totalInvestments = 0;

  assets.forEach((ast) => {
    if (ast.assetClass === 'cash_equivalent') {
      totalLiquidCash += ast.estimatedValue;
    } else if (
      ast.assetClass === 'hard_asset_movable' ||
      ast.assetClass === 'hard_asset_immovable'
    ) {
      totalHardAssets += ast.estimatedValue;
    } else if (ast.assetClass === 'investment') {
      totalInvestments += ast.estimatedValue;
    }
  });

  // Net worth calculation
  const totalNetWorth = totalLiquidCash + totalHardAssets + totalInvestments - installments;

  // 2. Spending & Inflow calculation
  const totalCurrentSpent = transactions
    .filter((tx) => tx.type !== 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalCurrentIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // 3. Safe-to-Spend formula from PRD Section 4.2
  // Available Discretionary Pool = Penghasilan Bersih + Inflow Tambahan - Cicilan - Target Tabungan (20%) - Pengeluaran Berjalan
  const targetSavings = Math.round(income * 0.2);
  const remainingDiscretionary = Math.max(
    0,
    income + totalCurrentIncome - installments - targetSavings - totalCurrentSpent
  );
  const remainingDays = 20; // default siklus hari berjalan
  const safeToSpendDaily = Math.round(remainingDiscretionary / remainingDays);
  const safeToSpendWeekly = safeToSpendDaily * 7;

  // 4. Target emergency months calibration from PRD Section 4.1
  let targetEmergencyMonths = 3;
  if (profile?.isMarried) {
    targetEmergencyMonths = profile.hasDependents ? 9 : 6;
  } else if (profile?.hasDependents) {
    targetEmergencyMonths = 6;
  }

  // Monthly required expenses estimate (Cicilan + Biaya Hidup Dasar ~40% income)
  const monthlyEssentialLiving = Math.round(income * 0.4) + installments;
  const emergencyRunwayMonths = Number(
    (totalLiquidCash / Math.max(1000000, monthlyEssentialLiving)).toFixed(1)
  );

  // 5. Debt Service Ratio / DTI (%)
  const dtiPercentage = Math.round((installments / Math.max(1, income)) * 100);

  // 6. Financial Health Score (FHS: 0 - 100)
  // Pillar 1: Liquidity Buffer (30 pts)
  const liquidityRatio = Math.min(1, emergencyRunwayMonths / targetEmergencyMonths);
  const liquidityScore = liquidityRatio * 30;

  // Pillar 2: Debt-to-Income (25 pts)
  let dtiScore = 25;
  if (dtiPercentage > 40) {
    dtiScore = 5;
  } else if (dtiPercentage > 30) {
    dtiScore = 15;
  }

  // Pillar 3: Savings / Asset Ratio (25 pts)
  const assetRatio = Math.min(1, (totalInvestments + totalLiquidCash) / (income * 3));
  const savingsScore = assetRatio * 25;

  // Pillar 4: Discretionary Spending Velocity (20 pts)
  const impulseSpent = transactions
    .filter((tx) => tx.type !== 'income' && tx.isImpulse)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const impulseRatio = impulseSpent / Math.max(1, remainingDiscretionary + totalCurrentSpent);
  const spendingScore = Math.max(0, 20 - impulseRatio * 20);

  const healthScore = Math.min(100, Math.round(liquidityScore + dtiScore + savingsScore + spendingScore));

  let healthGrade = 'Prime Health';
  let healthStatus: 'healthy' | 'caution' | 'critical' = 'healthy';

  if (healthScore < 50) {
    healthGrade = 'Critical (Halt Discretionary Spending)';
    healthStatus = 'critical';
  } else if (healthScore < 75) {
    healthGrade = 'Caution (Tight Safe Buffer)';
    healthStatus = 'caution';
  }

  return {
    healthScore,
    healthGrade,
    healthStatus,
    safeToSpendDaily,
    safeToSpendWeekly,
    totalLiquidCash,
    totalHardAssets,
    totalInvestments,
    totalNetWorth,
    dtiPercentage,
    emergencyRunwayMonths,
    targetEmergencyMonths,
    hourlyWage,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
