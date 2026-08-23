import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppState, saveAppState, enrichExistingDebt } from '@/lib/sessionStore';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const debt = getAppState().debts.find((d) => d.id === params.id);
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
    const state = getAppState();
    const existing = state.debts.find((d) => d.id === params.id);

    if (!existing) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const principal = body.principalAmount !== undefined ? parseFloat(body.principalAmount) : existing.principalAmount;
    const remaining = body.remainingBalance !== undefined ? parseFloat(body.remainingBalance) : existing.remainingBalance;
    const interestType = body.interestType || existing.interestType;
    const interestRate = body.interestRate !== undefined ? parseFloat(body.interestRate) : existing.interestRate;
    const durationMonths = body.durationMonths !== undefined ? parseInt(body.durationMonths, 10) : existing.durationMonths;
    const resolvedSocialWeight = body.socialWeight || existing.socialWeight;
    const status = remaining <= 0 ? 'paid_off' : body.status || existing.status;

    const updated = enrichExistingDebt({
      ...existing,
      lenderName: body.lenderName || existing.lenderName,
      lenderType: body.lenderType || existing.lenderType,
      principalAmount: principal,
      remainingBalance: remaining,
      interestType,
      interestRate,
      durationMonths,
      repaymentExpectation: body.repaymentExpectation || existing.repaymentExpectation,
      socialWeight: resolvedSocialWeight,
      status,
      updatedAt: new Date().toISOString(),
    });

    state.debts = state.debts.map((d) => (d.id === params.id ? updated : d));
    saveAppState(state);

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

  const state = getAppState();
  const existing = state.debts.find((d) => d.id === params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
  }

  state.debts = state.debts.filter((d) => d.id !== params.id);
  saveAppState(state);
  return NextResponse.json({ success: true });
}
