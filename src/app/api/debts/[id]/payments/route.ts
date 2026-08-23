import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppState, saveAppState, enrichExistingDebt } from '@/lib/sessionStore';
import { calculateUrgencyTier } from '@/lib/debtMath';

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

    const state = getAppState();
    const debt = state.debts.find((d) => d.id === params.id);
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const newBalance = Math.max(0, debt.remainingBalance - amount);
    const paymentLog = {
      id: 'pay-' + Date.now(),
      debtId: debt.id,
      amountPaid: amount,
      notes: notes || 'Payment logged',
      paidAt: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
    };

    const updated = enrichExistingDebt({
      ...debt,
      remainingBalance: newBalance,
      status: newBalance === 0 ? 'paid_off' : 'active',
      updatedAt: new Date().toISOString(),
      paymentLogs: [paymentLog, ...debt.paymentLogs],
    });
    updated.urgencyTier = calculateUrgencyTier(updated.effectiveAnnualCost);

    state.debts = state.debts.map((d) => (d.id === params.id ? updated : d));
    saveAppState(state);

    return NextResponse.json({ paymentLog, debt: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment logging failed' }, { status: 500 });
  }
}
