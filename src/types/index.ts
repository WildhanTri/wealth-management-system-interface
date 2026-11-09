export interface UserProfile {
  name: string;
  industry: string;
  jobRole: string;
  age: number;
  monthlyIncome: number;
  isMarried: boolean;
  hasDependents: boolean;
  dependentsCount: number;
  monthlyInstallments: number;
  joinedAt: number;
}

export type AssetClass =
  | 'cash_equivalent'
  | 'hard_asset_movable'
  | 'hard_asset_immovable'
  | 'investment';

export type LiquidityTier = 'instant_liquid' | 'marketable_semi_liquid' | 'illiquid';

export interface AssetItem {
  id: string;
  name: string;
  assetClass: AssetClass;
  type: string;
  estimatedValue: number;
  liquidityTier: LiquidityTier;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high';
  appreciationType?: 'appreciating' | 'depreciating';
  displayOrder?: number;
}

export type EmotionalTrigger =
  | 'Boredom'
  | 'StressReward'
  | 'FOMO'
  | 'FlashSale'
  | 'Need';

export type TransactionType = 'income' | 'expense';

export interface TransactionItem {
  id: string;
  title: string;
  type?: TransactionType;
  amount: number;
  category: string;
  date: string;
  emotionalTrigger: EmotionalTrigger;
  isImpulse: boolean;
  displayOrder?: number;
}

export interface QuarantineItem {
  id: string;
  name: string;
  price: number;
  category: string;
  createdAt: number;
  quarantineUntil: number;
  workHoursCost: number;
  dailyS2SImpact: number;
  urgency: 'wants' | 'productive' | 'emergency';
}

export interface AssetSnapshot {
  id: string;
  snapshotDate: string; // YYYY-MM-DD
  totalNetWorth: number;
  totalCash: number;
  totalHard: number;
  totalInvestment: number;
  notes?: string;
  items: AssetItem[];
  createdAt: number;
  updatedAt: number;
}

export type PlanPriority = 'high' | 'medium' | 'low';
export type PlanStatus = 'active' | 'completed' | 'cancelled';

export interface PlannedExpense {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: string; // YYYY-MM-DD
  priority: PlanPriority;
  status: PlanStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// =========================================================================
// FINANCIAL PLANNING TYPES (Revenue Streams, Fixed Costs, Financial Targets)
// =========================================================================

export type RevenueCategory = 'main_job' | 'side_hustle' | 'passive_income' | 'other';
export type RevenueFrequency = 'monthly' | 'weekly' | 'biweekly' | 'irregular';

export interface RevenueStreamItem {
  id: string;
  name: string;
  category: RevenueCategory;
  amount: number;
  frequency: RevenueFrequency;
  status: 'active' | 'inactive';
  notes?: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type FixedCostCategory =
  | 'utilities'
  | 'subscriptions'
  | 'housing'
  | 'insurance'
  | 'memberships'
  | 'debt_installments'
  | 'telecom'
  | 'other';

export interface FixedCostItem {
  id: string;
  name: string;
  category: FixedCostCategory;
  amount: number;
  dueDay: number; // 1-31
  notes?: string;
  currentMonth?: string; // YYYY-MM
  startMonth?: string | null; // YYYY-MM
  endMonth?: string | null; // YYYY-MM
  isPaid?: boolean;
  paidAmount?: number;
  paidAt?: string | null;
  paymentNotes?: string | null;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FixedCostPaymentItem {
  id: string;
  fixedCostId: string;
  monthYear: string;
  isPaid: boolean;
  paidAmount: number;
  paidAt?: string | null;
  notes?: string;
}

export interface FixedCostHistoryItem {
  monthYear: string;
  totalObligation: number;
  totalPaid: number;
  totalPending: number;
  paidCount: number;
  totalBills: number;
  settlementRate?: number;
}

export type TargetType = 'needs' | 'wants';
export type TargetTimeframe = 'short_term' | 'long_term';

export type TargetCategory =
  // Kebutuhan (Needs) - Jangka Pendek
  | 'vehicle_maintenance'
  | 'home_maintenance'
  | 'medical_health'
  | 'tax_bill'
  | 'other_needs_short'
  // Kebutuhan (Needs) - Jangka Panjang
  | 'property'
  | 'emergency_fund'
  | 'education'
  | 'retirement'
  | 'other_needs_long'
  // Keinginan (Wants) - Jangka Pendek
  | 'gadget'
  | 'shopping'
  | 'entertainment'
  | 'hobby'
  | 'other_wants_short'
  // Keinginan (Wants) - Jangka Panjang
  | 'travel'
  | 'vehicle'
  | 'wedding'
  | 'investment'
  | 'other_wants_long'
  // Legacy / fallback
  | 'other';

export type TargetPriority = 'high' | 'medium' | 'low';
export type TargetStatus = 'in_progress' | 'completed' | 'paused';

export interface FinancialTargetItem {
  id: string;
  name: string;
  targetType?: TargetType;
  timeframe?: TargetTimeframe;
  category: TargetCategory;
  targetAmount: number;
  currentAmount: number;
  deadlineDate: string; // YYYY-MM-DD
  priority: TargetPriority;
  status: TargetStatus;
  notes?: string;
  remainingAmount?: number;
  remainingMonths?: number;
  monthlyRequired?: number;
  progressPercent?: number;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DebtCategory =
  | 'credit_card'
  | 'personal_loan'
  | 'mortgage'
  | 'vehicle_loan'
  | 'peer_loan'
  | 'paylater'
  | 'other';

export type DebtStatus = 'active' | 'paid_off' | 'paused';

export interface DebtItem {
  id: string;
  name: string;
  category: DebtCategory;
  lender?: string | null;
  totalAmount: number;
  remainingAmount: number;
  paidAmount?: number;
  monthlyPayment?: number | null;
  interestRate?: number | null;
  deadlineDate: string; // YYYY-MM-DD
  status: DebtStatus;
  notes?: string | null;
  payoffPercent?: number;
  remainingMonths?: number;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}


