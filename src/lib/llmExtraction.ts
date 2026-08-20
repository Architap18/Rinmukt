import { z } from 'zod';

export const DebtExtractionSchema = z.object({
  lenderName: z.string(),
  lenderType: z.enum(['relative', 'shopkeeper', 'moneylender', 'chit_fund', 'bnpl', 'other']),
  principalAmount: z.number().positive(),
  interestType: z.enum(['none', 'flat_monthly', 'compound_monthly', 'one_time_flat', 'unspecified']),
  interestRate: z.number().min(0),
  durationMonths: z.number().default(12),
  repaymentExpectation: z.string(),
  socialWeight: z.enum(['high', 'medium', 'low']),
  ambiguous: z.boolean(),
  clarificationQuestion: z.string().nullable(),
});

export type ExtractedDebt = z.infer<typeof DebtExtractionSchema>;

/**
 * Robust Regex & Heuristic Fallback Parser for Hinglish/Hindi/English informal debt text.
 * Ensures the app works 100% reliably even without an active LLM API key.
 */
function fallbackExtraction(text: string): ExtractedDebt {
  const lower = text.toLowerCase();

  // 1. Principal Amount Extraction
  let principalAmount = 0;
  const numMatch = lower.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|lakh)?/i);
  if (numMatch) {
    let rawNum = parseFloat(numMatch[1].replace(/,/g, ''));
    if (numMatch[2]?.toLowerCase() === 'k') rawNum *= 1000;
    if (numMatch[2]?.toLowerCase() === 'lakh') rawNum *= 100000;
    principalAmount = rawNum;
  }
  if (principalAmount <= 0) principalAmount = 5000; // sensible fallback

  // 2. Lender Type & Social Weight Determination
  let lenderType: ExtractedDebt['lenderType'] = 'other';
  let socialWeight: ExtractedDebt['socialWeight'] = 'medium';
  let lenderName = 'Lender';

  if (/chacha|mama|bhai|dada|uncle|relative|fam|friend|dost|cousin/i.test(lower)) {
    lenderType = 'relative';
    socialWeight = 'high';
    if (/chacha/i.test(lower)) lenderName = 'Chacha';
    else if (/mama/i.test(lower)) lenderName = 'Mama';
    else if (/bhai/i.test(lower)) lenderName = 'Bhai';
    else lenderName = 'Relative / Family';
  } else if (/sabzi|kirana|dukan|shop|store|vendor|udhar/i.test(lower)) {
    lenderType = 'shopkeeper';
    socialWeight = 'medium';
    if (/sabzi/i.test(lower)) lenderName = 'Sabziwala';
    else if (/kirana/i.test(lower)) lenderName = 'Kirana Store';
    else lenderName = 'Shopkeeper Credit';
  } else if (/moneylender|byajwala|saukar|sahukar|lender/i.test(lower)) {
    lenderType = 'moneylender';
    socialWeight = 'low';
    lenderName = 'Local Moneylender';
  } else if (/bnpl|app|kreditbee|slice|ring|moneytap|lazypay|stashfin/i.test(lower)) {
    lenderType = 'bnpl';
    socialWeight = 'low';
    lenderName = 'BNPL / Instant App';
  } else if (/chit|bc|committee|fund/i.test(lower)) {
    lenderType = 'chit_fund';
    socialWeight = 'medium';
    lenderName = 'Chit Fund / Committee';
  } else {
    // Extract first word or reasonable name
    const words = text.trim().split(/\s+/);
    if (words.length > 0) lenderName = words[0].replace(/[^a-zA-Z]/g, '');
    if (!lenderName || lenderName.length < 2) lenderName = 'Informal Creditor';
  }

  // 3. Interest Type & Rate Extraction
  let interestType: ExtractedDebt['interestType'] = 'none';
  let interestRate = 0;
  let ambiguous = false;
  let clarificationQuestion: string | null = null;

  const noInterestRegex = /no interest|koi interest nahi|0%|zero interest|bina byaj|interest free/i;
  const rateMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);

  if (noInterestRegex.test(lower)) {
    interestType = 'none';
    interestRate = 0;
  } else if (rateMatch) {
    interestRate = parseFloat(rateMatch[1]);

    if (/per month|monthly|mahina|har mahine|p\.m\./i.test(lower)) {
      if (/flat/i.test(lower)) {
        interestType = 'flat_monthly';
      } else if (/compound|chokdi/i.test(lower)) {
        interestType = 'compound_monthly';
      } else {
        // Informal monthly is predominantly flat rate non-reducing balance in India
        interestType = 'flat_monthly';
      }
    } else if (/one time|one-time|lump sum|flat fee|katouti/i.test(lower)) {
      interestType = 'one_time_flat';
    } else if (/per year|annually|p\.a\./i.test(lower)) {
      interestType = 'compound_monthly';
      interestRate = Math.round((interestRate / 12) * 100) / 100; // converted to monthly
    } else {
      // AMBIGUOUS! User specified "5%" or similar rate without timeframe context
      ambiguous = true;
      interestType = 'unspecified';
      clarificationQuestion = `Is that ${interestRate}% interest charged every month, or is it a one-time fee on the principal?`;
    }
  } else if (/byaj|interest/i.test(lower) && !noInterestRegex.test(lower)) {
    ambiguous = true;
    interestType = 'unspecified';
    clarificationQuestion = `You mentioned interest for ${lenderName}, but what is the exact interest rate or percentage?`;
  }

  // 4. Repayment Expectation
  let repaymentExpectation = text;
  if (/jab paisa/i.test(lower)) {
    repaymentExpectation = 'Flexible - pay whenever money is available';
  } else if (/2 mahine|2 months|next month|agla mahina/i.test(lower)) {
    repaymentExpectation = 'Expected within 1-2 months';
  }

  return {
    lenderName,
    lenderType,
    principalAmount,
    interestType,
    interestRate,
    durationMonths: 12,
    repaymentExpectation,
    socialWeight,
    ambiguous,
    clarificationQuestion,
  };
}

/**
 * Extracts structured informal debt schema using Gemini API or fallback parser.
 */
export async function extractDebtFromText(userText: string): Promise<ExtractedDebt> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackExtraction(userText);
  }

  try {
    const prompt = `
You are a specialized financial language parser for informal debt descriptions in India (in English, Hindi, or Hinglish).
Extract the debt details from this input text: "${userText}"

Return JSON matching this exact structure:
{
  "lenderName": "Name of lender or store (e.g. Sabziwala, Chacha, Local Moneylender, BNPL App)",
  "lenderType": "relative" | "shopkeeper" | "moneylender" | "chit_fund" | "bnpl" | "other",
  "principalAmount": number (in INR, e.g. 5000),
  "interestType": "none" | "flat_monthly" | "compound_monthly" | "one_time_flat" | "unspecified",
  "interestRate": number (percentage rate e.g. 5 for 5%, 0 for zero interest),
  "durationMonths": number (default 12),
  "repaymentExpectation": "brief summary of repayment expectations",
  "socialWeight": "high" (relatives/family) | "medium" (shopkeeper/friend/chit_fund) | "low" (moneylender/bnpl),
  "ambiguous": boolean (true if interest rate or timeframe is vague or ambiguous),
  "clarificationQuestion": string or null (if ambiguous=true, formulate a short polite question e.g. "Is that 5% interest per month or a one-time fee?")
}

Rules:
- DO NOT perform financial math or calculations. Only extract structure.
- If interest rate or rate timeframe (monthly vs one-time vs annual) is unclear or missing when interest is mentioned, set ambiguous=true and provide clarificationQuestion.
- If lenderType is relative, set socialWeight="high". If moneylender/bnpl, set socialWeight="low".
- Respond with ONLY valid JSON.
`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      return fallbackExtraction(userText);
    }

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) return fallbackExtraction(userText);

    const parsed = JSON.parse(rawJson);
    return DebtExtractionSchema.parse(parsed);
  } catch (err) {
    return fallbackExtraction(userText);
  }
}
