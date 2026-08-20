'use client';

import React from 'react';
import { Debt } from '@/types/debt';
import { useLanguage } from '@/context/LanguageContext';
import { Pencil, Trash2, Calendar, FileText, Percent, User } from 'lucide-react';

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export function DebtCard({ debt, onEdit, onDelete }: DebtCardProps) {
  const { t } = useLanguage();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getInterestText = () => {
    switch (debt.interestUnit) {
      case 'none':
        return t('noInterest');
      case 'week':
        return t('perWeek', { rate: debt.interestRate });
      case 'month':
        return t('perMonth', { rate: debt.interestRate });
      case 'year':
        return t('perYear', { rate: debt.interestRate });
      case 'one-time':
        return t('oneTimeFee', { rate: debt.interestRate });
      default:
        return debt.interestRate ? `${debt.interestRate}%` : t('noInterest');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('notSet');
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group">
      <div>
        {/* Header: Lender & Amount */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground tracking-tight line-clamp-1">
                {debt.lender}
              </h3>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full mt-0.5">
                <Percent className="w-3 h-3" />
                <span>{getInterestText()}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              {t('owed')}
            </span>
            <span className="text-xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(debt.amount)}
            </span>
          </div>
        </div>

        {/* Details: Repayment notes & Due date */}
        <div className="space-y-2 text-sm">
          {debt.repaymentNotes && (
            <div className="flex items-start gap-2 text-muted-foreground bg-muted/50 p-2.5 rounded-xl text-xs">
              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
              <p className="line-clamp-2 italic">{debt.repaymentNotes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {t('dueDate')}
            </span>
            <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
              {formatDate(debt.dueDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={() => onEdit(debt)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
          title={t('edit')}
        >
          <Pencil className="w-3.5 h-3.5 text-amber-600" />
          {t('edit')}
        </button>

        <button
          type="button"
          onClick={() => onDelete(debt.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900 transition-colors"
          title={t('delete')}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
