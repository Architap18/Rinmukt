'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
  Calendar,
  Wallet,
  Clock,
  Sparkles,
  Edit3,
  Percent,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { UntangleKnotVisual } from '@/components/UntangleKnotVisual';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';
import { calculateMonthlyBleed, generatePayoffSchedule, RawDebtInput } from '@/lib/debtMath';
import { TrustNotice } from '@/components/TrustNotice';
import { DebtWeb } from '@/components/DebtWeb';
import { VoiceExplanationPlayer } from '@/components/VoiceExplanationPlayer';
import { useLanguage } from '@/context/LanguageContext';
import { Language, languageNames } from '@/lib/translations';
import { generateDeterministicPlanExplanation } from '@/lib/explanationService';
import { Globe } from 'lucide-react';

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
  dueDate?: string;
  status: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  monthlySurplus: number;
  monthlyIncome?: number | null;
  selectedStrategy?: 'avalanche' | 'snowball' | 'fastest' | 'balanced';
}

export default function DashboardPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Payment Modal State
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Income Input Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [savingIncome, setSavingIncome] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userRes = await fetch('/api/auth/me');
      if (userRes.status === 401) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);
      if (userData.user?.monthlyIncome) {
        setIncomeInput(String(userData.user.monthlyIncome));
      }

      const debtsRes = await fetch('/api/debts');
      const debtsData = await debtsRes.json();
      setDebts(debtsData.debts || []);
    } catch (err: any) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebtId || !paymentAmount) return;

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/debts/${paymentDebtId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: paymentAmount,
          notes: paymentNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment logging failed');
      }

      setPaymentDebtId(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedIncome = parseFloat(incomeInput);
    if (isNaN(parsedIncome) || parsedIncome <= 0) {
      alert('Please enter a valid monthly income greater than 0.');
      return;
    }

    setSavingIncome(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyIncome: parsedIncome }),
      });

      if (!res.ok) throw new Error('Failed to update income.');
      const data = await res.json();
      setUser((prev) => (prev ? { ...prev, monthlyIncome: data.user.monthlyIncome } : data.user));
      setIsIncomeModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingIncome(false);
    }
  };

  // Deterministic Computations using debtMath pure logic
  const activeDebts = useMemo(() => debts.filter((d) => d.remainingBalance > 0), [debts]);
  const totalPrincipal = useMemo(() => debts.reduce((acc, d) => acc + d.principalAmount, 0), [debts]);
  const totalRemaining = useMemo(() => activeDebts.reduce((acc, d) => acc + d.remainingBalance, 0), [activeDebts]);
  const totalPaid = Math.max(0, totalPrincipal - totalRemaining);

  // Part 1: Top-Level Stats
  // 1. Total Debt
  const totalDebt = totalRemaining;

  // 2. Interest This Month across all active debts using debtMath pure calculation
  const interestThisMonth = useMemo(() => {
    return activeDebts.reduce((sum, d) => {
      return sum + calculateMonthlyBleed(d.remainingBalance, d.interestType, d.interestRate, d.durationMonths || 12);
    }, 0);
  }, [activeDebts]);

  // Active Strategy & Payoff Plan
  const activeStrategy = (user?.selectedStrategy as 'avalanche' | 'snowball' | 'fastest' | 'balanced') || 'avalanche';
  const monthlySurplus = user?.monthlySurplus || 3000;

  const rawDebtsInput: RawDebtInput[] = useMemo(() => {
    return activeDebts.map((d) => ({
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
  }, [activeDebts]);

  const payoffPlan = useMemo(() => {
    return generatePayoffSchedule(rawDebtsInput, monthlySurplus, activeStrategy);
  }, [rawDebtsInput, monthlySurplus, activeStrategy]);

  // 3. Monthly EMI / Expected payment outflow for this month
  const monthlyOutflow = useMemo(() => {
    if (payoffPlan.schedule.length > 0) {
      return payoffPlan.schedule[0].totalSurplusAllocated;
    }
    return Math.min(totalDebt, monthlySurplus);
  }, [payoffPlan, totalDebt, monthlySurplus]);

  // 4. Debt-Free Progress percentage & visual bar
  const progressPercentage = totalPrincipal > 0 ? ((totalPrincipal - totalRemaining) / totalPrincipal) * 100 : 100;
  const clampedProgress = Math.min(100, Math.max(0, progressPercentage));

  // Part 1: Secondary Stats Row
  // Highest-interest debt
  const highestInterestDebt = useMemo(() => {
    if (activeDebts.length === 0) return null;
    return [...activeDebts].sort((a, b) => b.effectiveAnnualCost - a.effectiveAnnualCost)[0];
  }, [activeDebts]);

  // Upcoming Payment (soonest due or month 1 top allocated debt)
  const upcomingPayment = useMemo(() => {
    if (activeDebts.length === 0) return null;
    // Check if any active debt has month 1 payment > 0
    const m1Payments = payoffPlan.schedule?.[0]?.payments?.filter((p) => p.paymentAmount > 0) || [];
    if (m1Payments.length > 0) {
      const topPay = m1Payments.sort((a, b) => b.paymentAmount - a.paymentAmount)[0];
      const matchingDebt = activeDebts.find((d) => d.id === topPay.debtId);
      return {
        lenderName: topPay.lenderName,
        amount: topPay.paymentAmount,
        dueDate: matchingDebt?.dueDate || payoffPlan.schedule[0].monthName,
      };
    }
    return {
      lenderName: activeDebts[0].lenderName,
      amount: Math.min(activeDebts[0].remainingBalance, monthlySurplus),
      dueDate: activeDebts[0].dueDate || 'This Month',
    };
  }, [activeDebts, payoffPlan, monthlySurplus]);

  // Total Monthly Bleed
  const totalMonthlyBleed = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + (d.monthlyBleed || 0), 0);
  }, [activeDebts]);

  // Highest EAC Debt
  const highestEacDebt = useMemo(() => {
    return activeDebts.length > 0
      ? [...activeDebts].sort((a, b) => b.effectiveAnnualCost - a.effectiveAnnualCost)[0]
      : null;
  }, [activeDebts]);

  // Total Interest Remaining (projected over entire payoff duration)
  const totalInterestRemaining = payoffPlan.totalInterestPaid;

  // Debt-to-Income (DTI) Ratio
  const monthlyIncome = user?.monthlyIncome;
  const dtiRatio = monthlyIncome && monthlyIncome > 0 ? (monthlyOutflow / monthlyIncome) * 100 : null;

  // Part 2: Visualizations Data
  // 1. Debt by Lender (Sorted largest to smallest remaining balance)
  const debtsByLenderSorted = useMemo(() => {
    return [...activeDebts].sort((a, b) => b.remainingBalance - a.remainingBalance);
  }, [activeDebts]);

  const maxLenderBalance = useMemo(() => {
    return debtsByLenderSorted.length > 0 ? debtsByLenderSorted[0].remainingBalance : 1;
  }, [debtsByLenderSorted]);

  // 2. Timeline chart data
  const timelineSchedule = useMemo(() => {
    return payoffPlan.schedule.slice(0, 12); // First 12 months preview or full if <= 12
  }, [payoffPlan]);

  const maxTimelineDebt = useMemo(() => {
    if (payoffPlan.schedule.length === 0) return totalDebt || 1;
    return Math.max(totalDebt, payoffPlan.schedule[0]?.remainingTotalDebt || 1);
  }, [payoffPlan, totalDebt]);

  // Plain-Language Overall Explanation Memo in Active Language
  const overallExplanation = useMemo(() => {
    return generateDeterministicPlanExplanation(
      {
        strategy: activeStrategy,
        totalInterestPaid: payoffPlan.totalInterestPaid,
        totalMonths: payoffPlan.totalMonths,
        debtFreeDate: payoffPlan.debtFreeDate,
        monthlySurplus,
        totalDebt,
        debtsCount: activeDebts.length,
        payoffSequence: payoffPlan.payoffOrder.map((p) => p.lenderName),
      },
      language
    );
  }, [payoffPlan, activeStrategy, monthlySurplus, totalDebt, activeDebts, language]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-base font-bold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          Loading Rinmukht...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-12">
      {/* Header Banner - Spacious & Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-2.5 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('currentActivePlan') || 'Active Strategy'}: {activeStrategy.toUpperCase()}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t('dashboardTitle') || 'Financial Health Overview'}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground font-medium">
            {t('dashboardSubtitle') || 'Real-time deterministic view of your informal debt obligations.'}
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
          <Link
            href="/plan"
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm sm:text-base font-bold text-foreground hover:bg-muted transition-colors shadow-sm min-h-[46px]"
          >
            {t('planTitle') || 'Payoff Plan'}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Untangling Knot Progress Motif */}
      <UntangleKnotVisual progressPercentage={clampedProgress} totalDebtCount={activeDebts.length} />

      {/* AI Explanation & Audio Player Card */}
      {activeDebts.length > 0 && (
        <VoiceExplanationPlayer
          text={overallExplanation}
          language={language}
          title={t('explainThis') || 'Debt Health Voice Explanation'}
          isHighConfidence={true}
        />
      )}

      {/* Interactive Debt Web */}
      {activeDebts.length > 0 && (
        <div id="debt-web">
          <DebtWeb debts={activeDebts} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP-LEVEL STATS SECTION - Spacious 4 Cards                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Debt */}
        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border flex flex-col justify-between hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('totalOwed') || 'Total Debt'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              ₹{totalDebt.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">
              {t('totalOwedSub') || `Across ${activeDebts.length} active loans`}
            </div>
          </div>
        </div>

        {/* Metric 2: Monthly Bleed */}
        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border flex flex-col justify-between hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('monthlyBleed') || 'Monthly Interest'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-destructive">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-destructive tracking-tight">
              ₹{totalMonthlyBleed.toLocaleString('en-IN')}
              <span className="text-xs sm:text-sm font-sans font-normal text-muted-foreground ml-1">/mo</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">
              {t('monthlyBleedSub') || 'Pure interest drain every month'}
            </div>
          </div>
        </div>

        {/* Metric 3: Highest Rate Debt */}
        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border flex flex-col justify-between hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('highestCostLoan') || 'Highest Cost Loan'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {highestEacDebt ? (
              <>
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground truncate">
                  {highestEacDebt.lenderName}
                </div>
                <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {highestEacDebt.effectiveAnnualCost}% True Yearly Cost (EAC)
                </div>
              </>
            ) : (
              <div className="text-sm font-bold text-muted-foreground">No active debts</div>
            )}
          </div>
        </div>

        {/* Metric 4: Debt-Free Target */}
        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('debtFreeTarget') || 'Debt-Free Target'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {payoffPlan?.debtFreeDate || '12 Months'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">
              {payoffPlan?.totalMonths
                ? `${payoffPlan.totalMonths} months with current plan`
                : 'Accelerated payoff timeline'}
            </div>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* PART 2: TWO VISUALIZATIONS                                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualization 1: Debt by Lender (Horizontal Bar Chart) */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Debt by Lender</h2>
                <p className="text-xs text-muted-foreground">
                  Active debt remaining balance by lender (largest to smallest)
                </p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {activeDebts.length} {activeDebts.length === 1 ? 'Lender' : 'Lenders'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {debtsByLenderSorted.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No active debts to display in chart.
                </div>
              ) : (
                debtsByLenderSorted.map((debt) => {
                  const percentageWidth = Math.max(8, (debt.remainingBalance / maxLenderBalance) * 100);
                  return (
                    <div key={debt.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{debt.lenderName}</span>
                          <LenderTypeBadge lenderType={debt.lenderType} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-semibold">
                            {debt.effectiveAnnualCost}% EAC
                          </span>
                          <span className="font-extrabold text-foreground font-display">
                            ₹{debt.remainingBalance.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Bar Track */}
                      <div className="h-4 w-full rounded-lg bg-muted/60 overflow-hidden relative flex items-center p-0.5 border border-border/40">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-primary to-amber-500 transition-all duration-500 flex items-center justify-end px-2"
                          style={{ width: `${percentageWidth}%` }}
                        >
                          {percentageWidth > 25 && (
                            <span className="text-[10px] font-bold text-white drop-shadow-sm font-display">
                              ₹{debt.remainingBalance.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Largest single balance: <strong className="text-foreground">₹{maxLenderBalance.toLocaleString('en-IN')}</strong></span>
            <Link href="/debts" className="text-primary font-semibold hover:underline">
              View Comparison Table →
            </Link>
          </div>
        </div>

        {/* Visualization 2: Debt Payoff Timeline (Projected Remaining Balance Month-by-Month) */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Debt Payoff Timeline</h2>
                <p className="text-xs text-muted-foreground">
                  Projected remaining balance with ₹{monthlySurplus.toLocaleString('en-IN')}/mo surplus ({activeStrategy})
                </p>
              </div>
              <Link
                href="/plan"
                className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
              >
                Change Strategy →
              </Link>
            </div>

            {timelineSchedule.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No active repayment schedule. Add debt to project timeline.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {/* Timeline Step Bars */}
                {timelineSchedule.map((month, idx) => {
                  const isFinal = idx === timelineSchedule.length - 1 || month.remainingTotalDebt === 0;
                  const barPercent = Math.max(0, (month.remainingTotalDebt / maxTimelineDebt) * 100);

                  return (
                    <div key={month.monthIndex} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          Month {month.monthIndex} ({month.monthName})
                        </span>
                        <div className="flex items-center gap-2">
                          {month.remainingTotalDebt === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse">
                              <Sparkles className="w-3 h-3" /> Debt-free 🎉
                            </span>
                          ) : (
                            <span className="font-display font-extrabold text-foreground">
                              ₹{month.remainingTotalDebt.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative border border-border/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            month.remainingTotalDebt === 0
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-amber-500 to-primary'
                          }`}
                          style={{ width: `${month.remainingTotalDebt === 0 ? 100 : Math.max(4, barPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Target Debt-Free Date: <strong className="text-foreground">{payoffPlan.debtFreeDate || 'N/A'}</strong> ({payoffPlan.totalMonths} months)
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ₹{payoffPlan.totalInterestPaid.toLocaleString('en-IN')} total interest
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE INFORMAL DEBTS LIST & PAYMENT LOGGING                               */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Active Informal Debts</h2>
            <p className="text-xs text-muted-foreground">Quick overview of current lenders & interest metrics.</p>
          </div>
          <Link href="/debts" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Full Comparison Table →
          </Link>
        </div>

        {debts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-3">
            <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/60" />
            <p className="text-base font-semibold">No debts registered yet.</p>
            <p className="text-xs max-w-sm mx-auto">
              Add your informal debts in plain language to calculate Effective Annual Cost and project your debt-free date.
            </p>
            <Link
              href="/debts/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Add First Debt
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-4 border border-border bg-background hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-foreground">{debt.lenderName}</span>
                    <LenderTypeBadge lenderType={debt.lenderType} />
                    {debt.status === 'paid_off' && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Paid Off
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <UrgencyBadge urgencyTier={debt.urgencyTier} eac={debt.effectiveAnnualCost} />
                    <SocialWeightBadge socialWeight={debt.socialWeight} lenderType={debt.lenderType} />
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{debt.repaymentExpectation}"</p>
                </div>

                <div className="flex items-center gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Remaining Balance</div>
                    <div className="font-display text-xl font-extrabold text-foreground">
                      ₹{debt.remainingBalance.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Bleed: <strong className="text-destructive font-semibold">₹{debt.monthlyBleed}/mo</strong>
                    </div>
                  </div>

                  {debt.remainingBalance > 0 && (
                    <button
                      onClick={() => {
                        setPaymentDebtId(debt.id);
                        setPaymentAmount('');
                      }}
                      className="rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      Log Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guided Next Step Journey Card */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Step 6 of 6 • Actionable Payoff Plan & Simulator
          </span>
          <h4 className="font-display text-lg font-bold text-foreground mt-0.5">
            Optimize your payoff order with Avalanche vs Snowball
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simulate monthly savings, listen to full audio walkthroughs, and set your active repayment plan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/debts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
          >
            Comparison Table
          </Link>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>Open Repayment Planner & Simulator</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Payment Modal */}
      {paymentDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                Log Payment: {debts.find((d) => d.id === paymentDebtId)?.lenderName}
              </h3>
              <button
                onClick={() => setPaymentDebtId(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current remaining balance: ₹
              {debts.find((d) => d.id === paymentDebtId)?.remainingBalance.toLocaleString('en-IN')}
            </p>

            <form onSubmit={handleLogPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Amount Paid (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
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
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Paid cash installment"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentDebtId(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90"
                >
                  {submittingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Income Settings Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                Set Monthly Income
              </h3>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your monthly household income is used to calculate your Debt-to-Income (DTI) ratio safely and privately.
            </p>

            <form onSubmit={handleSaveIncome} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Monthly Take-Home Income (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. 25000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIncome}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90"
                >
                  {savingIncome ? 'Saving...' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
