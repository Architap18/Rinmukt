import { describe, it, expect } from 'vitest';
import {
  generateDeterministicDebtExplanation,
  generateDeterministicPlanExplanation,
  verifyExplanationNumbers,
  generateExplanation,
} from './explanationService';

describe('Feature 1 & 2 — AI Explanation Layer & Multilingual Safeguards', () => {
  const sampleDebt = {
    lenderName: 'Moneylender',
    lenderType: 'moneylender',
    principalAmount: 10000,
    remainingBalance: 10000,
    interestType: 'flat_monthly',
    interestRate: 5.0,
    effectiveAnnualCost: 79.59,
    monthlyBleed: 500,
    financialUrgency: 'high',
    relationalUrgency: 'low',
  };

  const zeroInterestDebt = {
    lenderName: 'Chacha',
    lenderType: 'relative',
    principalAmount: 5000,
    remainingBalance: 5000,
    interestType: 'none',
    interestRate: 0,
    effectiveAnnualCost: 0,
    monthlyBleed: 0,
    financialUrgency: 'low',
    relationalUrgency: 'high',
  };

  const samplePlan = {
    strategy: 'avalanche' as const,
    totalInterestPaid: 1500,
    totalMonths: 8,
    debtFreeDate: 'Nov 2026',
    monthlySurplus: 3000,
    totalDebt: 15000,
    debtsCount: 2,
    payoffSequence: ['Moneylender', 'Chacha'],
  };

  describe('Deterministic Multilingual Generation', () => {
    it('generates clear English explanation preserving exact numbers', () => {
      const text = generateDeterministicDebtExplanation(sampleDebt, 'en');
      expect(text).toContain('₹10,000');
      expect(text).toContain('₹500');
      expect(text).toContain('79.59%');
      expect(text).toContain('Moneylender');
    });

    it('generates Hindi explanation with relational tone for 0% loan', () => {
      const text = generateDeterministicDebtExplanation(zeroInterestDebt, 'hi');
      expect(text).toContain('₹5,000');
      expect(text).toContain('Chacha');
      expect(text).toContain('कोई ब्याज नहीं');
      expect(text).toContain('रिश्ते');
    });

    it('generates Hinglish explanation for informal borrower context', () => {
      const text = generateDeterministicDebtExplanation(sampleDebt, 'hinglish');
      expect(text).toContain('₹10,000');
      expect(text).toContain('5% per month');
      expect(text).toContain('₹500');
      expect(text).toContain('79.59%');
    });

    it('supports Marathi, Bengali, Punjabi, and Gujarati outputs', () => {
      expect(generateDeterministicDebtExplanation(sampleDebt, 'mr')).toContain('₹10,000');
      expect(generateDeterministicDebtExplanation(sampleDebt, 'bn')).toContain('₹10,000');
      expect(generateDeterministicDebtExplanation(sampleDebt, 'pa')).toContain('₹10,000');
      expect(generateDeterministicDebtExplanation(sampleDebt, 'gu')).toContain('₹10,000');
    });

    it('generates plan walkthrough across multiple languages', () => {
      const enPlan = generateDeterministicPlanExplanation(samplePlan, 'en');
      expect(enPlan).toContain('Debt Avalanche');
      expect(enPlan).toContain('Nov 2026');
      expect(enPlan).toContain('₹1,500');

      const hiPlan = generateDeterministicPlanExplanation(samplePlan, 'hi');
      expect(hiPlan).toContain('Nov 2026');
      expect(hiPlan).toContain('₹1,500');
    });
  });

  describe('Post-generation Number Verification Safeguard', () => {
    it('verifies valid numbers matching the input payload', () => {
      const validText = 'Your ₹10,000 loan costs ₹500 per month, which equals 79.59% annual cost.';
      const allowedNumbers = [10000, 500, 79.59];
      expect(verifyExplanationNumbers(validText, allowedNumbers)).toBe(true);
    });

    it('rejects and discards text with unverified/hallucinated ₹ figures', () => {
      const hallucinatedText = 'Your loan will incur an extra penalty of ₹2,500 with ₹18,000 final cost.';
      const allowedNumbers = [10000, 500, 79.59];
      expect(verifyExplanationNumbers(hallucinatedText, allowedNumbers)).toBe(false);
    });
  });

  describe('generateExplanation API Engine', () => {
    it('returns verified output with high confidence when no assumptions made', async () => {
      const result = await generateExplanation({
        debt: sampleDebt,
        language: 'en',
      });
      expect(result.verified).toBe(true);
      expect(result.isHighConfidence).toBe(true);
      expect(result.hasAssumptions).toBe(false);
      expect(result.text).toContain('₹10,000');
    });

    it('flags assumptions appropriately when date was estimated', async () => {
      const result = await generateExplanation({
        debt: { ...sampleDebt, isEstimated: true },
        language: 'hi',
      });
      expect(result.verified).toBe(true);
      expect(result.hasAssumptions).toBe(true);
      expect(result.isHighConfidence).toBe(false);
      expect(result.assumptionNotes?.length).toBeGreaterThan(0);
    });
  });
});
