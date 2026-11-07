import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../../types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isHydrated: boolean;
}

const initialState: UserState = {
  profile: null,
  isOnboarded: false,
  isHydrated: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isOnboarded = true;
    },
    resetOnboarding: (state) => {
      state.profile = null;
      state.isOnboarded = false;
    },
    setHydrated: (state, action: PayloadAction<{ profile: UserProfile | null; isOnboarded: boolean }>) => {
      state.profile = action.payload.profile;
      state.isOnboarded = action.payload.isOnboarded;
      state.isHydrated = true;
    },
  },
});

export const { setProfile, resetOnboarding, setHydrated } = userSlice.actions;
export default userSlice.reducer;
