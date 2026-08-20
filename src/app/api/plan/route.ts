import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generatePayoffSchedule } from '@/lib/debtMath';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const strategyParam = searchParams.get('strategy') === 'balanced' ? 'balanced' : 'fastest';

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const debts = await prisma.debt.findMany({
    where: { userId: session.userId, status: 'active' },
  });

  const plan = generatePayoffSchedule(debts, user.monthlySurplus, strategyParam);

  return NextResponse.json({
    userMonthlySurplus: user.monthlySurplus,
    plan,
    debts,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { strategy, monthlySurplus } = await req.json();
    const strat = strategy === 'balanced' ? 'balanced' : 'fastest';
    const surplus = parseFloat(monthlySurplus);

    if (isNaN(surplus) || surplus <= 0) {
      return NextResponse.json({ error: 'Please enter a valid monthly surplus.' }, { status: 400 });
    }

    // Update user monthly surplus preference
    await prisma.user.update({
      where: { id: session.userId },
      data: { monthlySurplus: surplus },
    });

    const debts = await prisma.debt.findMany({
      where: { userId: session.userId, status: 'active' },
    });

    const plan = generatePayoffSchedule(debts, surplus, strat);

    // Save or update PaymentPlan snapshot in DB
    const savedPlan = await prisma.paymentPlan.create({
      data: {
        userId: session.userId,
        strategy: strat,
        monthlySurplus: surplus,
        scheduleJson: JSON.stringify(plan),
      },
    });

    return NextResponse.json({ plan, savedPlanId: savedPlan.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate plan' }, { status: 500 });
  }
}
