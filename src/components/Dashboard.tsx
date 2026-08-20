'use client';

import React, { useState, useEffect } from 'react';
import { Debt } from '@/types/debt';
import { useLanguage } from '@/context/LanguageContext';
import { DebtSummary } from './DebtSummary';
import { DebtList } from './DebtList';
import { EmptyState } from './EmptyState';
import { AddDebtModal } from './AddDebtModal';
import { VoiceInput } from './VoiceInput';
import { PlusCircle, Mic } from 'lucide-react';

const STORAGE_KEY = 'rinmukt_debts_v1';

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
  const { t } = useLanguage();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string | undefined>(undefined);

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

  if (!isLoaded) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

        <div className="flex items-center gap-2">
          {/* Voice Input Button — now active */}
          <button
            type="button"
            onClick={() => setShowVoice((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showVoice
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : 'bg-muted/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
            title={t('voiceInputTitle')}
          >
            <Mic className={`w-3.5 h-3.5 ${showVoice ? 'text-white' : 'text-amber-600'}`} />
            <span>{t('voiceInput')}</span>
            {!showVoice && (
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                NEW
              </span>
            )}
          </button>

          {/* Add Debt Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {t('addDebt')}
          </button>
        </div>
      </div>

      {/* Voice Input Panel — slides in below the action bar */}
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
