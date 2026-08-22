/**
 * Rinmukht - Deterministic Financial Math Engine
 *
 * Core Architectural Rule:
 * This module MUST be 100% deterministic, pure, and independent of any LLM or network API.
 * All interest-rate normalization, Effective Annual Cost (EAC) calculations,
 * urgency ranking, and payoff scheduling reside here.
 */

export interface RawDebtInput {
  id: string;
  lenderName: string;
  lenderType: string; // relative | shopkeeper | moneylender | chit_fund | bnpl | other
  principalAmount: number;
  remainingBalance?: number;
  interestDescription?: string | null;
  interestType: string; // none | flat_monthly | compound_monthly | one_time_flat | unspecified
  interestRate: number; // percentage
  startDate?: string | Date | null;
  durationMonths?: number;
  repaymentExpectation?: string;
  socialWeight: string; // low | medium | high
}

export interface NormalizedDebt extends RawDebtInput {
  remainingBalance: number;
  effectiveAnnualCost: number; // EAC in %
  monthlyBleed: number; // Monthly rupee interest cost
  financialUrgency: 'high' | 'medium' | 'low';
  relationalUrgency: 'high' | 'medium' | 'low';
  urgencyTier: 'high' | 'medium' | 'low'; // Financial tier
  durationMonths: number;
}

export interface MonthlyDebtPayment {
  debtId: string;
  lenderName: string;
  startBalance: number;
  interestAccrued: number;
  paymentAmount: number;
  endBalance: number;
  isPaidOff: boolean;
}

export interface MonthSchedule {
  monthIndex: number;
  monthName: string;
  payments: MonthlyDebtPayment[];
  totalSurplusAllocated: number;
  remainingTotalDebt: number;
}

export interface PayoffOrderEntry {
  debtId: string;
  lenderName: string;
  payoffMonth: number;
  payoffDate: string;
  initialBalance: number;
}

export interface PayoffScheduleResult {
  strategy: 'avalanche' | 'snowball' | 'fastest' | 'balanced';
  monthlySurplus: number;
  totalMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  projectedPayoffDates: Record<string, string>; // debtId -> "MMM YYYY"
  payoffOrder: PayoffOrderEntry[];
  debtFreeDate: string;
  schedule: MonthSchedule[];
}

/**
 * Calculates Effective Annual Cost (EAC) as a percentage.
 *
 * Models:
 * 1. 'none': 0%
 * 2. 'flat_monthly': r% per month on original non-reducing balance.
 *    Compounded monthly effective rate: ((1 + r/100)^12 - 1) * 100.
 * 3. 'compound_monthly': r% per month compounding monthly: ((1 + r/100)^12 - 1) * 100.
 * 4. 'one_time_flat': Fee of r% over horizon H (default 12 months).
 *    Annualized rate: ((1 + r/100)^(12 / H) - 1) * 100.
 */
export function calculateEffectiveAnnualCost(
  principal: number,
  interestType: string,
  interestRate: number,
  horizonMonths: number = 12
): number {
  if (principal <= 0 || interestType === 'none' || interestRate <= 0) {
    return 0;
  }

  const horizon = horizonMonths > 0 ? horizonMonths : 12;

  switch (interestType) {
    case 'flat_monthly': {
      // Flat monthly interest on non-reducing principal
      // Monthly interest fraction r = interestRate / 100
      // Effective compounding annual rate reflects full annual cost burden:
      const r = interestRate / 100;
      const eac = (Math.pow(1 + r, 12) - 1) * 100;
      return Math.round(eac * 100) / 100;
    }
    case 'compound_monthly': {
      const r = interestRate / 100;
      const eac = (Math.pow(1 + r, 12) - 1) * 100;
      return Math.round(eac * 100) / 100;
    }
    case 'one_time_flat': {
      const r = interestRate / 100;
      const annualizedRatio = Math.pow(1 + r, 12 / horizon) - 1;
      const eac = annualizedRatio * 100;
      return Math.round(eac * 100) / 100;
    }
    default:
      return 0;
  }
}

/**
 * Calculates monthly interest bleed in Rupees.
 */
export function calculateMonthlyBleed(
  principal: number,
  interestType: string,
  interestRate: number,
  horizonMonths: number = 12
): number {
  if (principal <= 0 || interestType === 'none' || interestRate <= 0) {
    return 0;
  }

  const horizon = horizonMonths > 0 ? horizonMonths : 12;

  switch (interestType) {
    case 'flat_monthly':
    case 'compound_monthly':
      return Math.round(principal * (interestRate / 100));
    case 'one_time_flat':
      return Math.round((principal * (interestRate / 100)) / horizon);
    default:
      return 0;
  }
}

/**
 * Determines Financial Urgency Tier based on EAC and Monthly Bleed.
 */
export function calculateFinancialUrgency(eac: number, monthlyBleed: number = 0): 'high' | 'medium' | 'low' {
  if (eac >= 36 || monthlyBleed >= 1000) return 'high';
  if (eac >= 12 || monthlyBleed >= 300) return 'medium';
  return 'low';
}

/**
 * Backward compatibility alias for calculateFinancialUrgency.
 */
export function calculateUrgencyTier(eac: number): 'high' | 'medium' | 'low' {
  return calculateFinancialUrgency(eac);
}

/**
 * Determines Relational Urgency Tier based on social weight and repayment expectation.
 * Ensures a 0% family loan from a relative carries High Relational Urgency.
 */
export function calculateRelationalUrgency(
  socialWeight: string,
  repaymentExpectation: string = '',
  startDate?: string | Date | null
): 'high' | 'medium' | 'low' {
  const lowerNotes = (repaymentExpectation || '').toLowerCase();
  const isOverdue = /overdue|jaldi|urgent|asap|turant|nazar|dawa|hospital|lafda|emergency/i.test(lowerNotes);

  if (socialWeight === 'high') {
    return 'high';
  }
  if (socialWeight === 'medium') {
    if (isOverdue) return 'high';
    return 'medium';
  }
  // Low social weight (moneylender, bnpl)
  if (isOverdue) return 'medium';
  return 'low';
}

/**
 * Normalizes raw debt input into a fully calculated NormalizedDebt object
 * with two distinct axes: Financial Urgency and Relational Urgency.
 */
export function normalizeDebt(input: RawDebtInput): NormalizedDebt {
  const horizon = input.durationMonths && input.durationMonths > 0 ? input.durationMonths : 12;
  const remaining = input.remainingBalance !== undefined ? input.remainingBalance : input.principalAmount;
  const eac = calculateEffectiveAnnualCost(remaining, input.interestType, input.interestRate, horizon);
  const monthlyBleed = calculateMonthlyBleed(remaining, input.interestType, input.interestRate, horizon);
  const financialUrgency = calculateFinancialUrgency(eac, monthlyBleed);
  const relationalUrgency = calculateRelationalUrgency(input.socialWeight, input.repaymentExpectation, input.startDate);

  return {
    ...input,
    remainingBalance: remaining,
    effectiveAnnualCost: eac,
    monthlyBleed,
    financialUrgency,
    relationalUrgency,
    urgencyTier: financialUrgency,
    durationMonths: horizon,
  };
}

/**
 * Pure Avalanche Strategy:
 * Ranks debts strictly by Effective Annual Cost (EAC) descending.
 * For debts with equal EAC (e.g. 0% interest debts), prioritizes by smaller balance.
 * Non-zero interest debts are ALWAYS prioritized ahead of 0% interest debts.
 */
export function rankDebtsAvalanche(debts: RawDebtInput[]): NormalizedDebt[] {
  const normalized = debts.map(normalizeDebt);
  return [...normalized].sort((a, b) => {
    if (b.effectiveAnnualCost !== a.effectiveAnnualCost) {
      return b.effectiveAnnualCost - a.effectiveAnnualCost;
    }
    return a.remainingBalance - b.remainingBalance;
  });
}

/**
 * Pure Snowball Strategy:
 * Ranks debts strictly by smallest remaining balance ascending.
 * For debts with equal balance, prioritizes higher EAC.
 */
export function rankDebtsSnowball(debts: RawDebtInput[]): NormalizedDebt[] {
  const normalized = debts.map(normalizeDebt);
  return [...normalized].sort((a, b) => {
    if (a.remainingBalance !== b.remainingBalance) {
      return a.remainingBalance - b.remainingBalance;
    }
    return b.effectiveAnnualCost - a.effectiveAnnualCost;
  });
}

/**
 * Ranks debts according to the selected strategy:
 * - "avalanche" / "fastest": Highest EAC first
 * - "snowball": Smallest balance first
 * - "balanced": Hybrid score taking into account EAC + Relationship/Social weight boost
 */
export function rankDebts(
  debts: RawDebtInput[],
  strategy: 'avalanche' | 'snowball' | 'fastest' | 'balanced'
): NormalizedDebt[] {
  if (strategy === 'snowball') {
    return rankDebtsSnowball(debts);
  }
  if (strategy === 'avalanche' || strategy === 'fastest') {
    return rankDebtsAvalanche(debts);
  }

  // Strategy: Balanced
  const normalized = debts.map(normalizeDebt);
  const scored = normalized.map((debt) => {
    // Base financial urgency score (0 - 100)
    let score = Math.min(debt.effectiveAnnualCost, 100);

    // Social weight adjustment
    if (debt.socialWeight === 'high') {
      score += 35; // Significant boost to prevent social friction
    } else if (debt.socialWeight === 'medium') {
      score += 15;
    }

    return { debt, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.debt);
}

/**
 * Month names generator starting from current date.
 */
function getMonthName(monthOffset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

/**
 * Deterministic Payoff Schedule Generator.
 *
 * Given debts, monthly surplus, and strategy ('avalanche' | 'snowball' | 'fastest' | 'balanced'),
 * simulates month-by-month repayment timeline until all debts reach zero.
 */
export function generatePayoffSchedule(
  debts: RawDebtInput[],
  monthlySurplus: number,
  strategy: 'avalanche' | 'snowball' | 'fastest' | 'balanced' = 'avalanche'
): PayoffScheduleResult {
  const activeDebts = debts
    .map(normalizeDebt)
    .filter((d) => d.remainingBalance > 0);

  if (activeDebts.length === 0 || monthlySurplus <= 0) {
    return {
      strategy,
      monthlySurplus,
      totalMonths: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      projectedPayoffDates: {},
      payoffOrder: [],
      debtFreeDate: 'Now (Debt-Free)',
      schedule: [],
    };
  }

  // Track state per debt
  interface DebtState {
    id: string;
    lenderName: string;
    remainingBalance: number;
    interestType: string;
    interestRate: number;
    socialWeight: string;
    effectiveAnnualCost: number;
    durationMonths: number;
    payoffMonth: number | null;
  }

  const states: DebtState[] = activeDebts.map((d) => ({
    id: d.id,
    lenderName: d.lenderName,
    remainingBalance: d.remainingBalance,
    interestType: d.interestType,
    interestRate: d.interestRate,
    socialWeight: d.socialWeight,
    effectiveAnnualCost: d.effectiveAnnualCost,
    durationMonths: d.durationMonths,
    payoffMonth: null,
  }));

  const schedule: MonthSchedule[] = [];
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let month = 0;
  const MAX_MONTHS = 240; // 20-year safety ceiling

  while (states.some((s) => s.remainingBalance > 0.01) && month < MAX_MONTHS) {
    month++;
    let monthSurplusLeft = monthlySurplus;
    let monthInterestAccrued = 0;
    const payments: MonthlyDebtPayment[] = [];

    // Step 1: Accrue interest for active debts
    for (const s of states) {
      if (s.remainingBalance <= 0.01) continue;

      let interest = 0;
      if (s.interestType === 'flat_monthly' || s.interestType === 'compound_monthly') {
        interest = Math.round(s.remainingBalance * (s.interestRate / 100));
      } else if (s.interestType === 'one_time_flat') {
        // Amortized monthly portion
        interest = Math.round((s.remainingBalance * (s.interestRate / 100)) / (s.durationMonths || 12));
      }
      s.remainingBalance += interest;
      monthInterestAccrued += interest;
      totalInterestPaid += interest;
    }

    // Step 2: In "Balanced" strategy, allocate a token minimum payment (e.g., ₹200-₹500 or 10% of surplus)
    // to active high social weight zero/low-interest debts to maintain goodwill!
    if (strategy === 'balanced') {
      const highSocialZeroInterestDebts = states.filter(
        (s) => s.remainingBalance > 0.01 && s.socialWeight === 'high' && s.effectiveAnnualCost === 0
      );

      for (const socialDebt of highSocialZeroInterestDebts) {
        if (monthSurplusLeft <= 50) break;
        const minPay = Math.min(socialDebt.remainingBalance, Math.min(300, monthSurplusLeft * 0.2));
        if (minPay > 0) {
          const startBal = socialDebt.remainingBalance;
          socialDebt.remainingBalance -= minPay;
          totalPrincipalPaid += minPay;
          monthSurplusLeft -= minPay;

          if (socialDebt.remainingBalance <= 0.01) {
            socialDebt.remainingBalance = 0;
            if (socialDebt.payoffMonth === null) socialDebt.payoffMonth = month;
          }

          payments.push({
            debtId: socialDebt.id,
            lenderName: socialDebt.lenderName,
            startBalance: Math.round(startBal),
            interestAccrued: 0,
            paymentAmount: Math.round(minPay),
            endBalance: Math.round(socialDebt.remainingBalance),
            isPaidOff: socialDebt.remainingBalance === 0,
          });
        }
      }
    }

    // Step 3: Priority sort remaining active debts for surplus allocation
    const prioritySorted = [...states]
      .filter((s) => s.remainingBalance > 0.01)
      .sort((a, b) => {
        if (strategy === 'snowball') {
          if (a.remainingBalance !== b.remainingBalance) {
            return a.remainingBalance - b.remainingBalance;
          }
          return b.effectiveAnnualCost - a.effectiveAnnualCost;
        }

        if (strategy === 'avalanche' || strategy === 'fastest') {
          if (b.effectiveAnnualCost !== a.effectiveAnnualCost) {
            return b.effectiveAnnualCost - a.effectiveAnnualCost;
          }
          return a.remainingBalance - b.remainingBalance;
        }

        // Balanced: rank by EAC plus social weight bonus
        const scoreA = a.effectiveAnnualCost + (a.socialWeight === 'high' ? 35 : a.socialWeight === 'medium' ? 15 : 0);
        const scoreB = b.effectiveAnnualCost + (b.socialWeight === 'high' ? 35 : b.socialWeight === 'medium' ? 15 : 0);
        return scoreB - scoreA;
      });

    for (const debt of prioritySorted) {
      if (monthSurplusLeft <= 0.01) break;

      // Find if we already recorded a payment in Step 2 for this debt
      const existingIdx = payments.findIndex((p) => p.debtId === debt.id);
      const startBal = existingIdx >= 0 ? payments[existingIdx].endBalance : debt.remainingBalance;

      const payAmount = Math.min(debt.remainingBalance, monthSurplusLeft);
      debt.remainingBalance -= payAmount;
      monthSurplusLeft -= payAmount;
      totalPrincipalPaid += payAmount;

      if (debt.remainingBalance <= 0.01) {
        debt.remainingBalance = 0;
        if (debt.payoffMonth === null) debt.payoffMonth = month;
      }

      if (existingIdx >= 0) {
        payments[existingIdx].paymentAmount += Math.round(payAmount);
        payments[existingIdx].endBalance = Math.round(debt.remainingBalance);
        payments[existingIdx].isPaidOff = debt.remainingBalance === 0;
      } else {
        payments.push({
          debtId: debt.id,
          lenderName: debt.lenderName,
          startBalance: Math.round(startBal),
          interestAccrued: Math.round(debt.interestRate),
          paymentAmount: Math.round(payAmount),
          endBalance: Math.round(debt.remainingBalance),
          isPaidOff: debt.remainingBalance === 0,
        });
      }
    }

    // Fill in 0 payment records for any debt not paid this month
    for (const s of states) {
      if (!payments.some((p) => p.debtId === s.id)) {
        payments.push({
          debtId: s.id,
          lenderName: s.lenderName,
          startBalance: Math.round(s.remainingBalance),
          interestAccrued: 0,
          paymentAmount: 0,
          endBalance: Math.round(s.remainingBalance),
          isPaidOff: s.remainingBalance <= 0,
        });
      }
    }

    const remainingTotal = states.reduce((acc, curr) => acc + curr.remainingBalance, 0);

    schedule.push({
      monthIndex: month,
      monthName: getMonthName(month - 1),
      payments,
      totalSurplusAllocated: Math.round(monthlySurplus - monthSurplusLeft),
      remainingTotalDebt: Math.round(remainingTotal),
    });
  }

  const projectedPayoffDates: Record<string, string> = {};
  for (const s of states) {
    if (s.payoffMonth !== null) {
      projectedPayoffDates[s.id] = getMonthName(s.payoffMonth - 1);
    } else {
      projectedPayoffDates[s.id] = '20+ Years';
    }
  }

  // Calculate payoff order sorted by the month they reach 0 balance
  const payoffOrder: PayoffOrderEntry[] = [...states]
    .sort((a, b) => {
      const aMonth = a.payoffMonth ?? 9999;
      const bMonth = b.payoffMonth ?? 9999;
      return aMonth - bMonth;
    })
    .map((s) => ({
      debtId: s.id,
      lenderName: s.lenderName,
      payoffMonth: s.payoffMonth ?? month,
      payoffDate: s.payoffMonth !== null ? getMonthName(s.payoffMonth - 1) : '20+ Years',
      initialBalance: activeDebts.find((d) => d.id === s.id)?.remainingBalance ?? 0,
    }));

  const debtFreeDate = month > 0 ? getMonthName(month - 1) : 'Debt-Free';

  return {
    strategy,
    monthlySurplus,
    totalMonths: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalPrincipalPaid: Math.round(totalPrincipalPaid),
    projectedPayoffDates,
    payoffOrder,
    debtFreeDate,
    schedule,
  };
}
