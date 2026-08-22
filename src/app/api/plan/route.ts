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
  const strategyParam = searchParams.get('strategy') as 'avalanche' | 'snowball' | 'fastest' | 'balanced' | null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, monthlySurplus: true, monthlyIncome: true, selectedStrategy: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const activeStrat = strategyParam || (user.selectedStrategy as 'avalanche' | 'snowball' | 'fastest' | 'balanced') || 'avalanche';

  const debts = await prisma.debt.findMany({
    where: { userId: session.userId, status: 'active' },
  });

  const plan = generatePayoffSchedule(debts, user.monthlySurplus, activeStrat);
  const avalanchePlan = generatePayoffSchedule(debts, user.monthlySurplus, 'avalanche');
  const snowballPlan = generatePayoffSchedule(debts, user.monthlySurplus, 'snowball');

  return NextResponse.json({
    userMonthlySurplus: user.monthlySurplus,
    userMonthlyIncome: user.monthlyIncome,
    selectedStrategy: user.selectedStrategy,
    plan,
    avalanchePlan,
    snowballPlan,
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
    const validStrategies = ['avalanche', 'snowball', 'fastest', 'balanced'];
    const strat = validStrategies.includes(strategy) ? strategy : 'avalanche';
    const surplus = parseFloat(monthlySurplus);

    if (isNaN(surplus) || surplus <= 0) {
      return NextResponse.json({ error: 'Please enter a valid monthly surplus.' }, { status: 400 });
    }

    // Update user monthly surplus & selected strategy
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        monthlySurplus: surplus,
        selectedStrategy: strat,
      },
    });

    const debts = await prisma.debt.findMany({
      where: { userId: session.userId, status: 'active' },
    });

    const plan = generatePayoffSchedule(debts, surplus, strat as any);
    const avalanchePlan = generatePayoffSchedule(debts, surplus, 'avalanche');
    const snowballPlan = generatePayoffSchedule(debts, surplus, 'snowball');

    // Save or update PaymentPlan snapshot in DB
    const savedPlan = await prisma.paymentPlan.create({
      data: {
        userId: session.userId,
        strategy: strat,
        monthlySurplus: surplus,
        scheduleJson: JSON.stringify(plan),
      },
    });

    return NextResponse.json({
      plan,
      avalanchePlan,
      snowballPlan,
      selectedStrategy: updatedUser.selectedStrategy,
      userMonthlySurplus: updatedUser.monthlySurplus,
      savedPlanId: savedPlan.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate plan' }, { status: 500 });
  }
}
