import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  RevenueStreamItem,
  FixedCostItem,
  FixedCostHistoryItem,
  FinancialTargetItem,
  DebtItem,
} from '../../types';

function getCurrentMonthYear(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export interface PlanningState {
  revenueStreams: RevenueStreamItem[];
  fixedCosts: FixedCostItem[];
  fixedCostHistory: FixedCostHistoryItem[];
  financialTargets: FinancialTargetItem[];
  debts: DebtItem[];
  selectedMonth: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: PlanningState = {
  revenueStreams: [],
  fixedCosts: [],
  fixedCostHistory: [],
  financialTargets: [],
  debts: [],
  selectedMonth: getCurrentMonthYear(),
  isLoading: false,
  error: null,
};

export const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    // Revenue Streams
    setRevenueStreams: (state, action: PayloadAction<RevenueStreamItem[]>) => {
      state.revenueStreams = action.payload;
    },
    addRevenueStream: (state, action: PayloadAction<RevenueStreamItem>) => {
      state.revenueStreams.unshift(action.payload);
    },
    updateRevenueStreamInState: (state, action: PayloadAction<RevenueStreamItem>) => {
      const idx = state.revenueStreams.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) {
        state.revenueStreams[idx] = action.payload;
      }
    },
    removeRevenueStream: (state, action: PayloadAction<string>) => {
      state.revenueStreams = state.revenueStreams.filter((s) => s.id !== action.payload);
    },
    reorderRevenueStreams: (state, action: PayloadAction<RevenueStreamItem[]>) => {
      state.revenueStreams = action.payload;
    },
    toggleRevenueStreamStatusInState: (state, action: PayloadAction<string>) => {
      const stream = state.revenueStreams.find((s) => s.id === action.payload);
      if (stream) {
        stream.status = stream.status === 'active' ? 'inactive' : 'active';
      }
    },

    // Fixed Costs
    setFixedCosts: (state, action: PayloadAction<FixedCostItem[]>) => {
      state.fixedCosts = action.payload;
    },
    addFixedCost: (state, action: PayloadAction<FixedCostItem>) => {
      state.fixedCosts.push(action.payload);
    },
    updateFixedCostInState: (state, action: PayloadAction<FixedCostItem>) => {
      const idx = state.fixedCosts.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.fixedCosts[idx] = { ...state.fixedCosts[idx], ...action.payload };
      }
    },
    removeFixedCost: (state, action: PayloadAction<string>) => {
      state.fixedCosts = state.fixedCosts.filter((c) => c.id !== action.payload);
    },
    reorderFixedCosts: (state, action: PayloadAction<FixedCostItem[]>) => {
      state.fixedCosts = action.payload;
    },
    updateFixedCostPaymentInState: (
      state,
      action: PayloadAction<{ id: string; isPaid: boolean; paidAmount: number; paidAt: string | null }>
    ) => {
      const cost = state.fixedCosts.find((c) => c.id === action.payload.id);
      if (cost) {
        cost.isPaid = action.payload.isPaid;
        cost.paidAmount = action.payload.paidAmount;
        cost.paidAt = action.payload.paidAt;
      }
    },
    setFixedCostHistory: (state, action: PayloadAction<FixedCostHistoryItem[]>) => {
      state.fixedCostHistory = action.payload;
    },
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },

    // Financial Targets
    setFinancialTargets: (state, action: PayloadAction<FinancialTargetItem[]>) => {
      state.financialTargets = action.payload;
    },
    addFinancialTarget: (state, action: PayloadAction<FinancialTargetItem>) => {
      state.financialTargets.unshift(action.payload);
    },
    updateFinancialTargetInState: (state, action: PayloadAction<FinancialTargetItem>) => {
      const idx = state.financialTargets.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) {
        state.financialTargets[idx] = { ...state.financialTargets[idx], ...action.payload };
      }
    },
    removeFinancialTarget: (state, action: PayloadAction<string>) => {
      state.financialTargets = state.financialTargets.filter((t) => t.id !== action.payload);
    },
    reorderFinancialTargets: (state, action: PayloadAction<FinancialTargetItem[]>) => {
      state.financialTargets = action.payload;
    },
    allocateTargetFundsInState: (
      state,
      action: PayloadAction<{ id: string; additionalAmount: number }>
    ) => {
      const target = state.financialTargets.find((t) => t.id === action.payload.id);
      if (target) {
        target.currentAmount += action.payload.additionalAmount;
        if (target.currentAmount >= target.targetAmount) {
          target.status = 'completed';
        }
        target.remainingAmount = Math.max(0, target.targetAmount - target.currentAmount);
        target.progressPercent = Math.min(
          100,
          Math.round((target.currentAmount / target.targetAmount) * 100)
        );
      }
    },

    // Debts & Liabilities
    setDebts: (state, action: PayloadAction<DebtItem[]>) => {
      state.debts = action.payload;
    },
    addDebt: (state, action: PayloadAction<DebtItem>) => {
      state.debts.unshift(action.payload);
    },
    updateDebtInState: (state, action: PayloadAction<DebtItem>) => {
      const idx = state.debts.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) {
        state.debts[idx] = { ...state.debts[idx], ...action.payload };
      }
    },
    removeDebt: (state, action: PayloadAction<string>) => {
      state.debts = state.debts.filter((d) => d.id !== action.payload);
    },
    reorderDebts: (state, action: PayloadAction<DebtItem[]>) => {
      state.debts = action.payload;
    },
    recordDebtPaymentInState: (
      state,
      action: PayloadAction<{ id: string; paymentAmount: number }>
    ) => {
      const debt = state.debts.find((d) => d.id === action.payload.id);
      if (debt) {
        debt.remainingAmount = Math.max(0, debt.remainingAmount - action.payload.paymentAmount);
        debt.paidAmount = Math.max(0, debt.totalAmount - debt.remainingAmount);
        if (debt.remainingAmount <= 0) {
          debt.status = 'paid_off';
        }
        debt.payoffPercent = debt.totalAmount > 0
          ? Math.min(100, Math.round(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100))
          : 0;
      }
    },
  },
});

export const {
  setRevenueStreams,
  addRevenueStream,
  updateRevenueStreamInState,
  removeRevenueStream,
  reorderRevenueStreams,
  toggleRevenueStreamStatusInState,
  setFixedCosts,
  addFixedCost,
  updateFixedCostInState,
  removeFixedCost,
  reorderFixedCosts,
  updateFixedCostPaymentInState,
  setFixedCostHistory,
  setSelectedMonth,
  setFinancialTargets,
  addFinancialTarget,
  updateFinancialTargetInState,
  removeFinancialTarget,
  reorderFinancialTargets,
  allocateTargetFundsInState,
  setDebts,
  addDebt,
  updateDebtInState,
  removeDebt,
  reorderDebts,
  recordDebtPaymentInState,
} = planningSlice.actions;

export default planningSlice.reducer;

