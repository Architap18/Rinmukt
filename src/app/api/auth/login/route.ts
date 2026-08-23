import { NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth';
import { isJudgeLogin, resetToSample } from '@/lib/sessionStore';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (!isJudgeLogin(email, password)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const state = resetToSample();
    const token = await signToken({ userId: state.user.id, email: state.user.email });
    setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        monthlySurplus: state.user.monthlySurplus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
