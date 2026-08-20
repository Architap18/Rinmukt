'use client';

import React from 'react';
import { Debt } from '@/types/debt';
import { useLanguage } from '@/context/LanguageContext';
import { Wallet, CreditCard } from 'lucide-react';

interface DebtSummaryProps {
  debts: Debt[];
}

export function DebtSummary({ debts }: DebtSummaryProps) {
  const { t } = useLanguage();
  const totalAmount = debts.reduce((sum, debt) => sum + (Number(debt.amount) || 0), 0);
  const activeDebtsCount = debts.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Total Debt Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {t('totalInformalDebt')}
          </span>
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {formatCurrency(totalAmount)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('totalDebtSubtext')}
        </p>
      </div>

      {/* Active Debts Count Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {t('activeDebts')}
          </span>
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {activeDebtsCount} {activeDebtsCount === 1 ? t('debtSingular') : t('debtPlural')}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {activeDebtsCount > 0 ? t('activeDebtsSubtext') : t('noActiveDebtsSubtext')}
        </p>
      </div>
    </div>
  );
}
