'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PlusCircle, ReceiptText } from 'lucide-react';

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center my-6 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4 shadow-sm">
        <ReceiptText className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-1">
        {t('emptyTitle')}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {t('emptySubtext')}
      </p>

      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
      >
        <PlusCircle className="w-4 h-4" />
        {t('addFirstDebt')}
      </button>
    </div>
  );
}
