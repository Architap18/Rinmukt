import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppState, saveAppState } from '@/lib/sessionStore';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const { user } = getAppState();
  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const state = getAppState();

    if (body.monthlySurplus !== undefined) {
      const surplus = parseFloat(body.monthlySurplus);
      if (!isNaN(surplus) && surplus >= 0) {
        state.user.monthlySurplus = surplus;
      }
    }

    if (body.monthlyIncome !== undefined) {
      if (body.monthlyIncome === null || body.monthlyIncome === '') {
        state.user.monthlyIncome = null;
      } else {
        const income = parseFloat(body.monthlyIncome);
        if (!isNaN(income) && income >= 0) {
          state.user.monthlyIncome = income;
        }
      }
    }

    if (body.selectedStrategy !== undefined) {
      const validStrategies = ['avalanche', 'snowball', 'fastest', 'balanced'];
      if (validStrategies.includes(body.selectedStrategy)) {
        state.user.selectedStrategy = body.selectedStrategy;
      }
    }

    saveAppState(state);
    return NextResponse.json({ user: state.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user profile' }, { status: 500 });
  }
}
