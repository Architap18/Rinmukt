import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppState, saveAppState, enrichExistingDebt, JUDGE_USER_ID } from '@/lib/sessionStore';
import { inferSocialWeight } from '@/lib/llmExtraction';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { debts } = getAppState();
  const sorted = [...debts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ debts: sorted });
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

    let parsedStartDate = new Date();
    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed.getTime())) parsedStartDate = parsed;
    }

    const now = new Date().toISOString();
    const debt = enrichExistingDebt({
      id: 'debt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      userId: JUDGE_USER_ID,
      lenderName,
      lenderType,
      principalAmount: principal,
      remainingBalance: principal,
      interestDescription: interestDescription || repaymentExpectation || null,
      interestType: interestType || 'none',
      interestRate: rate,
      startDate: parsedStartDate.toISOString(),
      durationMonths: duration,
      repaymentExpectation: repaymentExpectation || 'Repay as agreed',
      socialWeight: resolvedSocialWeight,
      effectiveAnnualCost: 0,
      monthlyBleed: 0,
      urgencyTier: 'low',
      financialUrgency: 'low',
      relationalUrgency: 'low',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      paymentLogs: [],
    });

    const state = getAppState();
    state.debts = [debt, ...state.debts];
    saveAppState(state);

    return NextResponse.json({ debt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save debt' }, { status: 500 });
  }
}
