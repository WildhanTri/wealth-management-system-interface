import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssetItem } from '../../types';

interface AssetState {
  items: AssetItem[];
}

const initialState: AssetState = {
  items: [],
};

export const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    setAssets: (state, action: PayloadAction<AssetItem[]>) => {
      state.items = action.payload;
    },
    addAsset: (state, action: PayloadAction<AssetItem>) => {
      state.items.unshift(action.payload);
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateAsset: (state, action: PayloadAction<AssetItem>) => {
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    reorderAssets: (state, action: PayloadAction<AssetItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const { setAssets, addAsset, removeAsset, updateAsset, reorderAssets } = assetSlice.actions;
export default assetSlice.reducer;
