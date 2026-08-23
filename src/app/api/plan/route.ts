import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppState, saveAppState } from '@/lib/sessionStore';
import { generatePayoffSchedule } from '@/lib/debtMath';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const strategyParam = searchParams.get('strategy') as 'avalanche' | 'snowball' | 'fastest' | 'balanced' | null;

  const { user, debts } = getAppState();
  const activeStrat = strategyParam || (user.selectedStrategy as 'avalanche' | 'snowball' | 'fastest' | 'balanced') || 'avalanche';
  const activeDebts = debts.filter((d) => d.status === 'active');

  const plan = generatePayoffSchedule(activeDebts, user.monthlySurplus, activeStrat);
  const avalanchePlan = generatePayoffSchedule(activeDebts, user.monthlySurplus, 'avalanche');
  const snowballPlan = generatePayoffSchedule(activeDebts, user.monthlySurplus, 'snowball');

  return NextResponse.json({
    userMonthlySurplus: user.monthlySurplus,
    userMonthlyIncome: user.monthlyIncome,
    selectedStrategy: user.selectedStrategy,
    plan,
    avalanchePlan,
    snowballPlan,
    debts: activeDebts,
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

    const state = getAppState();
    state.user.monthlySurplus = surplus;
    state.user.selectedStrategy = strat;
    saveAppState(state);

    const activeDebts = state.debts.filter((d) => d.status === 'active');
    const plan = generatePayoffSchedule(activeDebts, surplus, strat as any);
    const avalanchePlan = generatePayoffSchedule(activeDebts, surplus, 'avalanche');
    const snowballPlan = generatePayoffSchedule(activeDebts, surplus, 'snowball');

    return NextResponse.json({
      plan,
      avalanchePlan,
      snowballPlan,
      selectedStrategy: state.user.selectedStrategy,
      userMonthlySurplus: state.user.monthlySurplus,
      savedPlanId: 'session-plan',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate plan' }, { status: 500 });
  }
}
