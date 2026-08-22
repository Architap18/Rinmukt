import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateUrgencyTier,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
  normalizeDebt,
  rankDebts,
  rankDebtsAvalanche,
  rankDebtsSnowball,
  generatePayoffSchedule,
  RawDebtInput,
} from './debtMath';
import {
  fallbackExtraction,
  inferSocialWeight,
  parseRelativeStartDate,
} from './llmExtraction';

describe('Rinmukht - Deterministic Financial Math Engine', () => {
  describe('calculateEffectiveAnnualCost', () => {
    it('returns 0 for interestType "none"', () => {
      const eac = calculateEffectiveAnnualCost(5000, 'none', 0);
      expect(eac).toBe(0);
    });

    it('handles "unspecified" interest type gracefully without throwing or NaN', () => {
      const eac = calculateEffectiveAnnualCost(5000, 'unspecified', 0);
      expect(eac).toBe(0);
      expect(isNaN(eac)).toBe(false);
    });

    it('calculates flat monthly interest EAC with true compounding effect', () => {
      // 5% flat monthly on non-reducing principal = (1.05^12 - 1) * 100 = 79.59%
      const eac = calculateEffectiveAnnualCost(10000, 'flat_monthly', 5);
      expect(eac).toBeGreaterThan(60); // Must be substantially higher than naive 5 * 12 = 60
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

  describe('Dual-Axis Urgency Output (Financial vs Relational)', () => {
    it('calculates Financial Urgency based on EAC and Bleed', () => {
      expect(calculateFinancialUrgency(79.59, 500)).toBe('high');
      expect(calculateFinancialUrgency(21.0, 100)).toBe('medium');
      expect(calculateFinancialUrgency(0, 0)).toBe('low');
      expect(calculateUrgencyTier(79.59)).toBe('high');
    });

    it('calculates Relational Urgency based on Social Weight and expectations', () => {
      expect(calculateRelationalUrgency('high')).toBe('high');
      expect(calculateRelationalUrgency('medium')).toBe('medium');
      expect(calculateRelationalUrgency('low')).toBe('low');
      // Overdue/urgent signal escalates relational urgency
      expect(calculateRelationalUrgency('medium', 'overdue payment needed')).toBe('high');
    });

    it('normalizeDebt outputs two distinct axes: 0% relative loan has low financial urgency + high relational urgency', () => {
      const relativeDebt: RawDebtInput = {
        id: 'rel-1',
        lenderName: 'Chacha',
        lenderType: 'relative',
        principalAmount: 10000,
        remainingBalance: 10000,
        interestType: 'none',
        interestRate: 0,
        socialWeight: 'high',
        repaymentExpectation: 'jab paisa aaye',
      };

      const normalized = normalizeDebt(relativeDebt);
      expect(normalized.financialUrgency).toBe('low');
      expect(normalized.relationalUrgency).toBe('high');
      expect(normalized.effectiveAnnualCost).toBe(0);
    });

    it('normalizeDebt outputs high financial urgency + low relational urgency for commercial moneylender', () => {
      const moneylenderDebt: RawDebtInput = {
        id: 'money-1',
        lenderName: 'Saukar',
        lenderType: 'moneylender',
        principalAmount: 20000,
        remainingBalance: 20000,
        interestType: 'flat_monthly',
        interestRate: 5,
        socialWeight: 'low',
        repaymentExpectation: 'har mahine byaj',
      };

      const normalized = normalizeDebt(moneylenderDebt);
      expect(normalized.financialUrgency).toBe('high');
      expect(normalized.relationalUrgency).toBe('low');
      expect(normalized.effectiveAnnualCost).toBeCloseTo(79.59, 1);
    });
  });

  describe('rankDebtsAvalanche and rankDebtsSnowball', () => {
    const testDebts: RawDebtInput[] = [
      {
        id: '1',
        lenderName: 'Chacha (Small 0% loan)',
        lenderType: 'relative',
        principalAmount: 2000,
        remainingBalance: 2000,
        interestType: 'none',
        interestRate: 0,
        socialWeight: 'high',
      },
      {
        id: '2',
        lenderName: 'Moneylender (Big high interest)',
        lenderType: 'moneylender',
        principalAmount: 20000,
        remainingBalance: 20000,
        interestType: 'flat_monthly',
        interestRate: 5, // ~79.59% EAC
        socialWeight: 'low',
      },
      {
        id: '3',
        lenderName: 'BNPL App (Medium interest)',
        lenderType: 'bnpl',
        principalAmount: 8000,
        remainingBalance: 8000,
        interestType: 'compound_monthly',
        interestRate: 3, // ~42.58% EAC
        socialWeight: 'low',
      },
      {
        id: '4',
        lenderName: 'Kirana Store (One-time fee)',
        lenderType: 'shopkeeper',
        principalAmount: 5000,
        remainingBalance: 5000,
        interestType: 'one_time_flat',
        interestRate: 10, // ~10% EAC (12 mo)
        socialWeight: 'medium',
      },
    ];

    it('Avalanche orders debts by highest EAC first; 0% debt is NEVER prioritized by balance', () => {
      const ranked = rankDebtsAvalanche(testDebts);
      // Expected order: Moneylender (79.59%) -> BNPL App (42.58%) -> Kirana Store (10%) -> Chacha (0%)
      expect(ranked[0].lenderName).toBe('Moneylender (Big high interest)');
      expect(ranked[1].lenderName).toBe('BNPL App (Medium interest)');
      expect(ranked[2].lenderName).toBe('Kirana Store (One-time fee)');
      expect(ranked[3].lenderName).toBe('Chacha (Small 0% loan)');
    });

    it('Snowball orders debts by smallest remaining balance first', () => {
      const ranked = rankDebtsSnowball(testDebts);
      // Balances: Chacha (2000) -> Kirana (5000) -> BNPL (8000) -> Moneylender (20000)
      expect(ranked[0].lenderName).toBe('Chacha (Small 0% loan)');
      expect(ranked[1].lenderName).toBe('Kirana Store (One-time fee)');
      expect(ranked[2].lenderName).toBe('BNPL App (Medium interest)');
      expect(ranked[3].lenderName).toBe('Moneylender (Big high interest)');
    });

    it('rankDebts respects strategy argument ("avalanche", "snowball", "balanced")', () => {
      const avalanche = rankDebts(testDebts, 'avalanche');
      expect(avalanche[0].lenderName).toBe('Moneylender (Big high interest)');

      const snowball = rankDebts(testDebts, 'snowball');
      expect(snowball[0].lenderName).toBe('Chacha (Small 0% loan)');

      const balanced = rankDebts(testDebts, 'balanced');
      expect(balanced.length).toBe(4);
    });
  });

  describe('generatePayoffSchedule (Avalanche vs. Snowball Comparison)', () => {
    const mixedDebts: RawDebtInput[] = [
      {
        id: 'high-int',
        lenderName: 'Moneylender',
        lenderType: 'moneylender',
        principalAmount: 15000,
        remainingBalance: 15000,
        interestType: 'flat_monthly',
        interestRate: 5, // high interest
        socialWeight: 'low',
      },
      {
        id: 'small-zero',
        lenderName: 'Friend',
        lenderType: 'relative',
        principalAmount: 3000,
        remainingBalance: 3000,
        interestType: 'none',
        interestRate: 0, // 0% interest, small balance
        socialWeight: 'high',
      },
    ];

    it('generates Avalanche schedule saving more total interest than Snowball on high interest debts', () => {
      const surplus = 4000;
      const avalanchePlan = generatePayoffSchedule(mixedDebts, surplus, 'avalanche');
      const snowballPlan = generatePayoffSchedule(mixedDebts, surplus, 'snowball');

      expect(avalanchePlan.totalMonths).toBeGreaterThan(0);
      expect(snowballPlan.totalMonths).toBeGreaterThan(0);

      // Avalanche tackles Moneylender first, so total interest paid must be less than or equal to Snowball
      expect(avalanchePlan.totalInterestPaid).toBeLessThanOrEqual(snowballPlan.totalInterestPaid);
      expect(avalanchePlan.payoffOrder).toBeDefined();
      expect(snowballPlan.payoffOrder).toBeDefined();
      expect(avalanchePlan.debtFreeDate).toBeDefined();
    });

    it('handles zero debts gracefully', () => {
      const result = generatePayoffSchedule([], 3000, 'avalanche');
      expect(result.totalMonths).toBe(0);
      expect(result.totalInterestPaid).toBe(0);
      expect(result.schedule.length).toBe(0);
      expect(result.payoffOrder.length).toBe(0);
    });

    it('handles single debt correctly', () => {
      const single: RawDebtInput[] = [
        {
          id: 'single-1',
          lenderName: 'Single Lender',
          lenderType: 'shopkeeper',
          principalAmount: 5000,
          remainingBalance: 5000,
          interestType: 'none',
          interestRate: 0,
          socialWeight: 'medium',
        },
      ];

      const result = generatePayoffSchedule(single, 2500, 'avalanche');
      expect(result.totalMonths).toBe(2);
      expect(result.totalInterestPaid).toBe(0);
      expect(result.payoffOrder[0].debtId).toBe('single-1');
    });

    it('allocates minimum token payments to high-social-weight zero-interest debt in balanced strategy', () => {
      const result = generatePayoffSchedule(mixedDebts, 3000, 'balanced');
      const month1Friend = result.schedule[0].payments.find((p) => p.debtId === 'small-zero');
      expect(month1Friend?.paymentAmount).toBeGreaterThan(0);
    });
  });

  describe('Priority 1 Extraction Pipeline NLP & Ambiguity Logic', () => {
    it('infers social weight accurately by lender type', () => {
      expect(inferSocialWeight('relative')).toBe('high');
      expect(inferSocialWeight('shopkeeper')).toBe('medium');
      expect(inferSocialWeight('chit_fund')).toBe('medium');
      expect(inferSocialWeight('moneylender')).toBe('low');
      expect(inferSocialWeight('bnpl')).toBe('low');
      expect(inferSocialWeight('other')).toBe('medium');
    });

    it('parses relative start date expressions correctly', () => {
      const base = new Date('2026-08-01T00:00:00Z');
      const twoMonthsAgo = parseRelativeStartDate('2 mahine se', base);
      const parsedDate = new Date(twoMonthsAgo);
      expect(parsedDate.getMonth()).toBe(5); // June (2 months before August)

      const lastWeek = parseRelativeStartDate('pichle hafte', base);
      const parsedWeek = new Date(lastWeek);
      expect(parsedWeek.getDate()).toBe(25); // July 25
    });

    it('extracts clear 0% relative debt without ambiguity', () => {
      const res = fallbackExtraction('Chacha se 5000 liye 2 mahine se, koi interest nahi');
      expect(res.lenderName).toBe('Chacha');
      expect(res.lenderType).toBe('relative');
      expect(res.principalAmount).toBe(5000);
      expect(res.interestType).toBe('none');
      expect(res.interestRate).toBe(0);
      expect(res.socialWeight).toBe('high');
      expect(res.ambiguous).toBe(false);
      expect(res.clarificationQuestion).toBeNull();
    });

    it('extracts flat monthly moneylender debt without ambiguity', () => {
      const res = fallbackExtraction('Moneylender se 10000 liya, 5% per month');
      expect(res.lenderType).toBe('moneylender');
      expect(res.principalAmount).toBe(10000);
      expect(res.interestType).toBe('flat_monthly');
      expect(res.interestRate).toBe(5);
      expect(res.socialWeight).toBe('low');
      expect(res.ambiguous).toBe(false);
    });

    it('flags ambiguous percentage rate missing timeframe context and formulates clarifying question', () => {
      const res = fallbackExtraction('Kirana store 3500 udhar 10% rate');
      expect(res.ambiguous).toBe(true);
      expect(res.interestType).toBe('unspecified');
      expect(res.clarificationQuestion).toContain('10%');
      expect(res.clarificationQuestion).toContain('month');
    });

    it('flags ambiguous interest mention without rate and asks for percentage', () => {
      const res = fallbackExtraction('Saukar se 20000 liya hai byaj par');
      expect(res.ambiguous).toBe(true);
      expect(res.interestType).toBe('unspecified');
      expect(res.clarificationQuestion).toContain('interest rate or percentage');
    });
  });
});
