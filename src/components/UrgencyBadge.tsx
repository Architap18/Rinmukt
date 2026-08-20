'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Heart, Store, Landmark, Smartphone, Users, HelpCircle } from 'lucide-react';

interface UrgencyBadgeProps {
  urgencyTier: 'high' | 'medium' | 'low';
  eac?: number;
}

export function UrgencyBadge({ urgencyTier, eac }: UrgencyBadgeProps) {
  switch (urgencyTier) {
    case 'high':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-urgency-high-bg text-urgency-high-text border border-urgency-high-border">
          <AlertCircle className="w-3.5 h-3.5" />
          High Urgency {eac !== undefined && `(${eac}% EAC)`}
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-urgency-medium-bg text-urgency-medium-text border border-urgency-medium-border">
          <AlertTriangle className="w-3.5 h-3.5" />
          Moderate Urgency {eac !== undefined && `(${eac}% EAC)`}
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-urgency-low-bg text-urgency-low-text border border-urgency-low-border">
          <ShieldCheck className="w-3.5 h-3.5" />
          Low Urgency {eac !== undefined && `(${eac}% EAC)`}
        </span>
      );
    default:
      return null;
  }
}

interface SocialWeightBadgeProps {
  socialWeight: 'high' | 'medium' | 'low' | string;
  lenderType?: string;
}

export function SocialWeightBadge({ socialWeight, lenderType }: SocialWeightBadgeProps) {
  const isHigh = socialWeight === 'high' || lenderType === 'relative';
  const isMed = socialWeight === 'medium' || lenderType === 'shopkeeper' || lenderType === 'chit_fund';

  let icon = <Users className="w-3.5 h-3.5" />;
  let label = 'Low Social Weight';
  let badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (isHigh) {
    icon = <Heart className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    label = 'High Personal / Relationship Weight';
    badgeStyle = 'bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900';
  } else if (isMed) {
    icon = <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
    label = 'Medium Goodwill Weight';
    badgeStyle = 'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-900';
  } else {
    if (lenderType === 'moneylender') icon = <Landmark className="w-3.5 h-3.5 text-slate-600" />;
    if (lenderType === 'bnpl') icon = <Smartphone className="w-3.5 h-3.5 text-slate-600" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeStyle}`}>
      {icon}
      {label}
    </span>
  );
}

export function LenderTypeBadge({ lenderType }: { lenderType: string }) {
  switch (lenderType) {
    case 'relative':
      return <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Relative / Family</span>;
    case 'shopkeeper':
      return <span className="text-xs font-medium text-sky-700 dark:text-sky-300">Shopkeeper Credit</span>;
    case 'moneylender':
      return <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Moneylender</span>;
    case 'bnpl':
      return <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">BNPL App</span>;
    case 'chit_fund':
      return <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Chit Fund</span>;
    default:
      return <span className="text-xs font-medium text-muted-foreground">Other Informal</span>;
  }
}
