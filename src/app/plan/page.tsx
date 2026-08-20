'use client';

import React, { useEffect, useState, useRef } from 'react';
import { IndianRupee, Calendar, Zap, Scale, Printer, Share2, CheckCircle2, Clock, Info } from 'lucide-react';
import { PayoffScheduleResult } from '@/lib/debtMath';
import { UrgencyBadge, SocialWeightBadge } from '@/components/UrgencyBadge';

export default function PlanPage() {
  const [surplus, setSurplus] = useState<string>('3000');
  const [strategy, setStrategy] = useState<'fastest' | 'balanced'>('fastest');
  const [planResult, setPlanResult] = useState<PayoffScheduleResult | null>(null);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchPlan = async (strat: 'fastest' | 'balanced' = strategy, monthlySurplusVal?: string) => {
    try {
      setGenerating(true);
      const surplusNum = parseFloat(monthlySurplusVal || surplus);

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: strat, monthlySurplus: surplusNum }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to calculate plan');

      setPlanResult(data.plan);

      // Fetch active debts list
      const debtsRes = await fetch('/api/debts');
      const debtsData = await debtsRes.json();
      setDebts(debtsData.debts || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleStrategyToggle = (newStrategy: 'fastest' | 'balanced') => {
    setStrategy(newStrategy);
    fetchPlan(newStrategy);
  };

  const handleSurplusChange = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlan();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Calculating Deterministic Payoff Schedule...
        </div>
      </div>
    );
  }

  // Action Items for current month (Month 1)
  const currentMonthPayments = planResult?.schedule?.[0]?.payments || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Printable Area Wrapper for PDF / Print Share */}
      <div ref={printRef} className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              Karza Payoff Plan & Action Roadmap
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Deterministic payoff schedule based on your monthly surplus budget.
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF Summary
            </button>
          </div>
        </div>

        {/* Input & Strategy Control Panel */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Surplus Input */}
            <form onSubmit={handleSurplusChange} className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Available Monthly Surplus (₹)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={surplus}
                    onChange={(e) => setSurplus(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="3000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
                >
                  Recalculate
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Amount of spare cash you can devote strictly to debt repayment each month.
              </p>
            </form>

            {/* Strategy Toggles */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Repayment Strategy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStrategyToggle('fastest')}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                    strategy === 'fastest'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Fastest Payoff (Pure EAC)
                </button>

                <button
                  type="button"
                  onClick={() => handleStrategyToggle('balanced')}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                    strategy === 'balanced'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  Balanced (Relationship Weight)
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {strategy === 'fastest'
                  ? 'Pure Avalanche method: focuses 100% of surplus on highest Effective Annual Cost (EAC) debts first.'
                  : 'Balanced method: targets high EAC debts while preserving relationships by giving token payments to family/relative debts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Summary Card (Plain Language One-Page Action Sheet) */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card p-6 border-2 border-primary/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                Action Plan for This Month ({planResult?.schedule?.[0]?.monthName || 'Current Month'})
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground">What You Need To Pay Now</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Total Timeline</span>
              <div className="font-display text-xl font-extrabold text-foreground">
                {planResult?.totalMonths || 0} Months to Debt-Free
              </div>
            </div>
          </div>

          {/* Plain Language Action Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentMonthPayments.map((payment) => (
              <div
                key={payment.debtId}
                className="rounded-xl bg-card p-4 border border-border space-y-1 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-foreground text-base">{payment.lenderName}</span>
                  {payment.isPaidOff ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Paid Off This Month!
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Target: {planResult?.projectedPayoffDates[payment.debtId] || 'In progress'}
                    </span>
                  )}
                </div>

                <div className="font-display text-2xl font-extrabold text-primary">
                  Pay ₹{payment.paymentAmount.toLocaleString('en-IN')}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {payment.paymentAmount === 0
                    ? '₹0 allocation for now. Maintain communication.'
                    : `Remaining after this payment: ₹${payment.endBalance.toLocaleString('en-IN')}`}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              Total projected interest saved with this schedule: <strong className="text-foreground">₹{planResult?.totalInterestPaid.toLocaleString('en-IN')}</strong> accrued interest total.
            </span>
          </div>
        </div>

        {/* Projected Payoff Timeline Per Debt */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
          <h3 className="font-display text-xl font-bold text-foreground">Projected Debt-Free Dates</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {debts.map((debt) => {
              const payoffDate = planResult?.projectedPayoffDates[debt.id] || 'N/A';
              return (
                <div key={debt.id} className="rounded-xl bg-background p-4 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-foreground">{debt.lenderName}</span>
                    <span className="text-xs text-muted-foreground">₹{debt.remainingBalance.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-display font-bold text-foreground text-sm">
                      {payoffDate}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    EAC: {debt.effectiveAnnualCost}% • Bleed: ₹{debt.monthlyBleed}/mo
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month-by-Month Allocation Timeline */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4 print:hidden">
          <h3 className="font-display text-xl font-bold text-foreground">Month-by-Month Surplus Allocation</h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {planResult?.schedule.map((month) => (
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
                    <div key={p.debtId} className="p-2 rounded-lg bg-card border border-border">
                      <div className="font-semibold text-foreground">{p.lenderName}</div>
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
