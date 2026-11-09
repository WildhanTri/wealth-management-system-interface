import {
  UserProfile,
  AssetItem,
  TransactionItem,
  PlannedExpense,
  QuarantineItem,
  AssetSnapshot,
  RevenueStreamItem,
  FixedCostItem,
  FixedCostPaymentItem,
  FixedCostHistoryItem,
  FinancialTargetItem,
  DebtItem,
} from '../types';
import { encryptPasswordPayload } from '../utils/crypto';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: any;
}

export interface ApiLogItem {
  id: string;
  name: string;
  description?: string;
  method: string;
  endpoint: string;
  statusCode: number;
  durationMs: number;
  requestHeaders?: Record<string, any>;
  requestQuery?: Record<string, any>;
  requestBody?: any;
  responseHeaders?: Record<string, any>;
  responseBody?: any;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  createdAt: string;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('crescent_auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json();
    return json;
  } catch (error: any) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
    return {
      success: false,
      statusCode: 503,
      message: error.message || 'Network connection failed',
      errors: error,
    };
  }
}

// =========================================================================
// API SERVICES
// =========================================================================

export const apiService = {
  // Health
  checkHealth: () => request('/health'),

  // Profile & Onboarding
  getProfile: () => request<{ profile: UserProfile | null; isOnboarded: boolean }>('/profile'),
  updateProfile: (profile: Partial<UserProfile>) =>
    request<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  completeOnboarding: (payload: { profile: UserProfile; initialAssets: AssetItem[] }) =>
    request('/profile/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPortfolio: () =>
    request('/profile/reset', {
      method: 'POST',
    }),

  // Assets
  getAssets: (params?: { assetClass?: string; liquidityTier?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<AssetItem[]>(`/assets${q ? `?${q}` : ''}`);
  },
  createAsset: (asset: Omit<AssetItem, 'id'>) =>
    request<AssetItem>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    }),
  updateAsset: (id: string, asset: Partial<AssetItem>) =>
    request<AssetItem>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    }),
  deleteAsset: (id: string) =>
    request(`/assets/${id}`, {
      method: 'DELETE',
    }),
  reorderAssets: (assetIds: string[]) =>
    request('/assets/reorder', {
      method: 'PUT',
      body: JSON.stringify({ assetIds }),
    }),

  // Transactions
  getTransactions: async (params?: { category?: string; isImpulse?: boolean; startDate?: string; endDate?: string; type?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await request<any[]>(`/transactions${q ? `?${q}` : ''}`);
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map((t: any) => ({
        id: t.id,
        title: t.name || t.title,
        type: (t.type as any) || 'expense',
        amount: Number(t.amount) || 0,
        category: t.category,
        date: t.date,
        emotionalTrigger: t.emotional_trigger || t.emotionalTrigger || 'Need',
        isImpulse: Boolean(t.is_impulse ?? t.isImpulse),
        displayOrder: Number(t.display_order ?? t.displayOrder) || 0,
      }));
    }
    return res as ApiResponse<TransactionItem[]>;
  },
  createTransaction: (tx: {
    name: string;
    type?: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    emotionalTrigger?: string;
    isImpulse?: boolean;
    description?: string;
  }) =>
    request<TransactionItem>('/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    }),
  updateTransaction: (
    id: string,
    tx: Partial<TransactionItem> & {
      name?: string;
      description?: string;
    }
  ) =>
    request<TransactionItem>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tx),
    }),
  deleteTransaction: (id: string) =>
    request(`/transactions/${id}`, {
      method: 'DELETE',
    }),
  reorderTransactions: (transactionIds: string[]) =>
    request('/transactions/reorder', {
      method: 'POST',
      body: JSON.stringify({ transactionIds }),
    }),

  // Planned Expenses
  getPlans: (params?: { status?: string; priority?: string; category?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PlannedExpense[]>(`/plans${q ? `?${q}` : ''}`);
  },
  createPlan: (plan: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    category: string;
    targetDate: string;
    priority?: string;
    status?: string;
    notes?: string;
  }) =>
    request<PlannedExpense>('/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),
  updatePlan: (id: string, plan: Partial<PlannedExpense> & { name?: string }) =>
    request<PlannedExpense>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    }),
  allocatePlanFunds: (id: string, additionalAmount: number) =>
    request<PlannedExpense>(`/plans/${id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ additionalAmount }),
    }),
  deletePlan: (id: string) =>
    request(`/plans/${id}`, {
      method: 'DELETE',
    }),

  // Quarantine Items (SmartBuddy)
  getQuarantineItems: (params?: { status?: string; urgency?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<QuarantineItem[]>(`/quarantine${q ? `?${q}` : ''}`);
  },
  createQuarantineItem: (item: {
    name: string;
    price: number;
    category: string;
    urgency?: string;
    description?: string;
  }) =>
    request<QuarantineItem>('/quarantine', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  resolveQuarantineItem: (id: string, resolution: 'purchased' | 'prevented') =>
    request(`/quarantine/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    }),
  deleteQuarantineItem: (id: string) =>
    request(`/quarantine/${id}`, {
      method: 'DELETE',
    }),

  // Asset Snapshots
  getSnapshots: () => request<AssetSnapshot[]>('/snapshots'),
  createSnapshot: (snapshot: {
    name?: string;
    snapshotDate: string;
    totalNetWorth?: number;
    totalCash?: number;
    totalHard?: number;
    totalInvestment?: number;
    notes?: string;
    itemsSnapshot?: any[];
    syncWithLiveAssets?: boolean;
  }) =>
    request<AssetSnapshot>('/snapshots', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    }),
  updateSnapshot: (id: string, snapshot: Partial<AssetSnapshot> & { itemsSnapshot?: any[] }) =>
    request<AssetSnapshot>(`/snapshots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(snapshot),
    }),
  deleteSnapshot: (id: string) =>
    request(`/snapshots/${id}`, {
      method: 'DELETE',
    }),

  // Financial Analytics & Health Overview
  getAnalyticsOverview: () => request('/analytics/overview'),

  // API Logs (Backend audit log inspector)
  getApiLogs: (params?: { limit?: number; offset?: number; method?: string; statusCode?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<ApiLogItem[]>(`/api-logs${q ? `?${q}` : ''}`);
  },
  getApiLogById: (id: string) => request<ApiLogItem>(`/api-logs/${id}`),

  // Authentication & Security APIs
  login: (credentials: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: encryptPasswordPayload(credentials.password),
      }),
    }),

  register: (payload: { fullname: string; email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullname: payload.fullname,
        email: payload.email,
        password: encryptPasswordPayload(payload.password),
      }),
    }),

  forgotPassword: (payload: { email: string }) =>
    request<{ resetToken?: string; expiresAt?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
      }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: payload.token,
        newPassword: encryptPasswordPayload(payload.newPassword),
      }),
    }),

  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: encryptPasswordPayload(payload.oldPassword),
        newPassword: encryptPasswordPayload(payload.newPassword),
      }),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // =========================================================================
  // FINANCIAL PLANNING APIS (Revenue Streams, Fixed Costs, Financial Targets)
  // =========================================================================

  // Revenue Streams
  getRevenueStreams: async (params?: { category?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await request<RevenueStreamItem[]>(`/revenue-streams${q ? `?${q}` : ''}`);
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map((r: any) => ({
        ...r,
        amount: Number(r.amount) || 0,
        displayOrder: Number(r.displayOrder ?? r.display_order) || 0,
      }));
    }
    return res;
  },
  createRevenueStream: async (stream: Omit<RevenueStreamItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await request<RevenueStreamItem>('/revenue-streams', {
      method: 'POST',
      body: JSON.stringify(stream),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        amount: Number(res.data.amount) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  updateRevenueStream: async (id: string, stream: Partial<RevenueStreamItem>) => {
    const res = await request<RevenueStreamItem>(`/revenue-streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stream),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        amount: Number(res.data.amount) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  deleteRevenueStream: (id: string) =>
    request(`/revenue-streams/${id}`, {
      method: 'DELETE',
    }),
  toggleRevenueStreamStatus: async (id: string) => {
    const res = await request<RevenueStreamItem>(`/revenue-streams/${id}/toggle-status`, {
      method: 'PATCH',
    });
    if (res.data) {
      res.data = {
        ...res.data,
        amount: Number(res.data.amount) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  reorderRevenueStreams: (streamIds: string[]) =>
    request('/revenue-streams/reorder', {
      method: 'POST',
      body: JSON.stringify({ streamIds }),
    }),

  // Fixed Costs
  getFixedCosts: async (params?: { month?: string; category?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await request<FixedCostItem[]>(`/fixed-costs${q ? `?${q}` : ''}`);
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map((f: any) => ({
        ...f,
        startMonth: f.startMonth ?? f.start_month ?? null,
        endMonth: f.endMonth ?? f.end_month ?? null,
        amount: Number(f.amount) || 0,
        dueDay: Number(f.dueDay ?? f.due_day) || 1,
        paidAmount: Number(f.paidAmount ?? f.paid_amount) || 0,
        displayOrder: Number(f.displayOrder ?? f.display_order) || 0,
      }));
    }
    return res;
  },
  createFixedCost: async (cost: Omit<FixedCostItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await request<FixedCostItem>('/fixed-costs', {
      method: 'POST',
      body: JSON.stringify(cost),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        amount: Number(res.data.amount) || 0,
        dueDay: Number(res.data.dueDay ?? (res.data as any).due_day) || 1,
        paidAmount: Number(res.data.paidAmount ?? (res.data as any).paid_amount) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  updateFixedCost: async (id: string, cost: Partial<FixedCostItem>) => {
    const res = await request<FixedCostItem>(`/fixed-costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cost),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        amount: Number(res.data.amount) || 0,
        dueDay: Number(res.data.dueDay ?? (res.data as any).due_day) || 1,
        paidAmount: Number(res.data.paidAmount ?? (res.data as any).paid_amount) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  deleteFixedCost: (id: string) =>
    request(`/fixed-costs/${id}`, {
      method: 'DELETE',
    }),
  toggleFixedCostPaid: async (id: string, payload: { monthYear: string; isPaid?: boolean; paidAmount?: number; notes?: string }) => {
    const res = await request<FixedCostPaymentItem>(`/fixed-costs/${id}/toggle-paid`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        paidAmount: Number(res.data.paidAmount) || 0,
      };
    }
    return res;
  },
  getFixedCostHistory: (months?: number | string) =>
    request<FixedCostHistoryItem[]>(`/fixed-costs/history${months !== undefined ? `?months=${months}` : ''}`),
  reorderFixedCosts: (costIds: string[]) =>
    request('/fixed-costs/reorder', {
      method: 'POST',
      body: JSON.stringify({ costIds }),
    }),

  // Financial Targets
  getFinancialTargets: async (params?: {
    category?: string;
    priority?: string;
    status?: string;
    targetType?: string;
    timeframe?: string;
  }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await request<FinancialTargetItem[]>(`/financial-targets${q ? `?${q}` : ''}`);
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map((t: any) => ({
        ...t,
        targetType: t.targetType || t.target_type || 'needs',
        timeframe: t.timeframe || 'short_term',
        targetAmount: Number(t.targetAmount || t.target_amount) || 0,
        currentAmount: Number(t.currentAmount || t.current_amount) || 0,
        remainingAmount: Number(t.remainingAmount) || 0,
        remainingMonths: Number(t.remainingMonths) || 1,
        monthlyRequired: Number(t.monthlyRequired) || 0,
        progressPercent: Number(t.progressPercent) || 0,
        displayOrder: Number(t.displayOrder ?? t.display_order) || 0,
      }));
    }
    return res;
  },
  createFinancialTarget: async (target: Omit<FinancialTargetItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await request<FinancialTargetItem>('/financial-targets', {
      method: 'POST',
      body: JSON.stringify(target),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        targetType: res.data.targetType || (res.data as any).target_type || 'needs',
        timeframe: res.data.timeframe || (res.data as any).timeframe || 'short_term',
        targetAmount: Number(res.data.targetAmount || (res.data as any).target_amount) || 0,
        currentAmount: Number(res.data.currentAmount || (res.data as any).current_amount) || 0,
        remainingAmount: Number(res.data.remainingAmount) || 0,
        remainingMonths: Number(res.data.remainingMonths) || 1,
        monthlyRequired: Number(res.data.monthlyRequired) || 0,
        progressPercent: Number(res.data.progressPercent) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  updateFinancialTarget: async (id: string, target: Partial<FinancialTargetItem>) => {
    const res = await request<FinancialTargetItem>(`/financial-targets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(target),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        targetType: res.data.targetType || (res.data as any).target_type || 'needs',
        timeframe: res.data.timeframe || (res.data as any).timeframe || 'short_term',
        targetAmount: Number(res.data.targetAmount || (res.data as any).target_amount) || 0,
        currentAmount: Number(res.data.currentAmount || (res.data as any).current_amount) || 0,
        remainingAmount: Number(res.data.remainingAmount) || 0,
        remainingMonths: Number(res.data.remainingMonths) || 1,
        monthlyRequired: Number(res.data.monthlyRequired) || 0,
        progressPercent: Number(res.data.progressPercent) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  deleteFinancialTarget: (id: string) =>
    request(`/financial-targets/${id}`, {
      method: 'DELETE',
    }),
  allocateTargetFunds: async (id: string, additionalAmount: number) => {
    const res = await request<FinancialTargetItem>(`/financial-targets/${id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ additionalAmount }),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        targetAmount: Number(res.data.targetAmount || (res.data as any).target_amount) || 0,
        currentAmount: Number(res.data.currentAmount || (res.data as any).current_amount) || 0,
        remainingAmount: Number(res.data.remainingAmount) || 0,
        remainingMonths: Number(res.data.remainingMonths) || 1,
        monthlyRequired: Number(res.data.monthlyRequired) || 0,
        progressPercent: Number(res.data.progressPercent) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  reorderFinancialTargets: (targetIds: string[]) =>
    request('/financial-targets/reorder', {
      method: 'POST',
      body: JSON.stringify({ targetIds }),
    }),

  // Debts & Liabilities
  getDebts: async (params?: { category?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await request<DebtItem[]>(`/debts${q ? `?${q}` : ''}`);
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map((d: any) => ({
        ...d,
        totalAmount: Number(d.totalAmount ?? d.total_amount) || 0,
        remainingAmount: Number(d.remainingAmount ?? d.remaining_amount) || 0,
        paidAmount: Number(d.paidAmount ?? d.paid_amount) || 0,
        monthlyPayment: d.monthlyPayment !== undefined && d.monthlyPayment !== null ? Number(d.monthlyPayment) : null,
        interestRate: d.interestRate !== undefined && d.interestRate !== null ? Number(d.interestRate) : null,
        payoffPercent: Number(d.payoffPercent) || 0,
        remainingMonths: Number(d.remainingMonths) || 0,
        displayOrder: Number(d.displayOrder ?? d.display_order) || 0,
      }));
    }
    return res;
  },
  createDebt: async (debt: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await request<DebtItem>('/debts', {
      method: 'POST',
      body: JSON.stringify(debt),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        totalAmount: Number(res.data.totalAmount ?? (res.data as any).total_amount) || 0,
        remainingAmount: Number(res.data.remainingAmount ?? (res.data as any).remaining_amount) || 0,
        paidAmount: Number(res.data.paidAmount ?? (res.data as any).paid_amount) || 0,
        monthlyPayment: res.data.monthlyPayment !== undefined && res.data.monthlyPayment !== null ? Number(res.data.monthlyPayment) : null,
        interestRate: res.data.interestRate !== undefined && res.data.interestRate !== null ? Number(res.data.interestRate) : null,
        payoffPercent: Number(res.data.payoffPercent) || 0,
        remainingMonths: Number(res.data.remainingMonths) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  updateDebt: async (id: string, debt: Partial<DebtItem>) => {
    const res = await request<DebtItem>(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(debt),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        totalAmount: Number(res.data.totalAmount ?? (res.data as any).total_amount) || 0,
        remainingAmount: Number(res.data.remainingAmount ?? (res.data as any).remaining_amount) || 0,
        paidAmount: Number(res.data.paidAmount ?? (res.data as any).paid_amount) || 0,
        monthlyPayment: res.data.monthlyPayment !== undefined && res.data.monthlyPayment !== null ? Number(res.data.monthlyPayment) : null,
        interestRate: res.data.interestRate !== undefined && res.data.interestRate !== null ? Number(res.data.interestRate) : null,
        payoffPercent: Number(res.data.payoffPercent) || 0,
        remainingMonths: Number(res.data.remainingMonths) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  deleteDebt: (id: string) =>
    request(`/debts/${id}`, {
      method: 'DELETE',
    }),
  recordDebtPayment: async (id: string, paymentAmount: number, notes?: string) => {
    const res = await request<DebtItem>(`/debts/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentAmount, notes }),
    });
    if (res.data) {
      res.data = {
        ...res.data,
        totalAmount: Number(res.data.totalAmount ?? (res.data as any).total_amount) || 0,
        remainingAmount: Number(res.data.remainingAmount ?? (res.data as any).remaining_amount) || 0,
        paidAmount: Number(res.data.paidAmount ?? (res.data as any).paid_amount) || 0,
        monthlyPayment: res.data.monthlyPayment !== undefined && res.data.monthlyPayment !== null ? Number(res.data.monthlyPayment) : null,
        interestRate: res.data.interestRate !== undefined && res.data.interestRate !== null ? Number(res.data.interestRate) : null,
        payoffPercent: Number(res.data.payoffPercent) || 0,
        remainingMonths: Number(res.data.remainingMonths) || 0,
        displayOrder: Number(res.data.displayOrder ?? (res.data as any).display_order) || 0,
      };
    }
    return res;
  },
  reorderDebts: (debtIds: string[]) =>
    request('/debts/reorder', {
      method: 'POST',
      body: JSON.stringify({ debtIds }),
    }),
};

