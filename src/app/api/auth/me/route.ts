import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, monthlySurplus: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { monthlySurplus } = await req.json();
  const surplus = parseFloat(monthlySurplus);

  if (isNaN(surplus) || surplus < 0) {
    return NextResponse.json({ error: 'Invalid monthly surplus amount.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { monthlySurplus: surplus },
    select: { id: true, name: true, email: true, monthlySurplus: true },
  });

  return NextResponse.json({ user: updated });
}
