import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateUrgencyTier,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '@/lib/debtMath';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const debt = await prisma.debt.findFirst({
    where: { id: params.id, userId: session.userId },
    include: {
      paymentLogs: {
        orderBy: { paidAt: 'desc' },
      },
    },
  });

  if (!debt) {
    return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
  }

  return NextResponse.json({ debt });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const existing = await prisma.debt.findFirst({
      where: { id: params.id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const principal = body.principalAmount !== undefined ? parseFloat(body.principalAmount) : existing.principalAmount;
    const remaining = body.remainingBalance !== undefined ? parseFloat(body.remainingBalance) : existing.remainingBalance;
    const interestType = body.interestType || existing.interestType;
    const interestRate = body.interestRate !== undefined ? parseFloat(body.interestRate) : existing.interestRate;
    const durationMonths = body.durationMonths !== undefined ? parseInt(body.durationMonths, 10) : existing.durationMonths;

    const resolvedSocialWeight = body.socialWeight || existing.socialWeight;
    const eac = calculateEffectiveAnnualCost(remaining, interestType, interestRate, durationMonths);
    const bleed = calculateMonthlyBleed(remaining, interestType, interestRate, durationMonths);
    const financialUrgency = calculateFinancialUrgency(eac, bleed);
    const relationalUrgency = calculateRelationalUrgency(resolvedSocialWeight, body.repaymentExpectation || existing.repaymentExpectation, existing.startDate || undefined);
    const status = remaining <= 0 ? 'paid_off' : body.status || existing.status;

    const updated = await prisma.debt.update({
      where: { id: params.id },
      data: {
        lenderName: body.lenderName || existing.lenderName,
        lenderType: body.lenderType || existing.lenderType,
        principalAmount: principal,
        remainingBalance: remaining,
        interestType,
        interestRate,
        durationMonths,
        repaymentExpectation: body.repaymentExpectation || existing.repaymentExpectation,
        socialWeight: resolvedSocialWeight,
        effectiveAnnualCost: eac,
        monthlyBleed: bleed,
        urgencyTier: financialUrgency,
        financialUrgency,
        relationalUrgency,
        status,
      },
      include: {
        paymentLogs: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ debt: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update debt' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.debt.findFirst({
    where: { id: params.id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
  }

  await prisma.debt.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
