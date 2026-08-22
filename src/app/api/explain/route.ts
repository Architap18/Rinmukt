import { NextResponse } from 'next/server';
import { generateExplanation, ExplanationPayload } from '@/lib/explanationService';

export async function POST(req: Request) {
  try {
    const payload: ExplanationPayload = await req.json();

    if (!payload || (!payload.debt && !payload.plan)) {
      return NextResponse.json({ error: 'Missing debt or plan payload' }, { status: 400 });
    }

    const result = await generateExplanation(payload);
    return NextResponse.json({ explanation: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate explanation' }, { status: 500 });
  }
}
