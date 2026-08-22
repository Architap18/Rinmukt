'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Table as TableIcon,
  Trash2,
  ArrowUpRight,
  IndianRupee,
  HelpCircle,
  ShieldCheck,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';
import { TrustNotice } from '@/components/TrustNotice';
import { VoiceExplanationPlayer } from '@/components/VoiceExplanationPlayer';
import { useLanguage } from '@/context/LanguageContext';
import { Language, languageNames } from '@/lib/translations';
import { generateDeterministicDebtExplanation } from '@/lib/explanationService';

interface Debt {
  id: string;
  lenderName: string;
  lenderType: string;
  principalAmount: number;
  remainingBalance: number;
  interestType: string;
  interestRate: number;
  repaymentExpectation: string;
  socialWeight: string;
  effectiveAnnualCost: number;
  monthlyBleed: number;
  urgencyTier: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
}

export default function DebtsComparisonPage() {
  const { language, setLanguage, t } = useLanguage();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/debts');
      const data = await res.json();
      setDebts(data.debts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      fetchDebts();
    } catch (err) {
      alert('Failed to delete debt');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading Debt Comparison Table...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t('comparisonTitle') || 'Unified Debt Comparison Table'}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground font-medium">
            {t('comparisonSubtitle') || 'All informal debts normalized into a single comparable true yearly cost (EAC).'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/debts/new"
            className="flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all min-h-[46px]"
          >
            <PlusCircle className="w-5 h-5" />
            {t('navAddDebt') || 'Add Debt'}
          </Link>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="rounded-3xl bg-card p-12 text-center text-muted-foreground space-y-4 border border-border">
          <TableIcon className="mx-auto h-14 w-14 text-muted-foreground/50" />
          <h3 className="text-xl font-bold text-foreground">{t('emptyTitle') || 'No debts registered'}</h3>
          <p className="text-sm max-w-md mx-auto text-muted-foreground">
            {t('emptySubtext') || 'Add informal loans to compare their true annual costs side-by-side.'}
          </p>
          <Link
            href="/debts/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            {t('addFirstDebt') || 'Add First Debt'}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-5">{t('colLender') || 'Lender & Type'}</th>
                <th className="py-4 px-5">{t('colNotes') || 'Agreement Notes'}</th>
                <th className="py-4 px-5 text-right">{t('colBalance') || 'Remaining Balance'}</th>
                <th className="py-4 px-5 text-right">{t('colEac') || 'True Yearly Cost (EAC)'}</th>
                <th className="py-4 px-5 text-right">{t('colBleed') || 'Monthly Interest'}</th>
                <th className="py-4 px-5">{t('colFinancialPriority') || 'Cost Priority'}</th>
                <th className="py-4 px-5">{t('colRelationalPriority') || 'Social Impact'}</th>
                <th className="py-4 px-5 text-center">{t('colAction') || 'Audio / Plain Advice'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm sm:text-base">
              {debts.map((debt) => {
                const isExpanded = expandedDebtId === debt.id;
                const explanation = generateDeterministicDebtExplanation(
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
                  },
                  language
                );

                return (
                  <React.Fragment key={debt.id}>
                    <tr className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}>
                      {/* Lender */}
                      <td className="py-4 px-4 font-semibold text-foreground">
                        <Link href={`/debts/${debt.id}`} className="hover:underline flex flex-col">
                          <span className="font-display font-bold text-base">{debt.lenderName}</span>
                          <LenderTypeBadge lenderType={debt.lenderType} />
                        </Link>
                      </td>

                      {/* Original Text Description */}
                      <td className="py-4 px-4 text-xs text-muted-foreground max-w-xs italic">
                        "{debt.repaymentExpectation}"
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-4 text-right font-display font-extrabold text-foreground">
                        ₹{debt.remainingBalance.toLocaleString('en-IN')}
                        {debt.remainingBalance < debt.principalAmount && (
                          <div className="text-[10px] text-muted-foreground font-sans font-normal">
                            of ₹{debt.principalAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Effective Annual Cost (EAC) */}
                      <td className="py-4 px-4 text-right font-display font-extrabold text-primary text-base">
                        {debt.effectiveAnnualCost}%
                      </td>

                      {/* Monthly Bleed */}
                      <td className="py-4 px-4 text-right font-display font-extrabold text-destructive">
                        ₹{debt.monthlyBleed.toLocaleString('en-IN')}
                        <span className="text-[10px] font-sans font-normal text-muted-foreground">/mo</span>
                      </td>

                      {/* Signal 1: Financial Urgency */}
                      <td className="py-4 px-4">
                        <UrgencyBadge urgencyTier={debt.urgencyTier} eac={debt.effectiveAnnualCost} />
                      </td>

                      {/* Signal 2: Relational Urgency */}
                      <td className="py-4 px-4">
                        <SocialWeightBadge socialWeight={debt.socialWeight} lenderType={debt.lenderType} />
                      </td>

                      {/* Actions & Inline Audio Toggle */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              isExpanded
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10'
                            }`}
                            title="Hear / Read Plain AI Explanation"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Explain</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                          </button>
                          <Link
                            href={`/debts/${debt.id}`}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                            title="View detail & logs"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(debt.id)}
                            disabled={deletingId === debt.id}
                            className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete debt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expanded AI Explanation Row */}
                    {isExpanded && (
                      <tr className="bg-primary/5 border-b border-primary/20">
                        <td colSpan={8} className="p-4">
                          <VoiceExplanationPlayer
                            text={explanation}
                            language={language}
                            title={`Plain Language Explanation for ${debt.lenderName}`}
                            isHighConfidence={true}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Guided Next Step Journey Card */}
      {debts.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Next in the 6-Step Pipeline
            </span>
            <h4 className="font-display text-lg font-bold text-foreground mt-0.5">
              Compare Avalanche vs Snowball Strategies & Simulate Payoff
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hear your full plan read aloud with browser voice and simulate what-if surplus adjustments.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              <span>Open Payoff Planner & Simulator</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
