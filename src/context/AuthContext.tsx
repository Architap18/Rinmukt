'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  StoredUser,
  StoredDebt,
  getSession,
  setSession,
  clearSession,
  authenticateUser,
  registerUser,
  getUserById,
  getDebts,
  saveDebts,
  addDebt,
  deleteDebt,
  updateDebt,
  addPayment,
  clearAllDebts,
  getDebtById,
  saveProfile,
} from '@/lib/localStorage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  monthlySurplus: number;
  monthlyIncome: number | null;
  selectedStrategy: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  debts: StoredDebt[];
  loading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Debt actions
  refreshDebts: () => void;
  createDebt: (data: Omit<StoredDebt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paymentLogs'>) => StoredDebt | null;
  removeDebt: (debtId: string) => boolean;
  editDebt: (debtId: string, updates: Partial<StoredDebt>) => StoredDebt | null;
  logPayment: (debtId: string, amount: number, notes: string | null) => { debt: StoredDebt } | null;
  clearDebts: () => void;
  getDebt: (debtId: string) => StoredDebt | null;

  // Profile actions
  updateProfile: (updates: Partial<AuthUser>) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [debts, setDebts] = useState<StoredDebt[]>([]);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    try {
      const session = getSession();
      if (session) {
        const storedUser = getUserById(session.userId);
        if (storedUser) {
          setUser({
            id: storedUser.id,
            name: storedUser.name,
            email: storedUser.email,
            monthlySurplus: storedUser.monthlySurplus,
            monthlyIncome: storedUser.monthlyIncome,
            selectedStrategy: storedUser.selectedStrategy,
          });
          setDebts(getDebts(storedUser.id));
        } else {
          // Session references a user that no longer exists
          clearSession();
        }
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = authenticateUser(email, password);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const storedUser = result.user;
    setSession(storedUser);
    setUser({
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      monthlySurplus: storedUser.monthlySurplus,
      monthlyIncome: storedUser.monthlyIncome,
      selectedStrategy: storedUser.selectedStrategy,
    });
    setDebts(getDebts(storedUser.id));
    return { success: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = registerUser(name, email, password);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const storedUser = result.user;
    setSession(storedUser);
    setUser({
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      monthlySurplus: storedUser.monthlySurplus,
      monthlyIncome: storedUser.monthlyIncome,
      selectedStrategy: storedUser.selectedStrategy,
    });
    setDebts([]);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setDebts([]);
  }, []);

  const refreshDebts = useCallback(() => {
    if (!user) return;
    setDebts(getDebts(user.id));
  }, [user]);

  const createDebt = useCallback((data: Omit<StoredDebt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paymentLogs'>): StoredDebt | null => {
    if (!user) return null;
    const debt = addDebt(user.id, data);
    setDebts((prev) => [debt, ...prev.filter((d) => d.id !== debt.id)]);
    return debt;
  }, [user]);

  const removeDebt = useCallback((debtId: string): boolean => {
    if (!user) return false;
    const success = deleteDebt(user.id, debtId);
    if (success) {
      setDebts((prev) => prev.filter((d) => d.id !== debtId));
    }
    return success;
  }, [user]);

  const editDebt = useCallback((debtId: string, updates: Partial<StoredDebt>): StoredDebt | null => {
    if (!user) return null;
    const updated = updateDebt(user.id, debtId, updates);
    if (updated) {
      setDebts((prev) => prev.map((d) => (d.id === debtId ? updated : d)));
    }
    return updated;
  }, [user]);

  const logPayment = useCallback((debtId: string, amount: number, notes: string | null): { debt: StoredDebt } | null => {
    if (!user) return null;
    const result = addPayment(user.id, debtId, amount, notes);
    if (result) {
      setDebts((prev) => prev.map((d) => (d.id === debtId ? result.debt : d)));
    }
    return result ? { debt: result.debt } : null;
  }, [user]);

  const clearDebts = useCallback(() => {
    if (!user) return;
    clearAllDebts(user.id);
    setDebts([]);
  }, [user]);

  const getDebt = useCallback((debtId: string): StoredDebt | null => {
    if (!user) return null;
    return getDebtById(user.id, debtId);
  }, [user]);

  const updateProfile = useCallback((updates: Partial<AuthUser>) => {
    if (!user) return;
    const saved = saveProfile(user.id, updates as any);
    if (saved) {
      setUser((prev) => prev ? {
        ...prev,
        monthlySurplus: saved.monthlySurplus ?? prev.monthlySurplus,
        monthlyIncome: saved.monthlyIncome ?? prev.monthlyIncome,
        selectedStrategy: saved.selectedStrategy ?? prev.selectedStrategy,
        name: saved.name ?? prev.name,
      } : null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      debts,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshDebts,
      createDebt,
      removeDebt,
      editDebt,
      logPayment,
      clearDebts,
      getDebt,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
