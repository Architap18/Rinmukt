import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Accounts are not stored. Use the judge login on /login (demo@rinmukht.in / password123).',
    },
    { status: 400 }
  );
}
