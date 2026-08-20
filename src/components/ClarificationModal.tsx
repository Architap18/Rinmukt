'use client';

import React, { useState } from 'react';
import { HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExtractedDebt } from '@/lib/llmExtraction';

interface ClarificationModalProps {
  isOpen: boolean;
  question: string;
  extracted: ExtractedDebt;
  onResolved: (updated: ExtractedDebt) => void;
  onCancel: () => void;
}

export function ClarificationModal({
  isOpen,
  question,
  extracted,
  onResolved,
  onCancel,
}: ClarificationModalProps) {
  const [selectedInterestType, setSelectedInterestType] = useState<'flat_monthly' | 'compound_monthly' | 'one_time_flat' | 'none'>('flat_monthly');
  const [rateInput, setRateInput] = useState<string>(extracted.interestRate > 0 ? extracted.interestRate.toString() : '5');
  const [horizonInput, setHorizonInput] = useState<string>('12');

  if (!isOpen) return null;

  const handleResolve = () => {
    const rate = parseFloat(rateInput) || 0;
    const horizon = parseInt(horizonInput, 10) || 12;

    const resolved: ExtractedDebt = {
      ...extracted,
      interestType: selectedInterestType,
      interestRate: selectedInterestType === 'none' ? 0 : rate,
      durationMonths: horizon,
      ambiguous: false,
      clarificationQuestion: null,
    };

    onResolved(resolved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">Clarification Needed</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              To ensure accurate interest normalization (Effective Annual Cost), please clarify the exact interest terms for <strong className="text-foreground">{extracted.lenderName}</strong>.
            </p>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="mt-4 rounded-xl bg-muted/60 p-4 border border-border text-sm font-medium text-foreground">
          {question}
        </div>

        {/* Options Selection */}
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Select Interest Model
          </label>

          <div className="grid grid-cols-1 gap-2">
            <label
              className={`flex items-center justify-between rounded-xl p-3.5 border cursor-pointer transition-all ${
                selectedInterestType === 'flat_monthly'
                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="interestType"
                  value="flat_monthly"
                  checked={selectedInterestType === 'flat_monthly'}
                  onChange={() => setSelectedInterestType('flat_monthly')}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-semibold">Flat Rate Per Month</div>
                  <div className="text-xs text-muted-foreground">Charged on original amount every month (e.g. 5% per month)</div>
                </div>
              </div>
            </label>

            <label
              className={`flex items-center justify-between rounded-xl p-3.5 border cursor-pointer transition-all ${
                selectedInterestType === 'compound_monthly'
                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="interestType"
                  value="compound_monthly"
                  checked={selectedInterestType === 'compound_monthly'}
                  onChange={() => setSelectedInterestType('compound_monthly')}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-semibold">Compounding Monthly Rate</div>
                  <div className="text-xs text-muted-foreground">Interest compounds on remaining balance monthly</div>
                </div>
              </div>
            </label>

            <label
              className={`flex items-center justify-between rounded-xl p-3.5 border cursor-pointer transition-all ${
                selectedInterestType === 'one_time_flat'
                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="interestType"
                  value="one_time_flat"
                  checked={selectedInterestType === 'one_time_flat'}
                  onChange={() => setSelectedInterestType('one_time_flat')}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-semibold">One-Time Fee / Lump Sum</div>
                  <div className="text-xs text-muted-foreground">Fixed fee or lump sum percentage for borrowing</div>
                </div>
              </div>
            </label>

            <label
              className={`flex items-center justify-between rounded-xl p-3.5 border cursor-pointer transition-all ${
                selectedInterestType === 'none'
                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="interestType"
                  value="none"
                  checked={selectedInterestType === 'none'}
                  onChange={() => setSelectedInterestType('none')}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-semibold">Zero Interest (0%)</div>
                  <div className="text-xs text-muted-foreground">Friendly or family loan with no interest charge</div>
                </div>
              </div>
            </label>
          </div>

          {selectedInterestType !== 'none' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Horizon (Months)</label>
                <input
                  type="number"
                  value={horizonInput}
                  onChange={(e) => setHorizonInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="12"
                />
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResolve}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Terms & Save Debt
          </button>
        </div>
      </div>
    </div>
  );
}
