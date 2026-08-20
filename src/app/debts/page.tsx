'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Table as TableIcon, Trash2, ArrowUpRight, IndianRupee, HelpCircle, ShieldCheck } from 'lucide-react';
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
  createdAt: string;
}

export default function DebtsComparisonPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Unified Debt Comparison Table
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All informal debts normalized into a single comparable metric (Effective Annual Cost - EAC).
          </p>
        </div>

        <Link
          href="/debts/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Add Debt
        </Link>
      </div>

      {debts.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center text-muted-foreground space-y-3 border border-border">
          <TableIcon className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="text-lg font-bold text-foreground">No debts registered</h3>
          <p className="text-xs max-w-sm mx-auto">
            Add informal loans to compare their true annual costs side-by-side.
          </p>
          <Link
            href="/debts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Add First Debt
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Lender & Type</th>
                <th className="py-3.5 px-4">Original Description</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-right">Effective Annual Cost (EAC)</th>
                <th className="py-3.5 px-4 text-right">Monthly Bleed</th>
                <th className="py-3.5 px-4">Financial Urgency</th>
                <th className="py-3.5 px-4">Relationship Weight</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {debts.map((debt) => (
                <tr key={debt.id} className="hover:bg-muted/30 transition-colors">
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
                    <UrgencyBadge urgencyTier={debt.urgencyTier} />
                  </td>

                  {/* Signal 2: Social Weight (Strictly Separated!) */}
                  <td className="py-4 px-4">
                    <SocialWeightBadge socialWeight={debt.socialWeight} lenderType={debt.lenderType} />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
