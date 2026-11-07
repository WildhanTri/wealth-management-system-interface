import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssetSnapshot } from '../../types';

interface SnapshotState {
  items: AssetSnapshot[];
}

const initialState: SnapshotState = {
  items: [],
};

export const snapshotSlice = createSlice({
  name: 'snapshot',
  initialState,
  reducers: {
    setSnapshots: (state, action: PayloadAction<AssetSnapshot[]>) => {
      // Keep sorted chronologically by snapshotDate, then createdAt
      state.items = [...action.payload].sort((a, b) => {
        const dateDiff = a.snapshotDate.localeCompare(b.snapshotDate);
        if (dateDiff !== 0) return dateDiff;
        return a.createdAt - b.createdAt;
      });
    },
    addSnapshot: (state, action: PayloadAction<AssetSnapshot>) => {
      state.items.push(action.payload);
      state.items.sort((a, b) => {
        const dateDiff = a.snapshotDate.localeCompare(b.snapshotDate);
        if (dateDiff !== 0) return dateDiff;
        return a.createdAt - b.createdAt;
      });
    },
    updateSnapshot: (state, action: PayloadAction<AssetSnapshot>) => {
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
        state.items.sort((a, b) => {
          const dateDiff = a.snapshotDate.localeCompare(b.snapshotDate);
          if (dateDiff !== 0) return dateDiff;
          return a.createdAt - b.createdAt;
        });
      }
    },
    removeSnapshot: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { setSnapshots, addSnapshot, updateSnapshot, removeSnapshot } = snapshotSlice.actions;
export default snapshotSlice.reducer;
