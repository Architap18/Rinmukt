import { NextResponse } from 'next/server';
import { extractDebtFromText } from '@/lib/llmExtraction';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a description of your debt.' }, { status: 400 });
    }

    const result = await extractDebtFromText(text.trim());
    return NextResponse.json({ extraction: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
  }
}
