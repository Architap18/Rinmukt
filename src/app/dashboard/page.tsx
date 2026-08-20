'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, ArrowUpRight, TrendingDown, AlertCircle, CheckCircle2, IndianRupee, ShieldCheck, HelpCircle } from 'lucide-react';
import { UntangleKnotVisual } from '@/components/UntangleKnotVisual';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';

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
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Payment Modal State
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading Karza Untangler Overview...
        </div>
      </div>
    );
  }

  const activeDebts = debts.filter((d) => d.remainingBalance > 0);
  const totalPrincipal = debts.reduce((acc, d) => acc + d.principalAmount, 0);
  const totalRemaining = debts.reduce((acc, d) => acc + d.remainingBalance, 0);
  const totalMonthlyBleed = activeDebts.reduce((acc, d) => acc + d.monthlyBleed, 0);

  // Blended average EAC weighted by remaining balance
  const blendedEAC =
    totalRemaining > 0
      ? debts.reduce((acc, d) => acc + d.effectiveAnnualCost * d.remainingBalance, 0) / totalRemaining
      : 0;

  const totalPaid = totalPrincipal - totalRemaining;
  const progressPercentage = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Financial Health Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, <strong className="text-foreground">{user?.name || 'Friend'}</strong>. All informal debts normalized into standard metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/debts/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            Add Informal Debt
          </Link>
          <Link
            href="/plan"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Generate Payoff Plan
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Untangling Knot Progress Visual Motif */}
      <UntangleKnotVisual progressPercentage={progressPercentage} totalDebtCount={activeDebts.length} />

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Remaining Balance */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outstanding Debt</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-foreground">
            ₹{totalRemaining.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Original total: ₹{totalPrincipal.toLocaleString('en-IN')} ({Math.round(progressPercentage)}% cleared)
          </div>
        </div>

        {/* Metric 2: Blended Average EAC */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Blended Average EAC</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-foreground">
            {blendedEAC.toFixed(1)}% <span className="text-sm font-normal text-muted-foreground">/ yr</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Weighted annual borrowing cost across all lenders
          </div>
        </div>

        {/* Metric 3: Total Monthly Bleed */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Rupee Bleed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-foreground">
            ₹{totalMonthlyBleed.toLocaleString('en-IN')} <span className="text-sm font-normal text-muted-foreground">/ mo</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Pure interest lost every month holding current balances
          </div>
        </div>

        {/* Metric 4: Active Debts */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Lenders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-foreground">
            {activeDebts.length} <span className="text-sm font-normal text-muted-foreground">active</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {debts.length - activeDebts.length} debts fully paid off!
          </div>
        </div>
      </div>

      {/* Debt Status List */}
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
            <p className="text-base font-semibold">No debts added yet.</p>
            <p className="text-xs max-w-sm mx-auto">
              Add your informal debts in plain language (Hinglish/Hindi/English) to calculate Effective Annual Cost.
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

      {/* Quick Payment Modal */}
      {paymentDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-xl font-bold text-foreground">
              Log Payment for {debts.find((d) => d.id === paymentDebtId)?.lenderName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
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
    </div>
  );
}
