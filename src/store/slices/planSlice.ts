import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlannedExpense } from '../../types';

interface PlanState {
  items: PlannedExpense[];
}

const initialState: PlanState = {
  items: [],
};

export const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    setPlans: (state, action: PayloadAction<PlannedExpense[]>) => {
      state.items = action.payload;
    },
    addPlan: (state, action: PayloadAction<PlannedExpense>) => {
      state.items.unshift(action.payload);
    },
    updatePlan: (state, action: PayloadAction<PlannedExpense>) => {
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    deletePlan: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    allocateFundsToPlan: (
      state,
      action: PayloadAction<{ id: string; additionalAmount: number }>
    ) => {
      const plan = state.items.find((item) => item.id === action.payload.id);
      if (plan) {
        plan.currentAmount = Math.max(0, plan.currentAmount + action.payload.additionalAmount);
        plan.updatedAt = Date.now();
      }
    },
    setPlanStatus: (
      state,
      action: PayloadAction<{ id: string; status: PlannedExpense['status'] }>
    ) => {
      const plan = state.items.find((item) => item.id === action.payload.id);
      if (plan) {
        plan.status = action.payload.status;
        plan.updatedAt = Date.now();
      }
    },
  },
});

export const {
  setPlans,
  addPlan,
  updatePlan,
  deletePlan,
  allocateFundsToPlan,
  setPlanStatus,
} = planSlice.actions;

export default planSlice.reducer;
