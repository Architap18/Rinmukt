import { NextResponse } from 'next/server';
import { getCurrentUser, signToken, setAuthCookie, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '@/lib/debtMath';

export async function POST() {
  try {
    let session = await getCurrentUser();
    let userId = session?.userId;

    // If unauthenticated, automatically attach or create demo user session
    if (!userId) {
      let demoUser = await prisma.user.findFirst({
        where: { email: { in: ['demo@rinmukht.in', 'demo@karza.in'] } },
      });

      if (!demoUser) {
        const hashedPassword = await hashPassword('password123');
        demoUser = await prisma.user.create({
          data: {
            name: 'Demo Borrower',
            email: 'demo@rinmukht.in',
            passwordHash: hashedPassword,
            monthlyIncome: 25000,
            monthlySurplus: 3500,
            selectedStrategy: 'avalanche',
          },
        });
      }

      userId = demoUser.id;
      const token = await signToken({ userId: demoUser.id, email: demoUser.email });
      setAuthCookie(token);
    }

    // 1. Clear existing user debts for clean demo state
    await prisma.paymentLog.deleteMany({
      where: { debt: { userId } },
    });
    await prisma.paymentPlan.deleteMany({
      where: { userId },
    });
    await prisma.debt.deleteMany({
      where: { userId },
    });

    // 2. Exact synthetic example dataset specified for Judge Demo:
    // - Chacha — ₹5,000 — 0% interest
    // - Kirana Shop — ₹2,000 — no interest
    // - Moneylender — ₹10,000 — 5%/month
    // - BNPL — ₹4,000 — due in 15 days
    const demoDebts = [
      {
        lenderName: 'Chacha',
        lenderType: 'relative',
        principalAmount: 5000,
        remainingBalance: 5000,
        interestDescription: 'Chacha se 5000 liye, 0% interest (bina byaj)',
        interestType: 'none',
        interestRate: 0,
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 1.5 months ago
        durationMonths: 12,
        repaymentExpectation: 'Return whenever money is available; family goodwill loan',
        socialWeight: 'high',
      },
      {
        lenderName: 'Kirana Shop',
        lenderType: 'shopkeeper',
        principalAmount: 2000,
        remainingBalance: 2000,
        interestDescription: 'Kirana shop 2000 udhar, no interest',
        interestType: 'none',
        interestRate: 0,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        durationMonths: 6,
        repaymentExpectation: 'Pay at the end of the month upon salary/harvest',
        socialWeight: 'medium',
      },
      {
        lenderName: 'Moneylender',
        lenderType: 'moneylender',
        principalAmount: 10000,
        remainingBalance: 10000,
        interestDescription: 'Moneylender 10000 loan, 5% per month',
        interestType: 'flat_monthly',
        interestRate: 5.0,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        durationMonths: 12,
        repaymentExpectation: '₹500 monthly interest bleed; principal due when able',
        socialWeight: 'low',
      },
      {
        lenderName: 'BNPL App',
        lenderType: 'bnpl',
        principalAmount: 4000,
        remainingBalance: 4000,
        interestDescription: 'BNPL instant app 4000 balance, due in 15 days (3% monthly)',
        interestType: 'compound_monthly',
        interestRate: 3.0,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        durationMonths: 12,
        repaymentExpectation: 'Late fees compounding on overdue app balance',
        socialWeight: 'low',
      },
    ];

    for (const d of demoDebts) {
      const eac = calculateEffectiveAnnualCost(d.remainingBalance, d.interestType, d.interestRate, d.durationMonths);
      const bleed = calculateMonthlyBleed(d.remainingBalance, d.interestType, d.interestRate, d.durationMonths);
      const financialUrgency = calculateFinancialUrgency(eac, bleed);
      const relationalUrgency = calculateRelationalUrgency(d.socialWeight, d.repaymentExpectation, d.startDate);

      await prisma.debt.create({
        data: {
          userId,
          lenderName: d.lenderName,
          lenderType: d.lenderType,
          principalAmount: d.principalAmount,
          remainingBalance: d.remainingBalance,
          interestDescription: d.interestDescription,
          interestType: d.interestType,
          interestRate: d.interestRate,
          startDate: d.startDate,
          durationMonths: d.durationMonths,
          repaymentExpectation: d.repaymentExpectation,
          socialWeight: d.socialWeight,
          effectiveAnnualCost: eac,
          monthlyBleed: bleed,
          urgencyTier: financialUrgency,
          financialUrgency,
          relationalUrgency,
          status: 'active',
        },
      });
    }

    // Set user demo surplus and income
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyIncome: 25000,
        monthlySurplus: 3500,
        selectedStrategy: 'avalanche',
      },
    });

    return NextResponse.json({ success: true, message: 'Synthetic Demo dataset loaded successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load demo data' }, { status: 500 });
  }
}
