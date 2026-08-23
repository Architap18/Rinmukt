import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Demo load is no longer needed. Log in once; sample debts are already loaded.' },
    { status: 410 }
  );
}
