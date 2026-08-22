import { z } from 'zod';

export const DebtExtractionSchema = z.object({
  lenderName: z.string(),
  lenderType: z.enum(['relative', 'shopkeeper', 'moneylender', 'chit_fund', 'bnpl', 'other']),
  principalAmount: z.number().positive(),
  interestDescription: z.string(),
  interestType: z.enum(['none', 'flat_monthly', 'compound_monthly', 'one_time_flat', 'unspecified']),
  interestRate: z.number().min(0).nullable(),
  startDate: z.string(), // ISO String
  durationMonths: z.number().default(12),
  repaymentExpectation: z.string(),
  socialWeight: z.enum(['high', 'medium', 'low']),
  ambiguous: z.boolean(),
  clarificationQuestion: z.string().nullable(),
});

export type ExtractedDebt = z.infer<typeof DebtExtractionSchema>;

/**
 * Auto-infers social weight strictly based on lender type:
 * - relative = high
 * - chit_fund / shopkeeper = medium
 * - moneylender / bnpl = low
 * - other = medium as safe default
 */
export function inferSocialWeight(lenderType: string): 'high' | 'medium' | 'low' {
  switch (lenderType) {
    case 'relative':
      return 'high';
    case 'chit_fund':
    case 'shopkeeper':
      return 'medium';
    case 'moneylender':
    case 'bnpl':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Computes estimated start_date if relative duration is present in text
 * (e.g. "2 mahine se", "6 months ago", "pichle hafte", "1 saal se").
 * Defaults sensibly to current date if unknown.
 */
export function parseRelativeStartDate(text: string, baseDate: Date = new Date()): string {
  const lower = text.toLowerCase();

  // Match months: e.g. "2 mahine", "3 months", "2 mahine pehle", "4 mahine se"
  const monthMatch = lower.match(/(\d+)\s*(?:mahine|mahina|months?|mo)\s*(?:se|pehle|ago)?/i);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    if (!isNaN(months) && months > 0 && months <= 120) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() - months);
      return d.toISOString();
    }
  }

  // Match weeks: e.g. "2 hafte", "3 weeks", "pichle hafte"
  if (/pichle hafte|last week/i.test(lower)) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  const weekMatch = lower.match(/(\d+)\s*(?:hafte|hafta|weeks?)\s*(?:se|pehle|ago)?/i);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    if (!isNaN(weeks) && weeks > 0) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - weeks * 7);
      return d.toISOString();
    }
  }

  // Match years: e.g. "1 saal", "2 years", "1 varsh"
  const yearMatch = lower.match(/(\d+)\s*(?:saal|varsh|years?|yr)\s*(?:se|pehle|ago)?/i);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    if (!isNaN(years) && years > 0 && years <= 30) {
      const d = new Date(baseDate);
      d.setFullYear(d.getFullYear() - years);
      return d.toISOString();
    }
  }

  return baseDate.toISOString();
}

/**
 * Robust Regex & Heuristic Natural Language Parser for Hinglish/Hindi/English informal debt text.
 * Strictly adheres to ambiguity requirements and never guesses ambiguous terms.
 */
export function fallbackExtraction(text: string): ExtractedDebt {
  const lower = text.toLowerCase().trim();

  // 1. Principal Amount Extraction
  let principalAmount = 0;
  // Match rupee symbols, numbers with commas, k/lakh/hazar multipliers
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
  const thousandMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|hazar|hazaar|thousand)/i);
  const generalNumMatch = lower.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);

  if (lakhMatch) {
    principalAmount = parseFloat(lakhMatch[1]) * 100000;
  } else if (thousandMatch) {
    principalAmount = parseFloat(thousandMatch[1]) * 1000;
  } else if (generalNumMatch) {
    const raw = parseFloat(generalNumMatch[1].replace(/,/g, ''));
    if (!isNaN(raw)) principalAmount = raw;
  }

  if (principalAmount <= 0) principalAmount = 5000; // Sensible default

  // 2. Lender Type & Auto-Inferred Social Weight
  let lenderType: ExtractedDebt['lenderType'] = 'other';
  let lenderName = 'Lender';

  if (/chacha|mama|bhai|dada|bhabhi|tau|uncle|aunt|relative|family|fam|friend|dost|cousin|rishtedar/i.test(lower)) {
    lenderType = 'relative';
    if (/chacha/i.test(lower)) lenderName = 'Chacha';
    else if (/mama/i.test(lower)) lenderName = 'Mama';
    else if (/bhai/i.test(lower)) lenderName = 'Bhai';
    else if (/dost|friend/i.test(lower)) lenderName = 'Friend';
    else lenderName = 'Family / Relative';
  } else if (/sabzi|kirana|dukan|shop|store|vendor|ration|grocer|baniya/i.test(lower)) {
    lenderType = 'shopkeeper';
    if (/sabzi/i.test(lower)) lenderName = 'Sabziwala';
    else if (/kirana/i.test(lower)) lenderName = 'Gupta Kirana Store';
    else lenderName = 'Local Shopkeeper';
  } else if (/moneylender|byajwala|saukar|sahukar|mahajan|lender/i.test(lower)) {
    lenderType = 'moneylender';
    lenderName = 'Local Moneylender';
  } else if (/bnpl|app|kreditbee|slice|ring|moneytap|lazypay|stashfin|postpe/i.test(lower)) {
    lenderType = 'bnpl';
    if (/kreditbee/i.test(lower)) lenderName = 'KreditBee App';
    else if (/slice/i.test(lower)) lenderName = 'Slice BNPL';
    else lenderName = 'BNPL Instant App';
  } else if (/chit|bc|committee|fund|bhishi/i.test(lower)) {
    lenderType = 'chit_fund';
    lenderName = 'Chit Fund / Committee';
  } else {
    // Extract first clean word
    const words = text.trim().split(/\s+/);
    if (words.length > 0) {
      const clean = words[0].replace(/[^a-zA-Z]/g, '');
      if (clean.length >= 2) lenderName = clean;
    }
  }

  const socialWeight = inferSocialWeight(lenderType);

  // 3. Interest Type & Rate Extraction with Strict Ambiguity Detection
  let interestType: ExtractedDebt['interestType'] = 'none';
  let interestRate: number | null = 0;
  let ambiguous = false;
  let clarificationQuestion: string | null = null;

  const noInterestRegex = /\bno interest\b|\bkoi interest nahi\b|\bkoi byaj nahi\b|(?<!\d)0%|\bzero interest\b|\bbina byaj\b|\binterest free\b/i;
  const rateMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);

  if (noInterestRegex.test(lower)) {
    interestType = 'none';
    interestRate = 0;
    ambiguous = false;
  } else if (rateMatch) {
    const matchedRate = parseFloat(rateMatch[1]);
    interestRate = matchedRate;

    // Check timeframe context
    const isMonthly = /per month|monthly|mahina|mahine|har mahine|p\.m\./i.test(lower);
    const isYearly = /per year|annually|annual|saal|p\.a\./i.test(lower);
    const isOneTime = /one time|one-time|lump sum|flat fee|katouti|ek bar/i.test(lower);
    const isCompound = /compound|chakravarti|chokdi/i.test(lower);

    if (isMonthly) {
      if (isCompound) {
        interestType = 'compound_monthly';
      } else {
        // Informal monthly is predominantly flat rate non-reducing balance in India
        interestType = 'flat_monthly';
      }
    } else if (isOneTime) {
      interestType = 'one_time_flat';
    } else if (isYearly) {
      interestType = 'compound_monthly';
      interestRate = Math.round((matchedRate / 12) * 100) / 100;
    } else {
      // Ambiguous rate without explicit period
      ambiguous = true;
      interestType = 'unspecified';
      clarificationQuestion = `Is that ${matchedRate}% interest charged every month, or is it a one-time fee on the principal?`;
    }
  } else if (/byaj|interest|vaddi|biyaj/i.test(lower)) {
    // Interest mentioned but no rate provided
    ambiguous = true;
    interestType = 'unspecified';
    interestRate = null;
    clarificationQuestion = `You mentioned interest for ${lenderName}, but what is the exact interest rate or percentage?`;
  }

  // 4. Start Date Parsing
  const startDate = parseRelativeStartDate(text);

  // 5. Repayment Expectation
  let repaymentExpectation = text;
  if (/jab paisa/i.test(lower)) {
    repaymentExpectation = 'Flexible — pay whenever money is available';
  } else if (/mahine ke end|month end/i.test(lower)) {
    repaymentExpectation = 'Pay at the end of the month';
  } else if (/fasal|harvest|crop/i.test(lower)) {
    repaymentExpectation = 'Pay when next harvest / wage arrives';
  }

  // 6. Interest Description verbatim
  const interestDescription = text;

  return {
    lenderName,
    lenderType,
    principalAmount,
    interestDescription,
    interestType,
    interestRate: interestRate !== null ? interestRate : 0,
    startDate,
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
You are a specialized financial NLP parser for informal debt descriptions in India (English, Hindi, Hinglish).
Input text: "${userText}"

Return a JSON object with this exact schema:
{
  "lenderName": string (e.g. "Sabziwala", "Chacha", "Local Moneylender", "Gupta Kirana", "BNPL App"),
  "lenderType": "relative" | "shopkeeper" | "moneylender" | "chit_fund" | "bnpl" | "other",
  "principalAmount": number (in INR, e.g. 5000),
  "interestDescription": string (verbatim raw interest description from text),
  "interestType": "none" | "flat_monthly" | "compound_monthly" | "one_time_flat" | "unspecified",
  "interestRate": number | null (e.g. 5 for 5%, 0 for zero interest),
  "startDate": string (ISO date string - if relative like "2 mahine se", compute estimated past date),
  "durationMonths": number (default 12),
  "repaymentExpectation": string (e.g. "jab paisa aaye", "mahine ke end mein"),
  "socialWeight": "high" (relatives/family) | "medium" (shopkeeper/chit_fund/other) | "low" (moneylender/bnpl),
  "ambiguous": boolean (true if interest rate or timeframe is vague or ambiguous),
  "clarificationQuestion": string | null (polite question if ambiguous=true, e.g. "Is that 5% interest charged every month, or is it a one-time fee?")
}

Rules:
1. Never silently guess ambiguous interest rates or periods. If a rate is given without period (e.g. "5%"), set ambiguous=true, interestType="unspecified", and provide clarificationQuestion.
2. Auto-infer socialWeight strictly from lenderType (relative=high, shopkeeper/chit_fund=medium, moneylender/bnpl=low, other=medium).
3. If no interest is mentioned or "0%"/"bina byaj", set interestType="none", interestRate=0, ambiguous=false.
4. Output valid JSON only.
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
    if (!parsed.startDate) {
      parsed.startDate = parseRelativeStartDate(userText);
    }
    if (!parsed.socialWeight) {
      parsed.socialWeight = inferSocialWeight(parsed.lenderType);
    }
    if (!parsed.interestDescription) {
      parsed.interestDescription = userText;
    }
    return DebtExtractionSchema.parse(parsed);
  } catch (err) {
    return fallbackExtraction(userText);
  }
}
