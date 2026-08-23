import { cookies } from 'next/headers';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '@/lib/debtMath';

const STATE_COOKIE = 'rinmukht_state';

export const JUDGE_EMAIL = 'demo@rinmukht.in';
export const JUDGE_PASSWORD = 'password123';
export const JUDGE_USER_ID = 'judge-session';

export type PaymentLog = {
  id: string;
  debtId: string;
  amountPaid: number;
  paidAt: string;
  notes: string | null;
};

export type StoredDebt = {
  id: string;
  userId: string;
  lenderName: string;
  lenderType: string;
  principalAmount: number;
  remainingBalance: number;
  interestDescription: string | null;
  interestType: string;
  interestRate: number;
  startDate: string;
  durationMonths: number;
  repaymentExpectation: string;
  socialWeight: string;
  effectiveAnnualCost: number;
  monthlyBleed: number;
  urgencyTier: string;
  financialUrgency: string;
  relationalUrgency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentLogs: PaymentLog[];
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  monthlySurplus: number;
  monthlyIncome: number | null;
  selectedStrategy: string;
  createdAt: string;
};

export type AppState = {
  user: StoredUser;
  debts: StoredDebt[];
};

type GlobalStore = { __rinmukhtState?: AppState };

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function enrichDebt(partial: Omit<StoredDebt, 'effectiveAnnualCost' | 'monthlyBleed' | 'urgencyTier' | 'financialUrgency' | 'relationalUrgency' | 'paymentLogs'> & { paymentLogs?: PaymentLog[] }): StoredDebt {
  const eac = calculateEffectiveAnnualCost(
    partial.remainingBalance,
    partial.interestType,
    partial.interestRate,
    partial.durationMonths
  );
  const bleed = calculateMonthlyBleed(
    partial.remainingBalance,
    partial.interestType,
    partial.interestRate,
    partial.durationMonths
  );
  const financialUrgency = calculateFinancialUrgency(eac, bleed);
  const relationalUrgency = calculateRelationalUrgency(
    partial.socialWeight,
    partial.repaymentExpectation,
    partial.startDate
  );
  return {
    ...partial,
    effectiveAnnualCost: eac,
    monthlyBleed: bleed,
    urgencyTier: financialUrgency,
    financialUrgency,
    relationalUrgency,
    paymentLogs: partial.paymentLogs || [],
  };
}

export function buildSampleDebts(): StoredDebt[] {
  const now = new Date().toISOString();
  const templates = [
    {
      id: 'sample-debt-1',
      lenderName: 'Chacha (Uncle)',
      lenderType: 'relative',
      principalAmount: 5000,
      remainingBalance: 5000,
      interestDescription: 'Chacha se 5000 liye, 0% interest (bina byaj)',
      interestType: 'none',
      interestRate: 0,
      startDate: daysAgo(90),
      durationMonths: 12,
      repaymentExpectation: 'No interest. Return when harvest or salary comes in. Family trust matters.',
      socialWeight: 'high',
    },
    {
      id: 'sample-debt-2',
      lenderName: 'Gupta Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 2500,
      remainingBalance: 2500,
      interestDescription: 'Kirana store 2500 udhar 1% per month flat rate for groceries',
      interestType: 'flat_monthly',
      interestRate: 1.0,
      startDate: daysAgo(45),
      durationMonths: 6,
      repaymentExpectation: 'Pay ₹25 interest per month; clear principal by harvest season',
      socialWeight: 'medium',
    },
    {
      id: 'sample-debt-3',
      lenderName: 'Sahukar Moneylender',
      lenderType: 'moneylender',
      principalAmount: 15000,
      remainingBalance: 15000,
      interestDescription: 'Moneylender 15000 loan, 5% per month flat',
      interestType: 'flat_monthly',
      interestRate: 5.0,
      startDate: daysAgo(60),
      durationMonths: 12,
      repaymentExpectation: '₹750 monthly interest bleed; principal due when able',
      socialWeight: 'low',
    },
    {
      id: 'sample-debt-4',
      lenderName: 'KreditBee BNPL App',
      lenderType: 'bnpl',
      principalAmount: 8000,
      remainingBalance: 8000,
      interestDescription: 'BNPL app 8000 balance, 2% monthly compound (~26.8% annual)',
      interestType: 'compound_monthly',
      interestRate: 2.0,
      startDate: daysAgo(30),
      durationMonths: 12,
      repaymentExpectation: 'Short-term BNPL; monthly auto-deduction from linked account',
      socialWeight: 'low',
    },
  ];

  return templates.map((d) =>
    enrichDebt({
      ...d,
      userId: JUDGE_USER_ID,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
  );
}

export function defaultState(): AppState {
  return {
    user: {
      id: JUDGE_USER_ID,
      name: 'Judge Preview',
      email: JUDGE_EMAIL,
      phone: null,
      monthlySurplus: 3500,
      monthlyIncome: 25000,
      selectedStrategy: 'avalanche',
      createdAt: new Date().toISOString(),
    },
    debts: buildSampleDebts(),
  };
}

function persistCookie(state: AppState) {
  const store = cookies();
  store.set(STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

function readCookie(): AppState | null {
  const raw = cookies().get(STATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function getAppState(): AppState {
  const g = globalThis as typeof globalThis & GlobalStore;
  if (g.__rinmukhtState) return g.__rinmukhtState;
  const fromCookie = readCookie();
  if (fromCookie?.user && Array.isArray(fromCookie.debts)) {
    g.__rinmukhtState = fromCookie;
    return fromCookie;
  }
  const initial = defaultState();
  g.__rinmukhtState = initial;
  return initial;
}

export function saveAppState(state: AppState) {
  const g = globalThis as typeof globalThis & GlobalStore;
  g.__rinmukhtState = state;
  persistCookie(state);
}

export function resetToSample(): AppState {
  const state = defaultState();
  saveAppState(state);
  return state;
}

export function isJudgeLogin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const allowed = [JUDGE_EMAIL, 'demo@karza.in', 'demo@rinmukht.app'];
  return allowed.includes(normalized) && password === JUDGE_PASSWORD;
}

export function enrichExistingDebt(debt: StoredDebt): StoredDebt {
  return enrichDebt(debt);
}
