'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, ShieldAlert, RefreshCw, Mic } from 'lucide-react';
import { ExtractedDebt } from '@/lib/llmExtraction';
import { inferSocialWeight } from '@/lib/llmExtraction';
import { ClarificationModal } from '@/components/ClarificationModal';
import { VoiceInput } from '@/components/VoiceInput';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';
import { useLanguage } from '@/context/LanguageContext';
import { calculateEffectiveAnnualCost, calculateMonthlyBleed, calculateUrgencyTier } from '@/lib/debtMath';
import { useAuth } from '@/context/AuthContext';

export default function NewDebtPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading, isAuthenticated, createDebt } = useAuth();

  const [inputText, setInputText] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<ExtractedDebt | null>(null);
  const [showClarification, setShowClarification] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const sampleInputs = [
    'Sabziwale ko 2000 dena hai, jab paisa aaye tab de dunga',
    'Chacha se 5000 liye, koi interest nahi',
    'Moneylender se 10000 liya, 5% per month',
    'BNPL app 8000 balance 3% monthly compound',
    'Kirana store 3500 udhar 10% rate',
  ];

  const handleExtract = async (textToExtract?: string) => {
    const query = textToExtract || inputText;
    if (!query.trim()) return;

    setExtracting(true);
    setExtractError(null);
    setExtracted(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      });

      let data: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      if (!res.ok) throw new Error(data.error || 'Failed to parse debt input');

      const result: ExtractedDebt = data.extraction;
      setExtracted(result);

      if (result.ambiguous) {
        setShowClarification(true);
      }
    } catch (err: any) {
      setExtractError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveDebt = async () => {
    if (!extracted || !user) return;
    if (extracted.ambiguous) {
      setShowClarification(true);
      return;
    }

    setSaving(true);
    try {
      const principal = extracted.principalAmount || 0;
      const rate = extracted.interestRate ?? 0;
      const duration = extracted.durationMonths ?? 12;
      const resolvedSocialWeight = extracted.socialWeight || inferSocialWeight(extracted.lenderType);

      let parsedStartDate = new Date().toISOString();
      if (extracted.startDate) {
        const parsed = new Date(extracted.startDate);
        if (!isNaN(parsed.getTime())) parsedStartDate = parsed.toISOString();
      }

      createDebt({
        lenderName: extracted.lenderName,
        lenderType: extracted.lenderType,
        principalAmount: principal,
        remainingBalance: principal,
        interestDescription: extracted.repaymentExpectation || null,
        interestType: extracted.interestType || 'none',
        interestRate: rate,
        startDate: parsedStartDate,
        durationMonths: duration,
        repaymentExpectation: extracted.repaymentExpectation || 'Repay as agreed',
        socialWeight: resolvedSocialWeight,
        effectiveAnnualCost: previewEac,
        monthlyBleed: previewBleed,
        urgencyTier: previewUrgency,
        financialUrgency: previewUrgency,
        relationalUrgency: 'low',
        status: 'active',
      });

      router.push('/debts');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute live EAC and bleed preview
  const previewEac = extracted
    ? calculateEffectiveAnnualCost(
        extracted.principalAmount,
        extracted.interestType,
        extracted.interestRate || 0,
        extracted.durationMonths
      )
    : 0;

  const previewBleed = extracted
    ? calculateMonthlyBleed(
        extracted.principalAmount,
        extracted.interestType,
        extracted.interestRate || 0,
        extracted.durationMonths
      )
    : 0;

  const previewUrgency = calculateUrgencyTier(previewEac);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {t('addTitle') || 'Add Informal Debt'}
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground font-medium">
          {t('voiceInputSubtitle') || 'Describe the loan in your own words (Hindi, English, or Hinglish). The AI extracts language, and our deterministic math engine calculates the true Effective Annual Cost (EAC).'}
        </p>
      </div>

      {/* Voice Intake or Free-text Intake Form */}
      {showVoice ? (
        <VoiceInput
          onTranscriptAccepted={(transcript) => {
            setInputText(transcript);
            setShowVoice(false);
            handleExtract(transcript);
          }}
          onCancel={() => setShowVoice(false)}
        />
      ) : (
        <div className="rounded-3xl bg-card p-6 sm:p-7 shadow-sm border border-border space-y-5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('whoDoYouOwe') || 'Describe Lender & Repayment Terms'}
            </label>
            <button
              type="button"
              onClick={() => setShowVoice(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm hover:bg-amber-500/20 transition-colors"
            >
              <Mic className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>{t('voiceStartLabel') || 'Speak Debt Aloud'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('voiceFallbackPlaceholder') || 'e.g. Moneylender se 10000 liya 5% per month, har mahine byaj dena hai...'}
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm sm:text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
            />
          </div>

          {/* Sample Hinglish Chips */}
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">Or tap a quick example:</div>
            <div className="flex flex-wrap gap-2">
              {sampleInputs.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(sample);
                    handleExtract(sample);
                  }}
                  className="rounded-xl bg-muted px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-colors text-left"
                >
                  &quot;{sample}&quot;
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowVoice(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 py-3 px-4 text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors min-h-[48px]"
            >
              <Mic className="w-5 h-5 text-amber-600" />
              <span>Speak via Voice</span>
            </button>

            <button
              type="button"
              onClick={() => handleExtract()}
              disabled={extracting || !inputText.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 py-3 px-4 text-sm sm:text-base font-bold text-white shadow-md transition-opacity disabled:opacity-50 min-h-[48px]"
            >
              {extracting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Calculating EAC...</span>
                </>
              ) : (
                <span>Analyze &amp; Calculate EAC</span>
              )}
            </button>
          </div>

          {extractError && (
            <div className="rounded-xl bg-destructive/10 p-3.5 text-xs sm:text-sm font-bold text-destructive border border-destructive/20">
              {extractError}
            </div>
          )}
        </div>
      )}

      {/* Extracted Card & Deterministic Normalization Preview */}
      {extracted && (
        <div className="rounded-2xl bg-card p-6 shadow-md border border-primary/30 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Normalized Extraction Preview</span>
              <h2 className="font-display text-2xl font-bold text-foreground">{extracted.lenderName}</h2>
            </div>
            <LenderTypeBadge lenderType={extracted.lenderType} />
          </div>

          {/* Ambiguity Alert Banner */}
          {extracted.ambiguous && (
            <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Clarification Required</h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  {extracted.clarificationQuestion || 'Interest rate or timeframe is ambiguous. You must resolve terms before saving.'}
                </p>
                <button
                  onClick={() => setShowClarification(true)}
                  className="mt-2 text-xs font-bold text-primary underline"
                >
                  Resolve Terms Now
                </button>
              </div>
            </div>
          )}

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-background p-4 border border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Principal Borrowed</div>
              <div className="font-display text-2xl font-extrabold text-foreground mt-1">
                {'\u20b9'}{extracted.principalAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Original principal amount</div>
            </div>

            <div className="rounded-xl bg-background p-4 border border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Effective Annual Cost (EAC)</div>
              <div className="font-display text-2xl font-extrabold text-primary mt-1">
                {previewEac}% <span className="text-xs font-normal text-muted-foreground">/ yr</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Annualized interest cost</div>
            </div>

            <div className="rounded-xl bg-background p-4 border border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Monthly Rupee Bleed</div>
              <div className="font-display text-2xl font-extrabold text-destructive mt-1">
                {'\u20b9'}{previewBleed.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">/ mo</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Rupee cost per month</div>
            </div>
          </div>

          {/* Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Financial Urgency Signal (EAC &amp; Bleed)</div>
              <UrgencyBadge urgencyTier={previewUrgency} eac={previewEac} />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Relational Urgency Signal (Social Weight)</div>
              <SocialWeightBadge socialWeight={extracted.socialWeight} lenderType={extracted.lenderType} />
            </div>
          </div>

          {/* Start Date & Repayment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-background p-3 border border-border">
              <span className="text-muted-foreground font-semibold">Estimated Start Date:</span>{' '}
              <strong className="text-foreground">
                {new Date(extracted.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
            <div className="rounded-xl bg-background p-3 border border-border">
              <span className="text-muted-foreground font-semibold">Repayment Terms:</span>{' '}
              <strong className="text-foreground">{extracted.repaymentExpectation}</strong>
            </div>
          </div>

          {/* Original Text */}
          <div className="rounded-xl bg-muted/50 p-4 border border-border text-xs text-muted-foreground">
            <strong className="text-foreground">Original Text Description:</strong> &quot;{inputText}&quot;
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setExtracted(null)}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveDebt}
              disabled={saving || extracted.ambiguous}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save &amp; Normalize Debt
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {extracted && (
        <ClarificationModal
          isOpen={showClarification}
          question={extracted.clarificationQuestion || 'Please select the exact interest terms for this debt.'}
          extracted={extracted}
          onResolved={(updated) => {
            setExtracted(updated);
            setShowClarification(false);
          }}
          onCancel={() => setShowClarification(false)}
        />
      )}
    </div>
  );
}
