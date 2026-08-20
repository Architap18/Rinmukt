import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, monthlySurplus } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        monthlySurplus: monthlySurplus ? parseFloat(monthlySurplus) : 3000,
      },
    });

    const token = await signToken({ userId: user.id, email: user.email });
    setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlySurplus: user.monthlySurplus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
