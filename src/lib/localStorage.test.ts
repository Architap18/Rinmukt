import { describe, it, expect, beforeEach } from 'vitest';

import {
  registerUser,
  authenticateUser,
  getSession,
  setSession,
  clearSession,
  getDebts,
  addDebt,
  deleteDebt,
  addPayment,
  clearAllDebts,
} from './localStorage';

// Mock browser localStorage for Node/Vitest
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  // Completely reset storage before every test
  for (const key in mockStorage) {
    delete mockStorage[key];
  }

  globalThis.localStorage = {
    getItem: (key: string) => {
      return mockStorage[key] ?? null;
    },

    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },

    removeItem: (key: string) => {
      delete mockStorage[key];
    },

    clear: () => {
      for (const key in mockStorage) {
        delete mockStorage[key];
      }
    },

    key: (index: number) => {
      return Object.keys(mockStorage)[index] ?? null;
    },

    get length() {
      return Object.keys(mockStorage).length;
    },
  };
});

/* =========================================================
   AUTHENTICATION & REGISTRATION
   ========================================================= */

describe('LocalStorage User Auth & Registration', () => {
  it('registers a new user successfully', () => {
    const result = registerUser(
      'Ramesh Kumar',
      'ramesh@example.com',
      'mypassword123'
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.user.name).toBe('Ramesh Kumar');
      expect(result.user.email).toBe('ramesh@example.com');
      expect(result.user.id).toBeDefined();
    }
  });

  it('rejects duplicate user registrations', () => {
    registerUser(
      'Ramesh Kumar',
      'ramesh@example.com',
      'mypassword123'
    );

    const duplicate = registerUser(
      'Ramesh 2',
      'RAMESH@example.com',
      'differentpwd'
    );

    expect(duplicate.success).toBe(false);

    if (!duplicate.success) {
      expect(duplicate.error).toContain('already exists');
    }
  });

  it('authenticates valid credentials', () => {
    registerUser(
      'Ramesh Kumar',
      'ramesh@example.com',
      'securepass'
    );

    const result = authenticateUser(
      'ramesh@example.com',
      'securepass'
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.user.name).toBe('Ramesh Kumar');
      expect(result.user.email).toBe('ramesh@example.com');
    }
  });

  it('rejects invalid password', () => {
    registerUser(
      'Ramesh Kumar',
      'ramesh@example.com',
      'securepass'
    );

    const result = authenticateUser(
      'ramesh@example.com',
      'wrongpassword'
    );

    expect(result.success).toBe(false);
  });

  it('rejects non-existent email', () => {
    registerUser(
      'Ramesh Kumar',
      'ramesh@example.com',
      'securepass'
    );

    const result = authenticateUser(
      'nobody@example.com',
      'securepass'
    );

    expect(result.success).toBe(false);
  });

  it('handles email case-insensitively', () => {
    registerUser(
      'Ramesh Kumar',
      'ramesh@example.com',
      'securepass'
    );

    const result = authenticateUser(
      'RAMESH@EXAMPLE.COM',
      'securepass'
    );

    expect(result.success).toBe(true);
  });

  it('manages session persistence', () => {
    const result = registerUser(
      'Sita Devi',
      'sita@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    setSession(result.user);

    const session = getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe(result.user.id);
    expect(session?.email).toBe('sita@example.com');
    expect(session?.name).toBe('Sita Devi');

    clearSession();

    expect(getSession()).toBeNull();
  });
});

/* =========================================================
   DEBT MANAGEMENT
   ========================================================= */

describe('LocalStorage Debt Management', () => {
  it('starts a new user with zero debts', () => {
    const result = registerUser(
      'User One',
      'one@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debts = getDebts(result.user.id);

    expect(debts).toHaveLength(0);
  });

  it('adds a debt successfully', () => {
    const result = registerUser(
      'User One',
      'one@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt = addDebt(result.user.id, {
      lenderName: 'Moneylender',
      lenderType: 'moneylender',
      principalAmount: 10000,
      remainingBalance: 10000,
      interestDescription: '5% monthly',
      interestType: 'flat_monthly',
      interestRate: 5,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'Pay monthly',
      socialWeight: 'medium',
      status: 'active',
    });

    expect(debt).toBeDefined();
    expect(debt.id).toBeDefined();
    expect(debt.userId).toBe(result.user.id);
    expect(debt.lenderName).toBe('Moneylender');
    expect(debt.remainingBalance).toBe(10000);
  });

  it('calculates monthly bleed correctly', () => {
    const result = registerUser(
      'User One',
      'one@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt = addDebt(result.user.id, {
      lenderName: 'Moneylender',
      lenderType: 'moneylender',
      principalAmount: 10000,
      remainingBalance: 10000,
      interestDescription: '5% monthly',
      interestType: 'flat_monthly',
      interestRate: 5,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'Pay monthly',
      socialWeight: 'medium',
      status: 'active',
    });

    expect(debt.monthlyBleed).toBe(500);
    expect(debt.effectiveAnnualCost).toBeGreaterThan(0);
  });

  it('stores the debt in localStorage', () => {
    const result = registerUser(
      'User One',
      'one@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    addDebt(result.user.id, {
      lenderName: 'Moneylender',
      lenderType: 'moneylender',
      principalAmount: 10000,
      remainingBalance: 10000,
      interestDescription: '5% monthly',
      interestType: 'flat_monthly',
      interestRate: 5,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'Pay monthly',
      socialWeight: 'medium',
      status: 'active',
    });

    const debts = getDebts(result.user.id);

    expect(debts).toHaveLength(1);
    expect(debts[0].lenderName).toBe('Moneylender');
    expect(debts[0].remainingBalance).toBe(10000);
  });

  it('isolates debts between different users', () => {
    const userA = registerUser(
      'Alice',
      'alice@example.com',
      'passwordA'
    );

    const userB = registerUser(
      'Bob',
      'bob@example.com',
      'passwordB'
    );

    expect(userA.success).toBe(true);
    expect(userB.success).toBe(true);

    if (!userA.success || !userB.success) {
      throw new Error('Registration failed');
    }

    addDebt(userA.user.id, {
      lenderName: 'Alice Loan',
      lenderType: 'shopkeeper',
      principalAmount: 5000,
      remainingBalance: 5000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 6,
      repaymentExpectation: 'Whenever',
      socialWeight: 'low',
      status: 'active',
    });

    expect(getDebts(userA.user.id)).toHaveLength(1);
    expect(getDebts(userB.user.id)).toHaveLength(0);

    addDebt(userB.user.id, {
      lenderName: 'Bob Moneylender',
      lenderType: 'moneylender',
      principalAmount: 20000,
      remainingBalance: 20000,
      interestDescription: null,
      interestType: 'compound_monthly',
      interestRate: 3,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'Monthly',
      socialWeight: 'high',
      status: 'active',
    });

    expect(getDebts(userA.user.id)).toHaveLength(1);
    expect(getDebts(userB.user.id)).toHaveLength(1);

    expect(
      getDebts(userA.user.id)[0].lenderName
    ).toBe('Alice Loan');

    expect(
      getDebts(userB.user.id)[0].lenderName
    ).toBe('Bob Moneylender');
  });
});

/* =========================================================
   PAYMENT MANAGEMENT
   ========================================================= */

describe('LocalStorage Payment Management', () => {
  it('records a payment and updates balance', () => {
    const result = registerUser(
      'Karan',
      'karan@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt = addDebt(result.user.id, {
      lenderName: 'Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 3000,
      remainingBalance: 3000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 6,
      repaymentExpectation: 'Pay later',
      socialWeight: 'low',
      status: 'active',
    });

    const payment = addPayment(
      result.user.id,
      debt.id,
      1000,
      'Cash payment'
    );

    expect(payment).not.toBeNull();

    expect(payment?.debt.remainingBalance).toBe(2000);
    expect(payment?.debt.status).toBe('active');
    expect(payment?.debt.paymentLogs).toHaveLength(1);
    expect(payment?.paymentLog.amountPaid).toBe(1000);
    expect(payment?.paymentLog.notes).toBe('Cash payment');
  });

  it('marks a debt as paid off when full balance is paid', () => {
    const result = registerUser(
      'Karan',
      'karan@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt = addDebt(result.user.id, {
      lenderName: 'Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 3000,
      remainingBalance: 3000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 6,
      repaymentExpectation: 'Pay later',
      socialWeight: 'low',
      status: 'active',
    });

    const payment = addPayment(
      result.user.id,
      debt.id,
      3000,
      'Full clearance'
    );

    expect(payment).not.toBeNull();

    expect(payment?.debt.remainingBalance).toBe(0);
    expect(payment?.debt.status).toBe('paid_off');
    expect(payment?.debt.paymentLogs).toHaveLength(1);
  });

  it('rejects a payment greater than remaining balance', () => {
    const result = registerUser(
      'Karan',
      'karan@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt = addDebt(result.user.id, {
      lenderName: 'Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 3000,
      remainingBalance: 3000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 6,
      repaymentExpectation: 'Pay later',
      socialWeight: 'low',
      status: 'active',
    });

    const payment = addPayment(
      result.user.id,
      debt.id,
      5000,
      'Invalid payment'
    );

    expect(payment).toBeNull();

    const debts = getDebts(result.user.id);

    expect(debts).toHaveLength(1);
    expect(debts[0].remainingBalance).toBe(3000);
    expect(debts[0].paymentLogs).toHaveLength(0);
  });

  it('rejects zero payment', () => {
    const result = registerUser(
      'Karan',
      'karan@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt = addDebt(result.user.id, {
      lenderName: 'Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 3000,
      remainingBalance: 3000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 6,
      repaymentExpectation: 'Pay later',
      socialWeight: 'low',
      status: 'active',
    });

    const payment = addPayment(
      result.user.id,
      debt.id,
      0,
      'Zero payment'
    );

    expect(payment).toBeNull();

    expect(
      getDebts(result.user.id)[0].remainingBalance
    ).toBe(3000);
  });
});

/* =========================================================
   DELETE & CLEAR
   ========================================================= */

describe('LocalStorage Delete & Clear Operations', () => {
  it('deletes a debt', () => {
    const result = registerUser(
      'Priya',
      'priya@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const debt1 = addDebt(result.user.id, {
      lenderName: 'Loan 1',
      lenderType: 'relative',
      principalAmount: 1000,
      remainingBalance: 1000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'No rush',
      socialWeight: 'high',
      status: 'active',
    });

    const debt2 = addDebt(result.user.id, {
      lenderName: 'Loan 2',
      lenderType: 'relative',
      principalAmount: 2000,
      remainingBalance: 2000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'No rush',
      socialWeight: 'high',
      status: 'active',
    });

    expect(getDebts(result.user.id)).toHaveLength(2);

    const deleted = deleteDebt(
      result.user.id,
      debt1.id
    );

    expect(deleted).toBe(true);

    const debts = getDebts(result.user.id);

    expect(debts).toHaveLength(1);
    expect(debts[0].id).toBe(debt2.id);
  });

  it('returns false when deleting a non-existent debt', () => {
    const result = registerUser(
      'Priya',
      'priya@example.com',
      'password'
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Registration failed');
    }

    const deleted = deleteDebt(
      result.user.id,
      'does-not-exist'
    );

    expect(deleted).toBe(false);
  });

  it('clears all debts for one user only', () => {
    const userA = registerUser(
      'Priya',
      'priya@example.com',
      'passwordA'
    );

    const userB = registerUser(
      'Rahul',
      'rahul@example.com',
      'passwordB'
    );

    expect(userA.success).toBe(true);
    expect(userB.success).toBe(true);

    if (!userA.success || !userB.success) {
      throw new Error('Registration failed');
    }

    addDebt(userA.user.id, {
      lenderName: 'Priya Loan',
      lenderType: 'relative',
      principalAmount: 1000,
      remainingBalance: 1000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'No rush',
      socialWeight: 'high',
      status: 'active',
    });

    addDebt(userB.user.id, {
      lenderName: 'Rahul Loan',
      lenderType: 'shopkeeper',
      principalAmount: 2000,
      remainingBalance: 2000,
      interestDescription: null,
      interestType: 'none',
      interestRate: 0,
      startDate: new Date().toISOString(),
      durationMonths: 12,
      repaymentExpectation: 'No rush',
      socialWeight: 'medium',
      status: 'active',
    });

    clearAllDebts(userA.user.id);

    expect(getDebts(userA.user.id)).toHaveLength(0);

    expect(getDebts(userB.user.id)).toHaveLength(1);

    expect(
      getDebts(userB.user.id)[0].lenderName
    ).toBe('Rahul Loan');
  });
});

/* =========================================================
   LOCAL STORAGE MOCK
   ========================================================= */

describe('LocalStorage Mock', () => {
  it('starts empty', () => {
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem('anything')).toBeNull();
  });

  it('stores and retrieves values', () => {
    localStorage.setItem(
      'test-key',
      'test-value'
    );

    expect(
      localStorage.getItem('test-key')
    ).toBe('test-value');

    expect(localStorage.length).toBe(1);
  });

  it('removes values', () => {
    localStorage.setItem(
      'test-key',
      'test-value'
    );

    expect(
      localStorage.getItem('test-key')
    ).toBe('test-value');

    localStorage.removeItem('test-key');

    expect(
      localStorage.getItem('test-key')
    ).toBeNull();

    expect(localStorage.length).toBe(0);
  });

  it('clears all values', () => {
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', 'value2');

    expect(localStorage.length).toBe(2);

    localStorage.clear();

    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem('key1')).toBeNull();
    expect(localStorage.getItem('key2')).toBeNull();
  });

  it('supports multiple independent keys', () => {
    localStorage.setItem('user1', 'data1');
    localStorage.setItem('user2', 'data2');

    expect(localStorage.getItem('user1')).toBe('data1');
    expect(localStorage.getItem('user2')).toBe('data2');
    expect(localStorage.length).toBe(2);
  });
});