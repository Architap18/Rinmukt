// ─────────────────────────────────────────────────────────────────────────────
// Rinmukht LocalStorage Layer
// All user authentication and debt data is stored in the browser's localStorage.
// No database or server-side session is required.
// Data is namespaced per user so multiple accounts on the same browser are isolated.
// ─────────────────────────────────────────────────────────────────────────────

import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '@/lib/debtMath';

// ─── Types ───────────────────────────────────────────────────────────────────

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // simple client-side hash (not cryptographic, for demo only)
  monthlySurplus: number;
  monthlyIncome: number | null;
  selectedStrategy: string;
  createdAt: string;
};

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

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const USERS_KEY = 'rinmukht_users';
const SESSION_KEY = 'rinmukht_session';
const DEBTS_PREFIX = 'rinmukht_debts_';
const PROFILE_PREFIX = 'rinmukht_profile_';

// ─── Safe localStorage Wrappers ───────────────────────────────────────────────

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage might be full or unavailable
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Simple Password Hashing ──────────────────────────────────────────────────
// This is NOT cryptographically secure — it's for a demo/submission app only.
// For a production app, use bcrypt server-side.

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Add a fixed salt prefix so it's slightly harder to reverse
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length.toString(36);
}

// ─── User Registry ────────────────────────────────────────────────────────────

type UserRegistry = Record<string, StoredUser>; // email -> user

function getUserRegistry(): UserRegistry {
  return safeGet<UserRegistry>(USERS_KEY) || {};
}

function saveUserRegistry(registry: UserRegistry): void {
  safeSet(USERS_KEY, registry);
}

export function getUserByEmail(email: string): StoredUser | null {
  const registry = getUserRegistry();
  return registry[email.trim().toLowerCase()] || null;
}

export function registerUser(
  name: string,
  email: string,
  password: string
): { success: true; user: StoredUser } | { success: false; error: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const registry = getUserRegistry();

  if (registry[normalizedEmail]) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const user: StoredUser = {
    id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: simpleHash(password),
    monthlySurplus: 3000,
    monthlyIncome: null,
    selectedStrategy: 'avalanche',
    createdAt: new Date().toISOString(),
  };

  registry[normalizedEmail] = user;
  saveUserRegistry(registry);
  return { success: true, user };
}

export function authenticateUser(
  email: string,
  password: string
): { success: true; user: StoredUser } | { success: false; error: string } {
  const user = getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'No account found with this email address.' };
  }

  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  return { success: true, user };
}

// ─── Session Management ───────────────────────────────────────────────────────

type Session = { userId: string; email: string; name: string };

export function getSession(): Session | null {
  return safeGet<Session>(SESSION_KEY);
}

export function setSession(user: StoredUser): void {
  safeSet(SESSION_KEY, { userId: user.id, email: user.email, name: user.name });
}

export function clearSession(): void {
  safeRemove(SESSION_KEY);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function getProfile(userId: string): Partial<StoredUser> {
  return safeGet<Partial<StoredUser>>(PROFILE_PREFIX + userId) || {};
}

export function saveProfile(userId: string, updates: Partial<StoredUser>): StoredUser | null {
  const registry = getUserRegistry();
  const user = Object.values(registry).find((u) => u.id === userId);
  if (!user) return null;

  const merged = { ...user, ...updates };
  registry[merged.email] = merged;
  saveUserRegistry(registry);

  // Also persist to per-user profile key for quick lookup
  safeSet(PROFILE_PREFIX + userId, merged);
  return merged;
}

export function getUserById(userId: string): StoredUser | null {
  const registry = getUserRegistry();
  return Object.values(registry).find((u) => u.id === userId) || null;
}

// ─── Debt Enrichment ──────────────────────────────────────────────────────────

export function enrichDebt(
  partial: Omit<StoredDebt, 'effectiveAnnualCost' | 'monthlyBleed' | 'urgencyTier' | 'financialUrgency' | 'relationalUrgency'> & {
    effectiveAnnualCost?: number;
    monthlyBleed?: number;
    urgencyTier?: string;
    financialUrgency?: string;
    relationalUrgency?: string;
  }
): StoredDebt {
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

// ─── Debt CRUD ────────────────────────────────────────────────────────────────

function debtsKey(userId: string): string {
  return DEBTS_PREFIX + userId;
}

export function getDebts(userId: string): StoredDebt[] {
  return safeGet<StoredDebt[]>(debtsKey(userId)) || [];
}

export function saveDebts(userId: string, debts: StoredDebt[]): void {
  safeSet(debtsKey(userId), debts);
}

export function addDebt(userId: string, debtData: Omit<StoredDebt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paymentLogs'>): StoredDebt {
  const now = new Date().toISOString();
  const newDebt = enrichDebt({
    ...debtData,
    id: 'debt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    userId,
    createdAt: now,
    updatedAt: now,
    paymentLogs: [],
  });

  const debts = getDebts(userId);
  debts.unshift(newDebt);
  saveDebts(userId, debts);
  return newDebt;
}

export function deleteDebt(userId: string, debtId: string): boolean {
  const debts = getDebts(userId);
  const index = debts.findIndex((d) => d.id === debtId);
  if (index === -1) return false;
  debts.splice(index, 1);
  saveDebts(userId, debts);
  return true;
}

export function updateDebt(userId: string, debtId: string, updates: Partial<StoredDebt>): StoredDebt | null {
  const debts = getDebts(userId);
  const index = debts.findIndex((d) => d.id === debtId);
  if (index === -1) return null;

  const existing = debts[index];
  const merged = enrichDebt({
    ...existing,
    ...updates,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  debts[index] = merged;
  saveDebts(userId, debts);
  return merged;
}

export function addPayment(
  userId: string,
  debtId: string,
  amountPaid: number,
  notes: string | null
): { debt: StoredDebt; paymentLog: PaymentLog } | null {
  const debts = getDebts(userId);
  const index = debts.findIndex((d) => d.id === debtId);
  if (index === -1) return null;

  const debt = debts[index];
  const newBalance = Math.max(0, debt.remainingBalance - amountPaid);

  const paymentLog: PaymentLog = {
    id: 'pay-' + Date.now(),
    debtId,
    amountPaid,
    paidAt: new Date().toISOString(),
    notes,
  };

  const updated = enrichDebt({
    ...debt,
    remainingBalance: newBalance,
    status: newBalance === 0 ? 'paid_off' : 'active',
    updatedAt: new Date().toISOString(),
    paymentLogs: [paymentLog, ...debt.paymentLogs],
  });

  debts[index] = updated;
  saveDebts(userId, debts);
  return { debt: updated, paymentLog };
}

export function clearAllDebts(userId: string): void {
  saveDebts(userId, []);
}

export function getDebtById(userId: string, debtId: string): StoredDebt | null {
  const debts = getDebts(userId);
  return debts.find((d) => d.id === debtId) || null;
}
