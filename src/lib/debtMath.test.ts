import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateUrgencyTier,
  rankDebts,
  generatePayoffSchedule,
  RawDebtInput,
} from './debtMath';

describe('Karza Untangler - Deterministic Financial Math Engine', () => {
  describe('calculateEffectiveAnnualCost', () => {
    it('returns 0 for interestType "none"', () => {
      const eac = calculateEffectiveAnnualCost(5000, 'none', 0);
      expect(eac).toBe(0);
    });

    it('calculates flat monthly interest EAC with compounding effect', () => {
      // 5% flat monthly on non-reducing principal = (1.05^12 - 1) * 100 = 79.59%
      const eac = calculateEffectiveAnnualCost(10000, 'flat_monthly', 5);
      expect(eac).toBeGreaterThan(60); // Must be higher than naive 5 * 12 = 60
      expect(eac).toBeCloseTo(79.59, 1);
    });

    it('calculates compound monthly interest EAC correctly', () => {
      // 3% compound monthly = (1.03^12 - 1) * 100 = 42.58%
      const eac = calculateEffectiveAnnualCost(8000, 'compound_monthly', 3);
      expect(eac).toBeCloseTo(42.58, 1);
    });

    it('calculates one_time_flat fee EAC amortized over horizon', () => {
      // 10% one-time fee over 12 months = 10%
      const eac12 = calculateEffectiveAnnualCost(3500, 'one_time_flat', 10, 12);
      expect(eac12).toBeCloseTo(10.0, 1);

      // 10% one-time fee over 6 months = ((1.10)^2 - 1) * 100 = 21%
      const eac6 = calculateEffectiveAnnualCost(3500, 'one_time_flat', 10, 6);
      expect(eac6).toBeCloseTo(21.0, 1);
    });
  });

  describe('calculateMonthlyBleed', () => {
    it('calculates flat monthly bleed in rupees', () => {
      const bleed = calculateMonthlyBleed(10000, 'flat_monthly', 5);
      expect(bleed).toBe(500); // ₹500 per month
    });

    it('returns 0 monthly bleed for zero interest debts', () => {
      const bleed = calculateMonthlyBleed(15000, 'none', 0);
      expect(bleed).toBe(0);
    });

    it('calculates amortized monthly bleed for one_time_flat', () => {
      const bleed = calculateMonthlyBleed(6000, 'one_time_flat', 10, 6);
      // Total fee = 600, amortized over 6 months = 100/month
      expect(bleed).toBe(100);
    });
  });

  describe('calculateUrgencyTier', () => {
    it('categorizes high financial urgency for EAC >= 36%', () => {
      expect(calculateUrgencyTier(79.59)).toBe('high');
      expect(calculateUrgencyTier(42.58)).toBe('high');
    });

    it('categorizes medium financial urgency for 12% <= EAC < 36%', () => {
      expect(calculateUrgencyTier(21.0)).toBe('medium');
    });

    it('categorizes low financial urgency for EAC < 12%', () => {
      expect(calculateUrgencyTier(0)).toBe('low');
      expect(calculateUrgencyTier(10.0)).toBe('low');
    });
  });

  describe('rankDebts', () => {
    const testDebts: RawDebtInput[] = [
      {
        id: '1',
        lenderName: 'Chacha',
        lenderType: 'relative',
        principalAmount: 15000,
        interestType: 'none',
        interestRate: 0,
        socialWeight: 'high',
      },
      {
        id: '2',
        lenderName: 'Moneylender',
        lenderType: 'moneylender',
        principalAmount: 10000,
        interestType: 'flat_monthly',
        interestRate: 5,
        socialWeight: 'low',
      },
      {
        id: '3',
        lenderName: 'BNPL App',
        lenderType: 'bnpl',
        principalAmount: 8000,
        interestType: 'compound_monthly',
        interestRate: 3,
        socialWeight: 'low',
      },
    ];

    it('ranks purely by EAC descending in "fastest" strategy', () => {
      const ranked = rankDebts(testDebts, 'fastest');
      expect(ranked[0].lenderName).toBe('Moneylender'); // 79.59% EAC
      expect(ranked[1].lenderName).toBe('BNPL App'); // 42.58% EAC
      expect(ranked[2].lenderName).toBe('Chacha'); // 0% EAC
    });

    it('boosts high social weight debt in "balanced" strategy', () => {
      const ranked = rankDebts(testDebts, 'balanced');
      // Moneylender: 79.59 score
      // Chacha: 0 EAC + 35 social boost = 35 score
      // BNPL App: 42.58 score
      // Order: Moneylender -> BNPL -> Chacha
      expect(ranked[0].lenderName).toBe('Moneylender');
      expect(ranked[1].lenderName).toBe('BNPL App');
      expect(ranked[2].lenderName).toBe('Chacha');
    });
  });

  describe('generatePayoffSchedule', () => {
    const testDebts: RawDebtInput[] = [
      {
        id: 'debt-1',
        lenderName: 'Moneylender',
        lenderType: 'moneylender',
        principalAmount: 10000,
        remainingBalance: 10000,
        interestType: 'flat_monthly',
        interestRate: 5,
        socialWeight: 'low',
      },
      {
        id: 'debt-2',
        lenderName: 'Chacha',
        lenderType: 'relative',
        principalAmount: 5000,
        remainingBalance: 5000,
        interestType: 'none',
        interestRate: 0,
        socialWeight: 'high',
      },
    ];

    it('generates month-by-month payoff schedule for fastest strategy', () => {
      const surplus = 4000;
      const result = generatePayoffSchedule(testDebts, surplus, 'fastest');

      expect(result.totalMonths).toBeGreaterThan(0);
      expect(result.schedule.length).toBe(result.totalMonths);
      expect(result.projectedPayoffDates['debt-1']).toBeDefined();
      expect(result.projectedPayoffDates['debt-2']).toBeDefined();

      // Check last month remaining total debt is 0
      const lastMonth = result.schedule[result.schedule.length - 1];
      expect(lastMonth.remainingTotalDebt).toBe(0);
    });

    it('handles zero interest debts correctly', () => {
      const zeroInterestDebts: RawDebtInput[] = [
        {
          id: 'zero-1',
          lenderName: 'Friend',
          lenderType: 'relative',
          principalAmount: 6000,
          interestType: 'none',
          interestRate: 0,
          socialWeight: 'high',
        },
      ];

      const result = generatePayoffSchedule(zeroInterestDebts, 2000, 'fastest');
      expect(result.totalMonths).toBe(3);
      expect(result.totalInterestPaid).toBe(0);
    });

    it('allocates minimum token payments to high-social-weight zero-interest debt in balanced strategy', () => {
      const result = generatePayoffSchedule(testDebts, 3000, 'balanced');
      // Chacha is high social weight. In balanced strategy, Chacha receives some payment even while Moneylender is active.
      const month1Chacha = result.schedule[0].payments.find((p) => p.debtId === 'debt-2');
      expect(month1Chacha?.paymentAmount).toBeGreaterThan(0);
    });
  });
});
