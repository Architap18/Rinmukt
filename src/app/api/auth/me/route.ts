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
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      monthlySurplus: true,
      monthlyIncome: true,
      selectedStrategy: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.monthlySurplus !== undefined) {
      const surplus = parseFloat(body.monthlySurplus);
      if (!isNaN(surplus) && surplus >= 0) {
        updateData.monthlySurplus = surplus;
      }
    }

    if (body.monthlyIncome !== undefined) {
      if (body.monthlyIncome === null || body.monthlyIncome === '') {
        updateData.monthlyIncome = null;
      } else {
        const income = parseFloat(body.monthlyIncome);
        if (!isNaN(income) && income >= 0) {
          updateData.monthlyIncome = income;
        }
      }
    }

    if (body.selectedStrategy !== undefined) {
      const validStrategies = ['avalanche', 'snowball', 'fastest', 'balanced'];
      if (validStrategies.includes(body.selectedStrategy)) {
        updateData.selectedStrategy = body.selectedStrategy;
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        monthlySurplus: true,
        monthlyIncome: true,
        selectedStrategy: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user profile' }, { status: 500 });
  }
}
