'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Debt } from '@/types/debt';
import { useLanguage } from '@/context/LanguageContext';
import { DebtSummary } from './DebtSummary';
import { DebtList } from './DebtList';
import { EmptyState } from './EmptyState';
import { AddDebtModal } from './AddDebtModal';
import { VoiceInput } from './VoiceInput';
import { TrustNotice } from './TrustNotice';
import {
  PlusCircle,
  Mic,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Table,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEY = 'rinmukht_debts_v1';

const INITIAL_SAMPLE_DEBTS: Debt[] = [
  {
    id: 'demo-1',
    lender: 'Sahukar Moneylender',
    amount: 10000,
    interestRate: 5,
    interestUnit: 'month',
    repaymentNotes: 'Pay ₹500 interest every month; principal due when possible.',
    dueDate: '2026-12-31',
  },
  {
    id: 'demo-2',
    lender: 'Gupta Kirana Store',
    amount: 3500,
    interestRate: 10,
    interestUnit: 'one-time',
    repaymentNotes: 'Udhar for daily groceries, pay when next harvest or wage arrives.',
    dueDate: '2026-10-15',
  },
];

export function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string | undefined>(undefined);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoadedBanner, setDemoLoadedBanner] = useState(false);

  // Voice input panel visibility
  const [showVoice, setShowVoice] = useState(false);

  // Load debts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDebts(parsed);
        } else {
          setDebts(INITIAL_SAMPLE_DEBTS);
        }
      } else {
        setDebts(INITIAL_SAMPLE_DEBTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_DEBTS));
      }
    } catch (e) {
      console.error('Failed to load debts from localStorage:', e);
      setDebts(INITIAL_SAMPLE_DEBTS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveDebtsState = (newDebts: Debt[]) => {
    setDebts(newDebts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDebts));
    } catch (e) {
      console.error('Failed to save debts to localStorage:', e);
    }
  };

  const handleOpenAddModal = (prefill?: string) => {
    setEditingDebt(null);
    setPrefillNotes(prefill);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setPrefillNotes(undefined);
    setIsModalOpen(true);
  };

  const handleSaveDebt = (debtData: Omit<Debt, 'id'>, editId?: string) => {
    if (editId) {
      const updated = debts.map((d) => (d.id === editId ? { ...debtData, id: editId } : d));
      saveDebtsState(updated);
    } else {
      const newDebt: Debt = {
        ...debtData,
        id: 'debt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      };
      saveDebtsState([newDebt, ...debts]);
    }
  };

  const handleDeleteDebt = (id: string) => {
    const filtered = debts.filter((d) => d.id !== id);
    saveDebtsState(filtered);
  };

  // Voice flow: transcript accepted → open Add Debt modal pre-filled with transcript
  const handleTranscriptAccepted = (transcript: string) => {
    setShowVoice(false);
    handleOpenAddModal(transcript);
  };

  // 1-Click Demo Mode Loader
  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      if (res.ok) {
        setDemoLoadedBanner(true);
        // Refresh local demo debts
        const demoLocalDebts: Debt[] = [
          {
            id: 'demo-chacha',
            lender: 'Chacha',
            amount: 5000,
            interestRate: 0,
            interestUnit: 'none',
            repaymentNotes: 'Family goodwill loan, 0% interest',
            dueDate: '',
          },
          {
            id: 'demo-kirana',
            lender: 'Kirana Shop',
            amount: 2000,
            interestRate: 0,
            interestUnit: 'none',
            repaymentNotes: 'Udhar for daily groceries, pay at month end',
            dueDate: '',
          },
          {
            id: 'demo-money',
            lender: 'Moneylender',
            amount: 10000,
            interestRate: 5,
            interestUnit: 'month',
            repaymentNotes: '5% monthly interest bleed',
            dueDate: '',
          },
          {
            id: 'demo-bnpl',
            lender: 'BNPL App',
            amount: 4000,
            interestRate: 3,
            interestUnit: 'month',
            repaymentNotes: 'Compounding app fees, due in 15 days',
            dueDate: '',
          },
        ];
        saveDebtsState(demoLocalDebts);
      }
    } catch (err) {
      console.error('Failed to load demo dataset', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">

      {/* Demo Mode Action Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-purple-500/10 p-5 border border-primary/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Instant 60-Second Judge Walkthrough
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Explore with Synthetic Example Data
          </h3>
          <p className="text-xs text-muted-foreground">
            Loads: <strong>Chacha (₹5k 0%)</strong>, <strong>Kirana (₹2k)</strong>, <strong>Moneylender (₹10k 5%/mo)</strong>, and <strong>BNPL (₹4k)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loadingDemo ? 'Loading Synthetic Data...' : '⚡ Load Demo Example'}</span>
          </button>
        </div>
      </div>

      {demoLoadedBanner && (
        <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Demo dataset loaded! Follow the full 6-Step Pipeline through to audio explanation:</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
          >
            View Debt Web & Stats →
          </Link>
        </div>
      )}

      {/* Debt Summary */}
      <DebtSummary debts={debts} />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            {t('yourDebtRegister')}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {t('manualEntry')}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('registerSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={() => setShowVoice((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showVoice
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
            }`}
            title={t('voiceInputTitle')}
          >
            <Mic className={`w-3.5 h-3.5 ${showVoice ? 'text-primary-foreground' : 'text-primary'}`} />
            <span>{t('voiceInput')}</span>
          </button>

          {/* Add Debt Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {t('addDebt')}
          </button>
        </div>
      </div>

      {/* Voice Input Panel */}
      {showVoice && (
        <VoiceInput
          onTranscriptAccepted={handleTranscriptAccepted}
          onCancel={() => setShowVoice(false)}
        />
      )}

      {/* Main Content Area */}
      {debts.length === 0 ? (
        <EmptyState onAddClick={() => handleOpenAddModal()} />
      ) : (
        <DebtList debts={debts} onEdit={handleOpenEditModal} onDelete={handleDeleteDebt} />
      )}

      {/* Guided Next Step Journey Card */}
      {debts.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              Step 4 & 5 of 6 • Financial Intelligence
            </div>
            <h4 className="font-display text-base font-bold text-foreground mt-0.5">
              Ready to see your Debt Web and payoff simulator?
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyze true Effective Annual Cost (EAC), financial vs relational urgency, and plain-language explanations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              <span>Explore Debt Web & Stats</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Add / Edit Debt Modal */}
      <AddDebtModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setPrefillNotes(undefined); }}
        onSave={handleSaveDebt}
        editingDebt={editingDebt}
        prefillNotes={prefillNotes}
      />
    </div>
  );
}
