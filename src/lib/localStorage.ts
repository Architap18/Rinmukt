'use client';

import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '@/lib/debtMath';

// ─────────────────────────────────────────────────────────────────────────────
// Rinmukht LocalStorage Layer
// Browser-only authentication and debt storage.
// No database required.
// Each user's debts are isolated by user ID.
// ─────────────────────────────────────────────────────────────────────────────

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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

  urgencyTier: 'high' | 'medium' | 'low';
  financialUrgency: 'high' | 'medium' | 'low';
  relationalUrgency: 'high' | 'medium' | 'low';

  status: string;

  createdAt: string;
  updatedAt: string;

  paymentLogs: PaymentLog[];
};

// Data required when creating a debt.
// Calculated fields are generated automatically.
export type NewDebtData = Omit<
  StoredDebt,
  | 'id'
  | 'userId'
  | 'createdAt'
  | 'updatedAt'
  | 'paymentLogs'
  | 'effectiveAnnualCost'
  | 'monthlyBleed'
  | 'urgencyTier'
  | 'financialUrgency'
  | 'relationalUrgency'
>;

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const USERS_KEY = 'rinmukht_users';
const SESSION_KEY = 'rinmukht_session';
const DEBTS_PREFIX = 'rinmukht_debts_';
const PROFILE_PREFIX = 'rinmukht_profile_';

// ─────────────────────────────────────────────────────────────────────────────
// Safe localStorage access
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Always access localStorage through globalThis.
 *
 * This works in:
 * - Browser
 * - Next.js client components
 * - Vitest
 *
 * It also safely returns null when storage is unavailable.
 */
function getStorage(): Storage | null {
  try {
    if (
      typeof globalThis === 'undefined' ||
      !globalThis.localStorage
    ) {
      return null;
    }

    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function safeGet<T>(key: string): T | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(
  key: string,
  value: unknown
): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch {
    // Ignore storage failures.
  }
}

function safeRemove(key: string): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Password hashing
// ─────────────────────────────────────────────────────────────────────────────

function simpleHash(value: string): string {
  let hash = 0;

  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    const char = value.charCodeAt(i);

    hash =
      (hash << 5) -
      hash +
      char;

    hash |= 0;
  }

  return (
    'h_' +
    Math.abs(hash).toString(36) +
    '_' +
    value.length.toString(36)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

type UserRegistry = Record<
  string,
  StoredUser
>;

function getUserRegistry(): UserRegistry {
  return (
    safeGet<UserRegistry>(
      USERS_KEY
    ) ?? {}
  );
}

function saveUserRegistry(
  registry: UserRegistry
): void {
  safeSet(
    USERS_KEY,
    registry
  );
}

export function getUserByEmail(
  email: string
): StoredUser | null {
  const normalizedEmail =
    email.trim().toLowerCase();

  const registry =
    getUserRegistry();

  return (
    registry[normalizedEmail] ??
    null
  );
}

export function getUserById(
  userId: string
): StoredUser | null {
  const registry =
    getUserRegistry();

  return (
    Object.values(
      registry
    ).find(
      (user) =>
        user.id === userId
    ) ?? null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

export function registerUser(
  name: string,
  email: string,
  password: string
):
  | {
      success: true;
      user: StoredUser;
    }
  | {
      success: false;
      error: string;
    } {
  const cleanName =
    name.trim();

  const normalizedEmail =
    email.trim().toLowerCase();

  if (!cleanName) {
    return {
      success: false,
      error:
        'Please enter your name.',
    };
  }

  if (!normalizedEmail) {
    return {
      success: false,
      error:
        'Please enter your email address.',
    };
  }

  if (
    !normalizedEmail.includes('@')
  ) {
    return {
      success: false,
      error:
        'Please enter a valid email address.',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error:
        'Password must be at least 6 characters.',
    };
  }

  const registry =
    getUserRegistry();

  if (
    registry[normalizedEmail]
  ) {
    return {
      success: false,
      error:
        'An account with this email already exists.',
    };
  }

  const user: StoredUser = {
    id:
      'user-' +
      Date.now() +
      '-' +
      Math.random()
        .toString(36)
        .slice(2, 8),

    name: cleanName,

    email: normalizedEmail,

    passwordHash:
      simpleHash(password),

    monthlySurplus: 3000,

    monthlyIncome: null,

    selectedStrategy:
      'avalanche',

    createdAt:
      new Date().toISOString(),
  };

  registry[normalizedEmail] =
    user;

  saveUserRegistry(
    registry
  );

  return {
    success: true,
    user,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────────────────────

export function authenticateUser(
  email: string,
  password: string
):
  | {
      success: true;
      user: StoredUser;
    }
  | {
      success: false;
      error: string;
    } {
  const user =
    getUserByEmail(email);

  if (!user) {
    return {
      success: false,
      error:
        'No account found with this email address.',
    };
  }

  if (
    user.passwordHash !==
    simpleHash(password)
  ) {
    return {
      success: false,
      error:
        'Incorrect password. Please try again.',
    };
  }

  return {
    success: true,
    user,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────────────────────────────────────

export type Session = {
  userId: string;
  email: string;
  name: string;
};

export function getSession():
  | Session
  | null {
  return safeGet<Session>(
    SESSION_KEY
  );
}

export function setSession(
  user: StoredUser
): void {
  safeSet(
    SESSION_KEY,
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    }
  );
}

export function clearSession(): void {
  safeRemove(
    SESSION_KEY
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

export function getProfile(
  userId: string
): Partial<StoredUser> {
  return (
    safeGet<
      Partial<StoredUser>
    >(
      PROFILE_PREFIX + userId
    ) ?? {}
  );
}

export function saveProfile(
  userId: string,
  updates: Partial<StoredUser>
): StoredUser | null {
  const registry =
    getUserRegistry();

  const user =
    Object.values(
      registry
    ).find(
      (item) =>
        item.id === userId
    );

  if (!user) {
    return null;
  }

  const merged: StoredUser = {
    ...user,
    ...updates,

    // Identity fields cannot be changed
    // through profile updates.
    id: user.id,
    email: user.email,
  };

  registry[user.email] =
    merged;

  saveUserRegistry(
    registry
  );

  safeSet(
    PROFILE_PREFIX + userId,
    merged
  );

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Debt calculations
// ─────────────────────────────────────────────────────────────────────────────

export function enrichDebt(
  partial: Omit<
    StoredDebt,
    | 'effectiveAnnualCost'
    | 'monthlyBleed'
    | 'urgencyTier'
    | 'financialUrgency'
    | 'relationalUrgency'
  > & {
    effectiveAnnualCost?: number;
    monthlyBleed?: number;
    urgencyTier?:
      | 'high'
      | 'medium'
      | 'low';
    financialUrgency?:
      | 'high'
      | 'medium'
      | 'low';
    relationalUrgency?:
      | 'high'
      | 'medium'
      | 'low';
  }
): StoredDebt {
  const eac =
    calculateEffectiveAnnualCost(
      partial.remainingBalance,
      partial.interestType,
      partial.interestRate,
      partial.durationMonths
    );

  const bleed =
    calculateMonthlyBleed(
      partial.remainingBalance,
      partial.interestType,
      partial.interestRate,
      partial.durationMonths
    );

  const financialUrgency =
    calculateFinancialUrgency(
      eac,
      bleed
    );

  const relationalUrgency =
    calculateRelationalUrgency(
      partial.socialWeight,
      partial.repaymentExpectation,
      partial.startDate
    );

  return {
    ...partial,

    effectiveAnnualCost:
      Number.isFinite(eac)
        ? eac
        : 0,

    monthlyBleed:
      Number.isFinite(bleed)
        ? bleed
        : 0,

    urgencyTier:
      financialUrgency,

    financialUrgency,

    relationalUrgency,

    paymentLogs:
      partial.paymentLogs ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Debt storage
// ─────────────────────────────────────────────────────────────────────────────

function debtsKey(
  userId: string
): string {
  return (
    DEBTS_PREFIX +
    userId
  );
}

export function getDebts(
  userId: string
): StoredDebt[] {
  return (
    safeGet<StoredDebt[]>(
      debtsKey(userId)
    ) ?? []
  );
}

export function saveDebts(
  userId: string,
  debts: StoredDebt[]
): void {
  safeSet(
    debtsKey(userId),
    debts
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add debt
// ─────────────────────────────────────────────────────────────────────────────

export function addDebt(
  userId: string,
  debtData: NewDebtData
): StoredDebt {
  const now =
    new Date().toISOString();

  const newDebt =
    enrichDebt({
      ...debtData,

      id:
        'debt-' +
        Date.now() +
        '-' +
        Math.random()
          .toString(36)
          .slice(2, 6),

      userId,

      createdAt: now,

      updatedAt: now,

      paymentLogs: [],
    });

  const debts =
    getDebts(userId);

  debts.unshift(
    newDebt
  );

  saveDebts(
    userId,
    debts
  );

  return newDebt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete debt
// ─────────────────────────────────────────────────────────────────────────────

export function deleteDebt(
  userId: string,
  debtId: string
): boolean {
  const debts =
    getDebts(userId);

  const index =
    debts.findIndex(
      (debt) =>
        debt.id === debtId
    );

  if (index === -1) {
    return false;
  }

  debts.splice(
    index,
    1
  );

  saveDebts(
    userId,
    debts
  );

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update debt
// ─────────────────────────────────────────────────────────────────────────────

export function updateDebt(
  userId: string,
  debtId: string,
  updates: Partial<StoredDebt>
): StoredDebt | null {
  const debts =
    getDebts(userId);

  const index =
    debts.findIndex(
      (debt) =>
        debt.id === debtId
    );

  if (index === -1) {
    return null;
  }

  const existing =
    debts[index];

  const merged =
    enrichDebt({
      ...existing,
      ...updates,

      id: existing.id,

      userId:
        existing.userId,

      createdAt:
        existing.createdAt,

      updatedAt:
        new Date().toISOString(),
    });

  debts[index] =
    merged;

  saveDebts(
    userId,
    debts
  );

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────────────

export function addPayment(
  userId: string,
  debtId: string,
  amountPaid: number,
  notes: string | null
):
  | {
      debt: StoredDebt;
      paymentLog: PaymentLog;
    }
  | null {
  if (
    !Number.isFinite(
      amountPaid
    ) ||
    amountPaid <= 0
  ) {
    return null;
  }

  const debts =
    getDebts(userId);

  const index =
    debts.findIndex(
      (debt) =>
        debt.id === debtId
    );

  if (index === -1) {
    return null;
  }

  const debt =
    debts[index];

  // Prevent overpayment.
  if (
    amountPaid >
    debt.remainingBalance
  ) {
    return null;
  }

  const newBalance =
    debt.remainingBalance -
    amountPaid;

  const paymentLog: PaymentLog = {
    id:
      'pay-' +
      Date.now() +
      '-' +
      Math.random()
        .toString(36)
        .slice(2, 6),

    debtId,

    amountPaid,

    paidAt:
      new Date().toISOString(),

    notes,
  };

  const updated =
    enrichDebt({
      ...debt,

      remainingBalance:
        newBalance,

      status:
        newBalance === 0
          ? 'paid_off'
          : 'active',

      updatedAt:
        new Date().toISOString(),

      paymentLogs: [
        paymentLog,
        ...debt.paymentLogs,
      ],
    });

  debts[index] =
    updated;

  saveDebts(
    userId,
    debts
  );

  return {
    debt: updated,
    paymentLog,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clear all debts
// ─────────────────────────────────────────────────────────────────────────────

export function clearAllDebts(
  userId: string
): void {
  saveDebts(
    userId,
    []
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Get one debt
// ─────────────────────────────────────────────────────────────────────────────

export function getDebtById(
  userId: string,
  debtId: string
): StoredDebt | null {
  const debts =
    getDebts(userId);

  return (
    debts.find(
      (debt) =>
        debt.id === debtId
    ) ?? null
  );
}