import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '@/lib/debtMath';
import { inferSocialWeight } from '@/lib/llmExtraction';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const debts = await prisma.debt.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      paymentLogs: {
        orderBy: { paidAt: 'desc' },
      },
    },
  });

  return NextResponse.json({ debts });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      lenderName,
      lenderType,
      principalAmount,
      interestDescription,
      interestType,
      interestRate,
      startDate,
      durationMonths,
      repaymentExpectation,
      socialWeight,
    } = body;

    if (!lenderName || !lenderType || !principalAmount) {
      return NextResponse.json({ error: 'Lender name, type, and principal amount are required.' }, { status: 400 });
    }

    const principal = parseFloat(principalAmount);
    const rate = interestRate !== undefined && interestRate !== null ? parseFloat(interestRate) : 0;
    const duration = durationMonths ? parseInt(durationMonths, 10) : 12;
    const resolvedSocialWeight = socialWeight || inferSocialWeight(lenderType);

    // Pure deterministic math calculations
    const eac = calculateEffectiveAnnualCost(principal, interestType || 'none', rate, duration);
    const bleed = calculateMonthlyBleed(principal, interestType || 'none', rate, duration);
    const financialUrgency = calculateFinancialUrgency(eac, bleed);
    const relationalUrgency = calculateRelationalUrgency(resolvedSocialWeight, repaymentExpectation, startDate);

    let parsedStartDate = new Date();
    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed.getTime())) parsedStartDate = parsed;
    }

    const debt = await prisma.debt.create({
      data: {
        userId: session.userId,
        lenderName,
        lenderType,
        principalAmount: principal,
        remainingBalance: principal,
        interestDescription: interestDescription || repaymentExpectation || null,
        interestType: interestType || 'none',
        interestRate: rate,
        startDate: parsedStartDate,
        durationMonths: duration,
        repaymentExpectation: repaymentExpectation || 'Repay as agreed',
        socialWeight: resolvedSocialWeight,
        effectiveAnnualCost: eac,
        monthlyBleed: bleed,
        urgencyTier: financialUrgency,
        financialUrgency,
        relationalUrgency,
        status: 'active',
      },
    });

    return NextResponse.json({ debt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save debt' }, { status: 500 });
  }
}
