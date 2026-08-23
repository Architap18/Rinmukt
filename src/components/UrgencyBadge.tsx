'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Heart, Store, Landmark, Smartphone, Users } from 'lucide-react';

interface FinancialUrgencyBadgeProps {
  urgencyTier: 'high' | 'medium' | 'low' | string;
  eac?: number;
  monthlyBleed?: number;
}

export function FinancialUrgencyBadge({ urgencyTier, eac, monthlyBleed }: FinancialUrgencyBadgeProps) {
  switch (urgencyTier) {
    case 'high':
      return (
        <span
          className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-600/25 shadow-xs"
          title="High financial cost — prioritise paying this down first"
          aria-label={`High cost priority debt${eac !== undefined ? `, ${eac}% effective annual cost (true yearly cost)` : ''}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>High Cost Priority {eac !== undefined && `(${eac}%)`}</span>
          </span>
          <span className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/70 pl-5">True yearly cost %</span>
        </span>
      );
    case 'medium':
      return (
        <span
          className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 shadow-xs"
          title="Moderate financial cost — worth watching closely"
          aria-label={`Medium cost debt${eac !== undefined ? `, ${eac}% effective annual cost (true yearly cost)` : ''}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Medium Cost {eac !== undefined && `(${eac}%)`}</span>
          </span>
          <span className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 pl-5">True yearly cost %</span>
        </span>
      );
    case 'low':
    default:
      return (
        <span
          className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shadow-xs"
          title="Low or zero financial cost — still has relational priority"
          aria-label={`Low cost debt${eac !== undefined ? `, ${eac}% effective annual cost` : ', 0% interest'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Low / 0% Interest {eac !== undefined && `(${eac}%)`}</span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400/70 pl-5">No interest draining away</span>
        </span>
      );
  }
}

// Backward-compatible alias
export const UrgencyBadge = FinancialUrgencyBadge;

interface RelationalUrgencyBadgeProps {
  socialWeight?: 'high' | 'medium' | 'low' | string;
  relationalUrgency?: 'high' | 'medium' | 'low' | string;
  lenderType?: string;
}

export function RelationalUrgencyBadge({ socialWeight, relationalUrgency, lenderType }: RelationalUrgencyBadgeProps) {
  const urgency = relationalUrgency || (socialWeight === 'high' || lenderType === 'relative' ? 'high' : socialWeight === 'medium' || lenderType === 'shopkeeper' || lenderType === 'chit_fund' ? 'medium' : 'low');

  if (urgency === 'high') {
    return (
      <span
        className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/25 shadow-xs"
        title="High personal relationship impact — family trust and goodwill at stake"
        aria-label="Family goodwill priority — personal relationship impact is high"
      >
        <span className="inline-flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Family Goodwill Priority</span>
        </span>
        <span className="text-[10px] font-semibold text-purple-600/70 dark:text-purple-400/70 pl-5">Personal relationship impact</span>
      </span>
    );
  }

  if (urgency === 'medium') {
    return (
      <span
        className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/25 shadow-xs"
        title="Moderate relationship impact — shop or community credit"
        aria-label="Kirana or store credit — moderate relationship weight"
      >
        <span className="inline-flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Kirana / Store Credit</span>
        </span>
        <span className="text-[10px] font-semibold text-sky-600/70 dark:text-sky-400/70 pl-5">Community relationship weight</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted text-muted-foreground border border-border"
      title="Commercial or app-based loan — no personal relationship risk"
      aria-label="Commercial or app loan — low personal relationship weight"
    >
      <span className="inline-flex items-center gap-1.5">
        {lenderType === 'moneylender' ? (
          <Landmark className="w-3.5 h-3.5" />
        ) : lenderType === 'bnpl' ? (
          <Smartphone className="w-3.5 h-3.5" />
        ) : (
          <Users className="w-3.5 h-3.5" />
        )}
        <span>Commercial / App Loan</span>
      </span>
      <span className="text-[10px] font-semibold opacity-60 pl-5">No relationship at risk</span>
    </span>
  );
}

// Backward-compatible alias
export const SocialWeightBadge = RelationalUrgencyBadge;

export function LenderTypeBadge({ lenderType }: { lenderType: string }) {
  switch (lenderType) {
    case 'relative':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          Relative / Family
        </span>
      );
    case 'shopkeeper':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          Shopkeeper Credit
        </span>
      );
    case 'moneylender':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Moneylender
        </span>
      );
    case 'bnpl':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          BNPL App
        </span>
      );
    case 'chit_fund':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Chit Fund
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border">
          Other Informal
        </span>
      );
  }
}
