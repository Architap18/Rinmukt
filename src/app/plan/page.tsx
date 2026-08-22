'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  Calendar,
  Zap,
  TrendingDown,
  Sparkles,
  Printer,
  CheckCircle2,
  Clock,
  Info,
  Scale,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Flame,
  Snowflake,
  Check,
  Globe,
  Sliders,
  Share2,
  CheckCheck,
} from 'lucide-react';
import { generatePayoffSchedule, PayoffScheduleResult, RawDebtInput } from '@/lib/debtMath';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';
import { TrustNotice } from '@/components/TrustNotice';
import { VoiceExplanationPlayer } from '@/components/VoiceExplanationPlayer';
import { useLanguage } from '@/context/LanguageContext';
import { Language, languageNames } from '@/lib/translations';
import { generateDeterministicPlanExplanation } from '@/lib/explanationService';

interface Debt {
  id: string;
  lenderName: string;
  lenderType: string;
  principalAmount: number;
  remainingBalance: number;
  interestType: string;
  interestRate: number;
  durationMonths?: number;
  repaymentExpectation: string;
  socialWeight: string;
  effectiveAnnualCost: number;
  monthlyBleed: number;
  urgencyTier: 'high' | 'medium' | 'low';
}

export default function PlanPage() {
  const { language, setLanguage, t } = useLanguage();
  const [surplus, setSurplus] = useState<string>('3000');
  const [activeStrategy, setActiveStrategy] = useState<'avalanche' | 'snowball' | 'balanced'>('avalanche');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [copiedRecap, setCopiedRecap] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plan');
      if (!res.ok) throw new Error('Failed to load plan data');
      const data = await res.json();

      if (data.userMonthlySurplus) {
        setSurplus(String(data.userMonthlySurplus));
      }
      if (data.selectedStrategy) {
        const strat = data.selectedStrategy === 'fastest' ? 'avalanche' : data.selectedStrategy;
        setActiveStrategy(strat);
      }

      setDebts(data.debts || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const surplusNum = useMemo(() => {
    const num = parseFloat(surplus);
    return isNaN(num) || num <= 0 ? 3000 : num;
  }, [surplus]);

  const activeDebts: RawDebtInput[] = useMemo(() => {
    return debts
      .filter((d) => d.remainingBalance > 0)
      .map((d) => ({
        id: d.id,
        lenderName: d.lenderName,
        lenderType: d.lenderType,
        principalAmount: d.principalAmount,
        remainingBalance: d.remainingBalance,
        interestType: d.interestType,
        interestRate: d.interestRate,
        durationMonths: d.durationMonths,
        repaymentExpectation: d.repaymentExpectation,
        socialWeight: d.socialWeight,
      }));
  }, [debts]);

  // Compute Deterministic Real Plans for Avalanche, Snowball, and Balanced
  const avalanchePlan = useMemo(() => {
    return generatePayoffSchedule(activeDebts, surplusNum, 'avalanche');
  }, [activeDebts, surplusNum]);

  const snowballPlan = useMemo(() => {
    return generatePayoffSchedule(activeDebts, surplusNum, 'snowball');
  }, [activeDebts, surplusNum]);

  const balancedPlan = useMemo(() => {
    return generatePayoffSchedule(activeDebts, surplusNum, 'balanced');
  }, [activeDebts, surplusNum]);

  // Current Selected Active Plan
  const currentPlan = useMemo(() => {
    if (activeStrategy === 'snowball') return snowballPlan;
    if (activeStrategy === 'balanced') return balancedPlan;
    return avalanchePlan;
  }, [activeStrategy, avalanchePlan, snowballPlan, balancedPlan]);

  // Dynamic Interest Difference & Comparison Calculations
  const interestDifference = Math.abs(snowballPlan.totalInterestPaid - avalanchePlan.totalInterestPaid);
  const avalancheWinsInterest = avalanchePlan.totalInterestPaid < snowballPlan.totalInterestPaid;
  const isInterestTied = avalanchePlan.totalInterestPaid === snowballPlan.totalInterestPaid;

  // Master Voice Walkthrough Text for the Whole Plan
  const wholePlanExplanation = useMemo(() => {
    return generateDeterministicPlanExplanation(
      {
        strategy: activeStrategy,
        totalInterestPaid: currentPlan.totalInterestPaid,
        totalMonths: currentPlan.totalMonths,
        debtFreeDate: currentPlan.debtFreeDate,
        monthlySurplus: surplusNum,
        totalDebt: activeDebts.reduce((sum, d) => sum + (d.remainingBalance ?? d.principalAmount), 0),
        debtsCount: activeDebts.length,
        payoffSequence: currentPlan.payoffOrder.map((p) => p.lenderName),
        interestSavedComparedToOther: interestDifference,
      },
      language
    );
  }, [currentPlan, activeStrategy, surplusNum, activeDebts, interestDifference, language]);

  const handleSetActivePlan = async (newStrategy: 'avalanche' | 'snowball' | 'balanced') => {
    setActiveStrategy(newStrategy);
    setSavingStrategy(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: newStrategy,
          monthlySurplus: surplusNum,
        }),
      });
      if (!res.ok) throw new Error('Failed to update active plan');
    } catch (err: any) {
      alert('Error updating active strategy: ' + err.message);
    } finally {
      setSavingStrategy(false);
    }
  };

  const handleSurplusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStrategy(true);
    try {
      await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: activeStrategy,
          monthlySurplus: surplusNum,
        }),
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingStrategy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRecap = () => {
    const recap = `📋 Rinmukht Debt Freedom Plan Summary:\n` +
      `• Total Debts: ${activeDebts.length}\n` +
      `• Total Balance: ₹${activeDebts.reduce((sum, d) => sum + (d.remainingBalance ?? d.principalAmount), 0).toLocaleString('en-IN')}\n` +
      `• Strategy: ${activeStrategy.toUpperCase()}\n` +
      `• Target Debt-Free Date: ${currentPlan.debtFreeDate} (${currentPlan.totalMonths} months)\n` +
      `• Total Interest: ₹${currentPlan.totalInterestPaid.toLocaleString('en-IN')}\n` +
      `• Payoff Sequence: ${currentPlan.payoffOrder.map((p) => p.lenderName).join(' → ')}\n\n` +
      `💡 Plain Explanation: "${wholePlanExplanation}"`;

    navigator.clipboard.writeText(recap);
    setCopiedRecap(true);
    setTimeout(() => setCopiedRecap(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Calculating Deterministic Repayment Plans...
        </div>
      </div>
    );
  }

  // Month 1 action items under active plan
  const currentMonthPayments = currentPlan?.schedule?.[0]?.payments || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-12">
      <div ref={printRef} className="space-y-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-2 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('currentActivePlan') || 'Active Strategy'}: {activeStrategy.toUpperCase()}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t('planTitle') || 'Smart Repayment Planner'}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground font-medium">
              {t('planSubtitle') || 'Find out how fast you can become debt-free with extra monthly payments.'}
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm sm:text-base font-bold text-foreground hover:bg-muted transition-colors shadow-sm min-h-[46px]"
            >
              <Printer className="w-5 h-5" />
              {t('printPdf') || 'Print / Save PDF'}
            </button>
          </div>
        </div>

        {/* Master "Listen to Your Whole Plan" Audio Player */}
        {activeDebts.length > 0 && (
          <VoiceExplanationPlayer
            text={wholePlanExplanation}
            language={language}
            title={t('explainThis') || 'Listen to Your Whole Plan'}
            isHighConfidence={true}
          />
        )}

        {/* Repayment Simulator: Interactive What-If Budget Slider */}
        <div className="rounded-3xl bg-card p-6 sm:p-7 border border-border shadow-sm space-y-5 print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Live "What-If" Debt Freedom Simulator
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Drag the slider to see how extra monthly payment cuts your debt-free date in real time.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Extra Monthly Payment</span>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                ₹{surplusNum.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-semibold text-muted-foreground font-sans">/ month</span>
              </div>
            </div>
          </div>

          {/* Slider Control with Instant Recalculation */}
          <div className="space-y-2.5 pt-2">
            <input
              type="range"
              min="500"
              max="25000"
              step="500"
              value={surplusNum}
              onChange={(e) => setSurplus(e.target.value)}
              className="w-full h-3 bg-muted rounded-xl appearance-none cursor-pointer accent-amber-600"
              aria-label="Extra money per month toward debt"
            />
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>₹500 / mo</span>
              <span>₹5,000 / mo</span>
              <span>₹10,000 / mo</span>
              <span>₹25,000 / mo</span>
            </div>
          </div>

          {/* Dynamic Simulator Real-Time Feedback Pill */}
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                At <strong>₹{surplusNum.toLocaleString('en-IN')}/mo</strong> extra, you will be completely debt-free by <strong className="text-amber-700 dark:text-amber-300 underline font-bold">{currentPlan.debtFreeDate}</strong> ({currentPlan.totalMonths} months).
              </span>
            </div>
            <form onSubmit={handleSurplusSubmit} className="shrink-0 self-end sm:self-center">
              <button
                type="submit"
                disabled={savingStrategy}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-opacity min-h-[38px]"
              >
                {savingStrategy ? 'Saving...' : 'Set as My Default'}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Comparison Callout between Avalanche vs Snowball */}
        {activeDebts.length > 1 && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-purple-500/10 p-5 border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">Strategy Comparison</span>
              </div>
              <p className="text-sm sm:text-base text-foreground font-semibold">
                {isInterestTied ? (
                  'Both Avalanche and Snowball result in the same total interest for your current debt balances.'
                ) : avalancheWinsInterest ? (
                  <>
                    <strong className="text-amber-600">Avalanche</strong> saves you approximately <strong className="text-emerald-600 font-bold">₹{interestDifference.toLocaleString('en-IN')}</strong> in total interest compared to Snowball{snowballPlan.totalMonths > avalanchePlan.totalMonths ? ` and finishes ${snowballPlan.totalMonths - avalanchePlan.totalMonths} months earlier` : ''}.
                  </>
                ) : (
                  <>
                    <strong className="text-sky-600">Snowball</strong> saves you approximately <strong className="text-emerald-600 font-bold">₹{interestDifference.toLocaleString('en-IN')}</strong> in total interest compared to Avalanche.
                  </>
                )}
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground shrink-0 bg-card px-3 py-1.5 rounded-xl border border-border">
              Computed mathematically
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STRATEGY COMPARISON: AVALANCHE VS SNOWBALL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Debt Avalanche */}
          <div
            className={`rounded-3xl p-6 sm:p-7 border transition-all flex flex-col justify-between space-y-6 ${
              activeStrategy === 'avalanche'
                ? 'bg-amber-500/5 border-amber-600 shadow-md ring-1 ring-amber-600'
                : 'bg-card border-border hover:border-amber-500/40'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {t('avalancheTitle') || 'Highest-Interest First (Avalanche)'}
                    </h3>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {t('colEac') || 'Highest True Yearly Cost First'}
                    </span>
                  </div>
                </div>

                {activeStrategy === 'avalanche' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">
                    <Check className="w-3.5 h-3.5" /> {t('currentActivePlan') || 'Active'}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('avalancheSub') || 'Prioritizes paying off loans with the highest Effective Annual Cost (EAC) first to mathematically minimize total interest bleed.'}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-muted/40 p-4 border border-border">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">{t('colBleed') || 'Total Interest'}</span>
                  <div className="font-display text-2xl font-extrabold text-foreground mt-1">
                    ₹{avalanchePlan.totalInterestPaid.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4 border border-border">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">{t('debtFreeTarget') || 'Debt-Free In'}</span>
                  <div className="font-display text-2xl font-extrabold text-foreground mt-1">
                    {avalanchePlan.totalMonths} <span className="text-xs font-normal text-muted-foreground">months</span>
                  </div>
                </div>
              </div>

              {/* Payoff Sequence */}
              <div>
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                  Target Payoff Sequence:
                </span>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {avalanchePlan.payoffOrder.map((d, index) => (
                    <span
                      key={d.debtId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground shadow-2xs"
                    >
                      <strong className="text-amber-600">{index + 1}.</strong> {d.lenderName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              {activeStrategy === 'avalanche' ? (
                <div className="text-center text-sm font-bold text-amber-600 py-2.5">
                  {t('currentActivePlan') || '✓ Current Active Strategy'}
                </div>
              ) : (
                <button
                  onClick={() => handleSetActivePlan('avalanche')}
                  className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-opacity min-h-[46px]"
                >
                  {t('setActivePlan') || 'Set Avalanche as Active Plan'}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Debt Snowball */}
          <div
            className={`rounded-3xl p-6 sm:p-7 border transition-all flex flex-col justify-between space-y-6 ${
              activeStrategy === 'snowball'
                ? 'bg-sky-500/5 border-sky-600 shadow-md ring-1 ring-sky-600'
                : 'bg-card border-border hover:border-sky-500/40'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                    <Snowflake className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {t('snowballTitle') || 'Smallest-Balance First (Snowball)'}
                    </h3>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                      {t('colBalance') || 'Smallest Balance First'}
                    </span>
                  </div>
                </div>

                {activeStrategy === 'snowball' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">
                    <Check className="w-3.5 h-3.5" /> {t('currentActivePlan') || 'Active'}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('snowballSub') || 'Prioritizes eliminating smaller loan balances first to give rapid psychological wins and reduce the total count of lenders quickly.'}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-muted/40 p-4 border border-border">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">{t('colBleed') || 'Total Interest'}</span>
                  <div className="font-display text-2xl font-extrabold text-foreground mt-1">
                    ₹{snowballPlan.totalInterestPaid.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4 border border-border">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">{t('debtFreeTarget') || 'Debt-Free In'}</span>
                  <div className="font-display text-2xl font-extrabold text-foreground mt-1">
                    {snowballPlan.totalMonths} <span className="text-xs font-normal text-muted-foreground">months</span>
                  </div>
                </div>
              </div>

              {/* Payoff Sequence */}
              <div>
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                  Target Payoff Sequence:
                </span>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {snowballPlan.payoffOrder.map((d, index) => (
                    <span
                      key={d.debtId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground shadow-2xs"
                    >
                      <strong className="text-sky-600">{index + 1}.</strong> {d.lenderName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              {activeStrategy === 'snowball' ? (
                <div className="text-center text-sm font-bold text-sky-600 py-2.5">
                  {t('currentActivePlan') || '✓ Current Active Strategy'}
                </div>
              ) : (
                <button
                  onClick={() => handleSetActivePlan('snowball')}
                  className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-opacity min-h-[46px]"
                >
                  {t('setActivePlan') || 'Set Snowball as Active Plan'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Session Recap Card ("Here's what we found") */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Session Recap ("Here's what we found")</h3>
                <p className="text-xs text-muted-foreground">
                  Complete summary of your normalized debt obligations and payoff trajectory.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyRecap}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              {copiedRecap ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedRecap ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
              <span className="text-muted-foreground font-semibold">Active Debts</span>
              <div className="font-display text-lg font-bold text-foreground">{activeDebts.length} Loans</div>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
              <span className="text-muted-foreground font-semibold">Total Balance</span>
              <div className="font-display text-lg font-bold text-foreground">
                ₹{activeDebts.reduce((sum, d) => sum + (d.remainingBalance ?? d.principalAmount), 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
              <span className="text-muted-foreground font-semibold">Target Debt-Free Date</span>
              <div className="font-display text-lg font-bold text-primary">{currentPlan.debtFreeDate}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
              <span className="text-muted-foreground font-semibold">Total Plan Interest</span>
              <div className="font-display text-lg font-bold text-foreground">
                ₹{currentPlan.totalInterestPaid.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Month-1 Action Sheet */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                Active Schedule Execution ({activeStrategy.toUpperCase()})
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Current Month Action Sheet ({currentPlan?.schedule?.[0]?.monthName || 'Month 1'})
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Payoff Timeline</span>
              <div className="font-display text-lg font-extrabold text-foreground">
                {currentPlan?.totalMonths || 0} Months to Debt-Free
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentMonthPayments.map((payment) => (
              <div
                key={payment.debtId}
                className="rounded-xl bg-background p-4 border border-border space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-foreground text-base">
                    {payment.lenderName}
                  </span>
                  {payment.isPaidOff ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Paid Off This Month!
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Target: {currentPlan?.projectedPayoffDates[payment.debtId] || 'In progress'}
                    </span>
                  )}
                </div>

                <div className="font-display text-2xl font-extrabold text-primary">
                  Pay ₹{payment.paymentAmount.toLocaleString('en-IN')}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {payment.paymentAmount === 0
                    ? '₹0 allocation this month. Focus surplus on higher priority debt.'
                    : `Remaining balance after payment: ₹${payment.endBalance.toLocaleString('en-IN')}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Full Month-by-Month Allocation Timeline */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-foreground">
              Month-by-Month Surplus Allocations
            </h3>
            <span className="text-xs text-muted-foreground">
              Full {currentPlan?.totalMonths || 0}-Month Forecast
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {currentPlan?.schedule.map((month) => (
              <div key={month.monthIndex} className="rounded-xl border border-border bg-background p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-display font-bold text-foreground text-sm">
                    Month {month.monthIndex} — {month.monthName}
                  </span>
                  <span className="text-muted-foreground">
                    Remaining Total Debt: <strong className="text-foreground">₹{month.remainingTotalDebt.toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  {month.payments.map((p) => (
                    <div key={p.debtId} className="p-2.5 rounded-lg bg-card border border-border space-y-0.5">
                      <div className="font-semibold text-foreground truncate">{p.lenderName}</div>
                      <div className="text-primary font-bold">Pay ₹{p.paymentAmount.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-muted-foreground">Bal: ₹{p.endBalance.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
