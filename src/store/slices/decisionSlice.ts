import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuarantineItem } from '../../types';

interface DecisionState {
  quarantineItems: QuarantineItem[];
  savedMoneyTotal: number;
  preventedCount: number;
}

const initialState: DecisionState = {
  quarantineItems: [],
  savedMoneyTotal: 0,
  preventedCount: 0,
};

export const decisionSlice = createSlice({
  name: 'decision',
  initialState,
  reducers: {
    setQuarantineState: (
      state,
      action: PayloadAction<{
        quarantineItems: QuarantineItem[];
        savedMoneyTotal: number;
        preventedCount: number;
      }>
    ) => {
      state.quarantineItems = action.payload.quarantineItems;
      state.savedMoneyTotal = action.payload.savedMoneyTotal;
      state.preventedCount = action.payload.preventedCount;
    },
    addToQuarantine: (state, action: PayloadAction<QuarantineItem>) => {
      state.quarantineItems.unshift(action.payload);
    },
    cancelImpulseItem: (
      state,
      action: PayloadAction<{ id: string; savedAmount: number }>
    ) => {
      state.quarantineItems = state.quarantineItems.filter(
        (item) => item.id !== action.payload.id
      );
      state.savedMoneyTotal += action.payload.savedAmount;
      state.preventedCount += 1;
    },
    confirmPurchaseItem: (state, action: PayloadAction<string>) => {
      state.quarantineItems = state.quarantineItems.filter(
        (item) => item.id !== action.payload
      );
    },
  },
});

export const {
  setQuarantineState,
  addToQuarantine,
  cancelImpulseItem,
  confirmPurchaseItem,
} = decisionSlice.actions;
export default decisionSlice.reducer;
