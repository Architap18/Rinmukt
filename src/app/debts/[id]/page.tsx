'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, IndianRupee, Calendar, CheckCircle2, History, PlusCircle, Trash2 } from 'lucide-react';
import { UrgencyBadge, SocialWeightBadge, LenderTypeBadge } from '@/components/UrgencyBadge';

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
  interestType: string;
  interestRate: number;
  durationMonths: number;
  repaymentExpectation: string;
  socialWeight: string;
  effectiveAnnualCost: number;
  monthlyBleed: number;
  urgencyTier: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
  paymentLogs: PaymentLog[];
}

export default function DebtDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
  const progressPct = debt.principalAmount > 0 ? Math.min(100, Math.max(0, (paidAmount / debt.principalAmount) * 100)) : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <Link href="/debts" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Comparison Table
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card p-6 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-foreground">{debt.lenderName}</h1>
            <LenderTypeBadge lenderType={debt.lenderType} />
            {debt.status === 'paid_off' && (
              <span className="px-3 py-1 text-xs font-extrabold uppercase rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Fully Paid Off 🎉
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground italic">"{debt.repaymentExpectation}"</p>
        </div>

        <div className="flex items-center gap-2">
          <UrgencyBadge urgencyTier={debt.urgencyTier} eac={debt.effectiveAnnualCost} />
          <SocialWeightBadge socialWeight={debt.socialWeight} lenderType={debt.lenderType} />
        </div>
      </div>

      {/* Progress & Balance Bar */}
      <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining Balance</div>
            <div className="font-display text-3xl font-extrabold text-foreground mt-1">
              ₹{debt.remainingBalance.toLocaleString('en-IN')}{' '}
              <span className="text-sm font-normal text-muted-foreground">/ ₹{debt.principalAmount.toLocaleString('en-IN')} original</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Effective Annual Cost</div>
            <div className="font-display text-2xl font-extrabold text-primary mt-1">{debt.effectiveAnnualCost}% / yr</div>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹{paidAmount.toLocaleString('en-IN')} paid ({Math.round(progressPct)}%)</span>
          <span>₹{debt.remainingBalance.toLocaleString('en-IN')} remaining</span>
        </div>
      </div>

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
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Notes / Receipt Details
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Paid cash installment to lender"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Confirm & Update Balance'}
              </button>
            </form>
          )}
        </div>

        {/* History: Payment Log History */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Payment History
          </h3>

          {debt.paymentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center italic">No payments logged yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {debt.paymentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border text-xs"
                >
                  <div>
                    <div className="font-bold text-foreground text-sm">₹{log.amountPaid.toLocaleString('en-IN')}</div>
                    <div className="text-muted-foreground">{log.notes || 'Payment recorded'}</div>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
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
