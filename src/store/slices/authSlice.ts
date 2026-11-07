import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  fullname: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const savedToken = localStorage.getItem('crescent_auth_token');
let savedUser: AuthUser | null = null;
try {
  const parsed = localStorage.getItem('crescent_auth_user');
  if (parsed) savedUser = JSON.parse(parsed);
} catch {
  savedUser = null;
}

const initialState: AuthState = {
  token: savedToken,
  user: savedUser,
  isAuthenticated: Boolean(savedToken && savedUser),
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('crescent_auth_token', action.payload.token);
      localStorage.setItem('crescent_auth_user', JSON.stringify(action.payload.user));
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('crescent_auth_user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('crescent_auth_token');
      localStorage.removeItem('crescent_auth_user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;

