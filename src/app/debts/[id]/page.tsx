'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, IndianRupee, Calendar, CheckCircle2, History, PlusCircle, Trash2, Globe } from 'lucide-react';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';
import { VoiceExplanationPlayer } from '@/components/VoiceExplanationPlayer';
import { useLanguage } from '@/context/LanguageContext';
import { Language, languageNames } from '@/lib/translations';
import { generateDeterministicDebtExplanation } from '@/lib/explanationService';

interface PaymentLog {
  id: string;
  amountPaid: number;
  paidAt: string;
  notes: string | null;
}

interface DebtDetail {
  id: string;
  lenderName: string;
  lenderType: string;
  principalAmount: number;
  remainingBalance: number;
  interestDescription?: string | null;
  interestType: string;
  interestRate: number;
  startDate?: string | null;
  durationMonths: number;
  repaymentExpectation: string;
  socialWeight: string;
  effectiveAnnualCost: number;
  monthlyBleed: number;
  urgencyTier: 'high' | 'medium' | 'low';
  financialUrgency?: 'high' | 'medium' | 'low';
  relationalUrgency?: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
  paymentLogs: PaymentLog[];
}

export default function DebtDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDebt = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/debts/${params.id}`);
      if (!res.ok) {
        router.push('/debts');
        return;
      }
      const data = await res.json();
      setDebt(data.debt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebt();
  }, [params.id]);

  const explanation = useMemo(() => {
    if (!debt) return '';
    return generateDeterministicDebtExplanation(
      {
        lenderName: debt.lenderName,
        lenderType: debt.lenderType,
        principalAmount: debt.principalAmount,
        remainingBalance: debt.remainingBalance,
        interestType: debt.interestType,
        interestRate: debt.interestRate,
        effectiveAnnualCost: debt.effectiveAnnualCost,
        monthlyBleed: debt.monthlyBleed,
        financialUrgency: debt.urgencyTier,
        relationalUrgency: debt.socialWeight,
        isEstimated: !!debt.startDate,
      },
      language
    );
  }, [debt, language]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid || parseFloat(amountPaid) <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/debts/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid, notes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to log payment');
      }

      setAmountPaid('');
      setNotes('');
      fetchDebt();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !debt) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading Debt Details...
        </div>
      </div>
    );
  }

  const paidAmount = debt.principalAmount - debt.remainingBalance;
  const progressPct = debt.principalAmount > 0 ? (paidAmount / debt.principalAmount) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Back Button & Language Selector */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/debts"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Comparison Table
        </Link>

        <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-xl border border-border shadow-xs">
          <Globe className="w-4 h-4 text-primary" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-1 py-1"
            aria-label="Language"
          >
            {Object.entries(languageNames).map(([key, langMeta]) => (
              <option key={key} value={key} className="bg-card text-foreground">
                {langMeta.native} ({langMeta.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              {debt.lenderName}
            </h1>
            <LenderTypeBadge lenderType={debt.lenderType} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground italic">"{debt.repaymentExpectation}"</p>
        </div>

        <div className="flex items-center gap-2">
          <UrgencyBadge urgencyTier={debt.urgencyTier} eac={debt.effectiveAnnualCost} />
          <SocialWeightBadge socialWeight={debt.socialWeight} lenderType={debt.lenderType} />
        </div>
      </div>

      {/* AI Voice Explanation Card */}
      <VoiceExplanationPlayer
        text={explanation}
        language={language}
        title={`Plain Language Explanation for ${debt.lenderName}`}
        isHighConfidence={true}
      />

      {/* Progress & Balance Bar */}
      <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Remaining Balance</div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mt-1">
              ₹{debt.remainingBalance.toLocaleString('en-IN')}{' '}
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground">/ ₹{debt.principalAmount.toLocaleString('en-IN')} original</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Effective Annual Cost
              <span className="block text-[10px] lowercase text-amber-600 font-bold">true yearly cost</span>
            </div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{debt.effectiveAnnualCost}% <span className="text-xs font-normal text-muted-foreground">/ yr</span></div>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-bold text-muted-foreground">
          <span>₹{paidAmount.toLocaleString('en-IN')} paid ({Math.round(progressPct)}%)</span>
          <span>₹{debt.remainingBalance.toLocaleString('en-IN')} remaining</span>
        </div>
      </div>

      {/* Overview Cards: Financial & Relational Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
          <div className="text-xs font-bold text-muted-foreground uppercase">Monthly Bleed</div>
          <div className="font-display text-xl font-extrabold text-destructive mt-1">
            ₹{debt.monthlyBleed.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">/ mo</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">Interest draining away</div>
        </div>

        <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
          <div className="text-xs font-bold text-muted-foreground uppercase">Interest Model</div>
          <div className="font-display text-base font-bold text-foreground mt-1 capitalize">
            {debt.interestType.replace(/_/g, ' ')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{debt.interestRate}% stated rate</div>
        </div>

        <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Start Date</div>
          <div className="font-display text-base font-bold text-foreground mt-1">
            {debt.startDate
              ? new Date(debt.startDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })
              : new Date(debt.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Estimated loan origin</div>
        </div>

        <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Relational Priority</div>
          <div className="mt-1">
            <SocialWeightBadge socialWeight={debt.socialWeight} lenderType={debt.lenderType} />
          </div>
        </div>
      </div>

      {debt.interestDescription && (
        <div className="rounded-2xl bg-muted/40 p-4 border border-border text-xs text-muted-foreground">
          <strong className="text-foreground font-semibold">Original Description:</strong> "{debt.interestDescription}"
        </div>
      )}

      {/* Grid: Log Payment Form + Payment Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form: Log New Payment */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Log a Payment
          </h3>

          {debt.remainingBalance <= 0 ? (
            <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300 text-center">
              This debt has been completely paid off!
            </div>
          ) : (
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Amount Paid (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Paid cash installment"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </form>
          )}
        </div>

        {/* History: Past Payments Log */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            Payment History
          </h3>

          {debt.paymentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No payments logged yet for this debt.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {debt.paymentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      ₹{log.amountPaid.toLocaleString('en-IN')}
                    </div>
                    {log.notes && <div className="text-[11px] text-muted-foreground">{log.notes}</div>}
                  </div>
                  <div className="text-muted-foreground font-mono text-[11px]">
                    {new Date(log.paidAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
