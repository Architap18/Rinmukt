import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateEffectiveAnnualCost, calculateMonthlyBleed, calculateUrgencyTier } from '@/lib/debtMath';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amountPaid, notes, paidAt } = await req.json();
    const amount = parseFloat(amountPaid);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid payment amount.' }, { status: 400 });
    }

    const debt = await prisma.debt.findFirst({
      where: { id: params.id, userId: session.userId },
    });

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const newBalance = Math.max(0, debt.remainingBalance - amount);
    const newEac = calculateEffectiveAnnualCost(newBalance, debt.interestType, debt.interestRate, debt.durationMonths);
    const newBleed = calculateMonthlyBleed(newBalance, debt.interestType, debt.interestRate, debt.durationMonths);
    const newUrgency = calculateUrgencyTier(newEac);
    const newStatus = newBalance === 0 ? 'paid_off' : 'active';

    const [paymentLog, updatedDebt] = await prisma.$transaction([
      prisma.paymentLog.create({
        data: {
          debtId: debt.id,
          amountPaid: amount,
          notes: notes || 'Payment logged',
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      }),
      prisma.debt.update({
        where: { id: debt.id },
        data: {
          remainingBalance: newBalance,
          effectiveAnnualCost: newEac,
          monthlyBleed: newBleed,
          urgencyTier: newUrgency,
          status: newStatus,
        },
        include: {
          paymentLogs: {
            orderBy: { paidAt: 'desc' },
          },
        },
      }),
    ]);

    return NextResponse.json({ paymentLog, debt: updatedDebt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment logging failed' }, { status: 500 });
  }
}
