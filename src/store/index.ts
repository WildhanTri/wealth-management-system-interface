import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import assetReducer from './slices/assetSlice';
import transactionReducer from './slices/transactionSlice';
import decisionReducer from './slices/decisionSlice';
import snapshotReducer from './slices/snapshotSlice';
import planReducer from './slices/planSlice';
import planningReducer from './slices/planningSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    asset: assetReducer,
    transaction: transactionReducer,
    decision: decisionReducer,
    snapshot: snapshotReducer,
    plan: planReducer,
    planning: planningReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
