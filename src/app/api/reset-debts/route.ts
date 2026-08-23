import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppState, saveAppState } from '@/lib/sessionStore';

export async function POST() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: true, message: 'No records to reset.' });
    }

    const state = getAppState();
    state.debts = [];
    saveAppState(state);

    return NextResponse.json({ success: true, message: 'All debt records deleted.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset debt data' }, { status: 500 });
  }
}
