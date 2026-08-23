'use client';

import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface ClearDebtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClearDebtsModal({ isOpen, onClose, onSuccess }: ClearDebtsModalProps) {
  const { t } = useLanguage();
  const { clearDebts } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClearAll = () => {
    setLoading(true);
    try {
      clearDebts();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to clear debts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 sm:p-7 shadow-2xl border border-border space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
              {t('clearDebtsTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('clearDebtsText')}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-border font-bold text-sm text-foreground hover:bg-muted min-h-[44px]"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleClearAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-sm text-white shadow-sm disabled:opacity-50 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Clearing...' : t('confirmClear')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClearDebtsButton({ onDataReset, className = '' }: { onDataReset?: () => void; className?: string }) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 transition-colors min-h-[40px] ${className}`}
        title={t('navClearAll')}
      >
        <Trash2 className="w-4 h-4" />
        <span>{t('navClearAll')}</span>
      </button>

      <ClearDebtsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={onDataReset}
      />
    </>
  );
}

export function TrustNotice({ className = '' }: { className?: string }) {
  const [dismissed, setDismissed] = React.useState(false);

  // Persist dismiss across page navigations within the session
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem('rinmukht_trust_dismissed') === '1';
      setDismissed(isDismissed);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rinmukht_trust_dismissed', '1');
    }
  };

  if (dismissed) return null;

  return (
    <div className={`rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/25 px-5 py-4 flex items-start gap-4 shadow-xs ${className}`}>
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 mt-0.5">
        <AlertTriangle className="w-5 h-5" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
          Rinmukht helps you understand and compare the debts you entered.{' '}
          <span className="font-semibold">It does not provide guaranteed financial, legal, or lending advice.</span>
        </p>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
          <strong>Your privacy:</strong> All debt details are stored only in your Rinmukht account in this browser. We do not share, sell, or transmit your data to third parties. You can delete all your data at any time using the &quot;Clear Debts&quot; button.
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"
        aria-label="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
