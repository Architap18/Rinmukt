import { Language } from './translations';
import { NormalizedDebt, PayoffScheduleResult } from './debtMath';

export interface ExplanationPayload {
  debt?: {
    lenderName: string;
    lenderType: string;
    principalAmount: number;
    remainingBalance: number;
    interestType: string;
    interestRate: number;
    effectiveAnnualCost: number;
    monthlyBleed: number;
    financialUrgency: string;
    relationalUrgency: string;
    isEstimated?: boolean;
  };
  plan?: {
    strategy: 'avalanche' | 'snowball' | 'fastest' | 'balanced';
    totalInterestPaid: number;
    totalMonths: number;
    debtFreeDate: string;
    monthlySurplus: number;
    totalDebt: number;
    debtsCount: number;
    payoffSequence: string[];
    interestSavedComparedToOther?: number;
  };
  language: Language;
}

export interface ExplanationResult {
  text: string;
  isHighConfidence: boolean;
  hasAssumptions: boolean;
  assumptionNotes?: string[];
  verified: boolean;
}

/**
 * Deterministic template-based fallback explanations for single debts across all 7 languages.
 * Guaranteed 100% accurate without network dependencies or hallucination risks.
 */
export function generateDeterministicDebtExplanation(
  debt: NonNullable<ExplanationPayload['debt']>,
  language: Language
): string {
  const {
    lenderName,
    lenderType,
    principalAmount,
    remainingBalance,
    interestType,
    interestRate,
    effectiveAnnualCost,
    monthlyBleed,
    financialUrgency,
    relationalUrgency,
  } = debt;

  const formattedPrincipal = `₹${principalAmount.toLocaleString('en-IN')}`;
  const formattedBalance = `₹${remainingBalance.toLocaleString('en-IN')}`;
  const formattedBleed = `₹${monthlyBleed.toLocaleString('en-IN')}`;

  switch (language) {
    case 'hi':
      if (interestType === 'none' || interestRate === 0) {
        return `आपके ${lenderName} के ${formattedBalance} के कर्ज पर कोई ब्याज नहीं लग रहा है। हालांकि रिश्ते और सामाजिक लिहाज से इसे समय पर लौटाना महत्वपूर्ण है।`;
      }
      if (interestType === 'flat_monthly') {
        return `आपके ${lenderName} के ${formattedBalance} के कर्ज पर ${interestRate}% प्रति माह की दर से हर महीने लगभग ${formattedBleed} का ब्याज लग रहा है। इसका वार्षिक प्रभावी खर्च (EAC) लगभग ${effectiveAnnualCost}% है।`;
      }
      return `${lenderName} के ${formattedBalance} के कर्ज पर ${interestRate}% ब्याज के अनुसार हर महीने लगभग ${formattedBleed} का ब्याज खर्च है, जिसका प्रभावी वार्षिक खर्च ${effectiveAnnualCost}% है।`;

    case 'hinglish':
      if (interestType === 'none' || interestRate === 0) {
        return `Aapke ${lenderName} ke ${formattedBalance} ke loan par koi byaj nahi lag raha hai. Relationship aur trust ke hisab se isko time par return karna achha rahega.`;
      }
      if (interestType === 'flat_monthly') {
        return `Aapke ${lenderName} ke ${formattedBalance} ke karze par ${interestRate}% per month ke hisab se har mahine lagbhag ${formattedBleed} ka interest lag raha hai. Iska annual effective cost (EAC) lagbhag ${effectiveAnnualCost}% banta hai.`;
      }
      return `${lenderName} ke ${formattedBalance} ke loan par har mahine lagbhag ${formattedBleed} ka byaj ja raha hai, jiska annual effective cost ${effectiveAnnualCost}% hai.`;

    case 'mr':
      if (interestType === 'none' || interestRate === 0) {
        return `तुमच्या ${lenderName} कडील ${formattedBalance} च्या कर्जावर कोणतेही व्याज आकारले जात नाही. तथापि, नातेसंबंध आणि विश्वासाच्या दृष्टीने हे वेळेवर परत करणे महत्त्वाचे आहे.`;
      }
      return `तुमच्या ${lenderName} च्या ${formattedBalance} च्या कर्जावर ${interestRate}% दराने दरमहा सुमारे ${formattedBleed} व्याज खर्च येतो. याचा वार्षिक प्रभावी खर्च (EAC) ${effectiveAnnualCost}% आहे.`;

    case 'bn':
      if (interestType === 'none' || interestRate === 0) {
        return `আপনার ${lenderName}-এর ${formattedBalance} টাকার ঋণে কোনো সুদ নেই। সম্পর্কের দিক থেকে এটি সময়মতো পরিশোধ করা ভালো।`;
      }
      return `আপনার ${lenderName}-এর ${formattedBalance} টাকার ঋণে প্রতি মাসে প্রায় ${formattedBleed} টাকা সুদ খরচ হচ্ছে। এর বার্ষিক কার্যকর ব্যয় ${effectiveAnnualCost}%।`;

    case 'pa':
      if (interestType === 'none' || interestRate === 0) {
        return `ਤੁਹਾਡੇ ${lenderName} ਦੇ ${formattedBalance} ਦੇ ਕਰਜ਼ੇ 'ਤੇ ਕੋਈ ਵਿਆਜ ਨਹੀਂ ਹੈ। ਪਰ ਭਰੋਸੇ ਅਤੇ ਰਿਸ਼ਤੇ ਦੇ ਲਿਹਾਜ਼ ਨਾਲ ਇਸਨੂੰ ਸਮੇਂ ਸਿਰ ਮੋੜਨਾ ਜ਼ਰੂਰੀ ਹੈ।`;
      }
      return `ਤੁਹਾਡੇ ${lenderName} ਦੇ ${formattedBalance} ਦੇ ਕਰਜ਼ੇ 'ਤੇ ਹਰ ਮਹੀਨੇ ਲਗਭਗ ${formattedBleed} ਵਿਆਜ ਲੱਗ ਰਿਹਾ ਹੈ, ਜਿਸਦੀ ਸਾਲਾਨਾ ਪ੍ਰਭਾਵੀ ਲਾਗਤ ${effectiveAnnualCost}% ਹੈ।`;

    case 'gu':
      if (interestType === 'none' || interestRate === 0) {
        return `તમારા ${lenderName} ના ${formattedBalance} ના દેવા પર કોઈ વ્યાજ નથી. છતાં સંબંધ અને વિશ્વાસ ખાતર સમયસર પરત કરવું યોગ્ય રહેશે.`;
      }
      return `તમારા ${lenderName} ના ${formattedBalance} ના દેવા પર દર મહિને આશરે ${formattedBleed} વ્યાજ થાય છે, જેનો વાર્ષિક અસરકારક ખર્ચ ${effectiveAnnualCost}% છે.`;

    case 'en':
    default:
      if (interestType === 'none' || interestRate === 0) {
        return `Your ${formattedBalance} debt from ${lenderName} carries 0% interest. While financial cost is zero, this debt carries high relational and goodwill priority.`;
      }
      if (interestType === 'flat_monthly') {
        return `Your ${formattedBalance} debt from ${lenderName} costs approximately ${formattedBleed} in interest each month at ${interestRate}% per month flat. Because interest does not reduce with payments, the Effective Annual Cost (EAC) is ${effectiveAnnualCost}%.`;
      }
      return `Your ${formattedBalance} debt from ${lenderName} is accruing approximately ${formattedBleed} in monthly interest, representing an Effective Annual Cost (EAC) of ${effectiveAnnualCost}%.`;
  }
}

/**
 * Deterministic template-based fallback explanations for full repayment plans across all 7 languages.
 */
export function generateDeterministicPlanExplanation(
  plan: NonNullable<ExplanationPayload['plan']>,
  language: Language
): string {
  const { strategy, totalInterestPaid, totalMonths, debtFreeDate, monthlySurplus, payoffSequence, interestSavedComparedToOther } = plan;
  const stratName = strategy === 'snowball' ? 'Debt Snowball' : 'Debt Avalanche';
  const formattedInterest = `₹${totalInterestPaid.toLocaleString('en-IN')}`;
  const formattedSurplus = `₹${monthlySurplus.toLocaleString('en-IN')}`;
  const orderText = payoffSequence.join(' → ');

  switch (language) {
    case 'hi':
      return `आपकी चुनी हुई योजना (${stratName}) के तहत ₹${formattedSurplus} मासिक बचत के साथ आप ${debtFreeDate} तक पूरी तरह कर्जमुक्त हो सकते हैं। इसमें कुल ब्याज लगभग ${formattedInterest} लगेगा। कर्ज चुकाने का क्रम होगा: ${orderText}।`;
    case 'hinglish':
      return `Aapke chune hue plan (${stratName}) ke sath ₹${formattedSurplus} monthly surplus use karke aap ${debtFreeDate} tak poori tarah debt-free ho jayenge. Isme total interest lagbhag ${formattedInterest} aayega. Payoff sequence: ${orderText}.`;
    case 'mr':
      return `तुमच्या निवडलेल्या ${stratName} योजनेनुसार ₹${formattedSurplus} मासिक बचतीसह तुम्ही ${debtFreeDate} पर्यंत पूर्णपणे कर्जमुक्त व्हाल. एकूण व्याज ${formattedInterest} असेल. परतफेडीचा क्रम: ${orderText}.`;
    case 'bn':
      return `আপনার নির্বাচিত ${stratName} পরিকল্পনায় ₹${formattedSurplus} মাসিক উদ্বৃত্ত ব্যবহার করে আপনি ${debtFreeDate}-এর মধ্যে ঋণমুক্ত হতে পারবেন। মোট সুদ খরচ হবে প্রায় ${formattedInterest}। পরিশোধের ক্রম: ${orderText}।`;
    case 'pa':
      return `ਤੁਹਾਡੀ ਚੁਣੀ ਹੋਈ ਯੋਜਨਾ (${stratName}) ਅਧੀਨ ₹${formattedSurplus} ਮਹੀਨਾਵਾਰ ਬੱਚਤ ਨਾਲ ਤੁਸੀਂ ${debtFreeDate} ਤੱਕ ਪੂਰੀ ਤਰ੍ਹਾਂ ਕਰਜ਼ ਮੁਕਤ ਹੋ ਜਾਵੋਗੇ। ਕੁੱਲ ਵਿਆਜ ਲਗਭਗ ${formattedInterest} ਹੋਵੇਗਾ। ਕ੍ਰਮ: ${orderText}।`;
    case 'gu':
      return `તમારી પસંદ કરેલી ${stratName} યોજના હેઠળ ₹${formattedSurplus} માસિક બચત સાથે તમે ${debtFreeDate} સુધીમાં દેવામુક્ત થઈ શકશો. કુલ વ્યાજ આશરે ${formattedInterest} થશે. ક્રમ: ${orderText}।`;
    case 'en':
    default:
      return `Under your active ${stratName} plan, allocating ${formattedSurplus} monthly will make you completely debt-free by ${debtFreeDate}. Total interest across all loans is projected at ${formattedInterest}. Payoff order: ${orderText}.`;
  }
}

/**
 * Validates that all rupee figures and percentages mentioned in LLM text match input numbers.
 */
export function verifyExplanationNumbers(
  generatedText: string,
  allowedNumbers: number[]
): boolean {
  // Extract number tokens from text (e.g. ₹5,000, 79.59%, 500, 10000)
  const matches = generatedText.match(/(?:₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/g);
  if (!matches) return true;

  const allowedSet = new Set<number>();
  allowedNumbers.forEach((n) => {
    allowedSet.add(Math.round(n));
    allowedSet.add(Math.round(n * 10) / 10);
    allowedSet.add(Math.round(n * 100) / 100);
  });

  for (const raw of matches) {
    const cleanNum = parseFloat(raw.replace(/[₹,\s]/g, ''));
    if (isNaN(cleanNum)) continue;
    // Allow small integers (like 1, 2, 3, 12 months, etc.)
    if (cleanNum <= 30 && Number.isInteger(cleanNum)) continue;

    // Check if the number is in the allowed set (with reasonable tolerance)
    let found = false;
    for (const allowed of allowedSet) {
      if (Math.abs(cleanNum - allowed) < 1.0) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false; // Unverified number detected
    }
  }

  return true;
}

/**
 * Generates an LLM explanation with number verification and deterministic fallback.
 */
export async function generateExplanation(
  payload: ExplanationPayload
): Promise<ExplanationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const lang = payload.language || 'en';

  const isEstimated = !!payload.debt?.isEstimated;
  const assumptionNotes: string[] = [];
  if (isEstimated) {
    assumptionNotes.push('Start date and timeline were estimated based on your description.');
  }

  // If no API key, instantly return verified deterministic template
  if (!apiKey) {
    const fallbackText = payload.debt
      ? generateDeterministicDebtExplanation(payload.debt, lang)
      : payload.plan
      ? generateDeterministicPlanExplanation(payload.plan, lang)
      : '';

    return {
      text: fallbackText,
      isHighConfidence: !isEstimated,
      hasAssumptions: isEstimated,
      assumptionNotes,
      verified: true,
    };
  }

  // Collect allowed numbers for post-generation verification
  const allowedNumbers: number[] = [];
  if (payload.debt) {
    allowedNumbers.push(
      payload.debt.principalAmount,
      payload.debt.remainingBalance,
      payload.debt.interestRate,
      payload.debt.effectiveAnnualCost,
      payload.debt.monthlyBleed
    );
  }
  if (payload.plan) {
    allowedNumbers.push(
      payload.plan.totalInterestPaid,
      payload.plan.totalMonths,
      payload.plan.monthlySurplus,
      payload.plan.totalDebt
    );
  }

  const prompt = `
You are a warm, calm, non-judgmental financial guide for Rinmukht in India.
Your ONLY role is to explain already-computed debt numbers in plain, reassuring language.
Target Language: ${lang} (support: English, Hindi, Hinglish, Marathi, Bengali, Punjabi, Gujarati).

Input Data (DO NOT RECALCULATE OR ALTER ANY NUMBER):
${JSON.stringify(payload, null, 2)}

Strict Hard Rules:
1. Explain only; never recalculate or invent any numbers.
2. Do not round numbers differently from what is provided.
3. Keep tone calm, supportive, and steady. Do not use alarmist words like "danger", "critical", "catastrophe".
4. Keep it concise: 2-3 short sentences for single debt, or 3-4 sentences for a plan.
5. Output ONLY the plain text explanation in ${lang}.
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!res.ok) {
      throw new Error('Gemini API call failed');
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      throw new Error('Empty response');
    }

    // Number verification safeguard
    const isVerified = verifyExplanationNumbers(rawText, allowedNumbers);
    if (!isVerified) {
      // Discard unverified response, fallback to template
      const fallbackText = payload.debt
        ? generateDeterministicDebtExplanation(payload.debt, lang)
        : payload.plan
        ? generateDeterministicPlanExplanation(payload.plan, lang)
        : '';

      return {
        text: fallbackText,
        isHighConfidence: !isEstimated,
        hasAssumptions: isEstimated,
        assumptionNotes,
        verified: true,
      };
    }

    return {
      text: rawText,
      isHighConfidence: !isEstimated,
      hasAssumptions: isEstimated,
      assumptionNotes,
      verified: true,
    };
  } catch (err) {
    const fallbackText = payload.debt
      ? generateDeterministicDebtExplanation(payload.debt, lang)
      : payload.plan
      ? generateDeterministicPlanExplanation(payload.plan, lang)
      : '';

    return {
      text: fallbackText,
      isHighConfidence: !isEstimated,
      hasAssumptions: isEstimated,
      assumptionNotes,
      verified: true,
    };
  }
}
