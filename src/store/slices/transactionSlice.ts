import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransactionItem } from '../../types';

interface TransactionState {
  items: TransactionItem[];
}

const initialState: TransactionState = {
  items: [],
};

export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<TransactionItem[]>) => {
      state.items = action.payload;
    },
    addTransaction: (state, action: PayloadAction<TransactionItem>) => {
      state.items.unshift(action.payload);
    },
    deleteTransaction: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { setTransactions, addTransaction, deleteTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
