import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    let session = await getCurrentUser();
    let userId = session?.userId;

    if (!userId) {
      const demoUser = await prisma.user.findFirst({
        where: { email: { in: ['demo@rinmukht.in', 'demo@karza.in'] } },
      });
      if (demoUser) {
        userId = demoUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: true, message: 'No records to reset.' });
    }

    // Delete all payment logs, plans, and debts for this user
    await prisma.paymentLog.deleteMany({
      where: { debt: { userId } },
    });

    await prisma.paymentPlan.deleteMany({
      where: { userId },
    });

    await prisma.debt.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true, message: 'All debt records deleted.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset debt data' }, { status: 500 });
  }
}
