'use client';

import React, { useState, useEffect } from 'react';
import { Debt, DebtFormData, InterestUnit, ValidationErrors } from '@/types/debt';
import { useLanguage } from '@/context/LanguageContext';
import { X, AlertCircle, Save, Calendar, User, Percent } from 'lucide-react';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debtData: Omit<Debt, 'id'>, editId?: string) => void;
  editingDebt?: Debt | null;
  /** Pre-populate repayment notes from voice transcript */
  prefillNotes?: string;
}

import { fallbackExtraction } from '@/lib/llmExtraction';

export function AddDebtModal({ isOpen, onClose, onSave, editingDebt, prefillNotes }: AddDebtModalProps) {
  const { t } = useLanguage();

  const [formData, setFormData] = useState<DebtFormData>({
    lender: '',
    amount: '',
    interestRate: '',
    interestUnit: 'month',
    repaymentNotes: '',
    dueDate: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (editingDebt) {
      setFormData({
        lender: editingDebt.lender || '',
        amount: editingDebt.amount ? String(editingDebt.amount) : '',
        interestRate: editingDebt.interestRate !== undefined ? String(editingDebt.interestRate) : '',
        interestUnit: editingDebt.interestUnit || 'month',
        repaymentNotes: editingDebt.repaymentNotes || '',
        dueDate: editingDebt.dueDate || '',
      });
    } else if (prefillNotes && prefillNotes.trim().length > 0) {
      const parsed = fallbackExtraction(prefillNotes);
      let unit: InterestUnit = 'month';
      if (parsed.interestType === 'none') unit = 'none';
      else if (parsed.interestType === 'one_time_flat') unit = 'one-time';

      setFormData({
        lender: parsed.lenderName && parsed.lenderName !== 'Lender' ? parsed.lenderName : '',
        amount: parsed.principalAmount > 0 ? String(parsed.principalAmount) : '',
        interestRate: parsed.interestRate !== null && parsed.interestRate > 0 ? String(parsed.interestRate) : '',
        interestUnit: unit,
        repaymentNotes: prefillNotes,
        dueDate: '',
      });
    } else {
      setFormData({
        lender: '',
        amount: '',
        interestRate: '',
        interestUnit: 'month',
        repaymentNotes: '',
        dueDate: '',
      });
    }
    setErrors({});
  }, [editingDebt, isOpen, prefillNotes]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.lender.trim()) {
      newErrors.lender = t('errLender');
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = t('errAmount');
    }

    if (formData.interestUnit !== 'none') {
      const numRate = parseFloat(formData.interestRate);
      if (isNaN(numRate) || numRate < 0) {
        newErrors.interestRate = t('errRate');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Omit<Debt, 'id'> = {
      lender: formData.lender.trim(),
      amount: parseFloat(formData.amount),
      interestUnit: formData.interestUnit,
      interestRate: formData.interestUnit === 'none' ? 0 : parseFloat(formData.interestRate || '0'),
      repaymentNotes: formData.repaymentNotes.trim(),
      dueDate: formData.dueDate,
    };

    onSave(payload, editingDebt?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-card border border-border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {editingDebt ? t('editTitle') : t('addTitle')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {editingDebt ? t('editSub') : t('addSub')}
            </p>
            {!editingDebt && prefillNotes && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                🎤 From voice input
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Who do you owe? */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t('whoDoYouOwe')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder={t('lenderPlaceholder')}
                value={formData.lender}
                onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.lender ? 'border-red-500 bg-red-50/20' : 'border-border'
                }`}
              />
            </div>
            {errors.lender && (
              <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.lender}
              </p>
            )}
          </div>

          {/* Amount Owed */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t('amountOwed')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground font-semibold">
                ₹
              </div>
              <input
                type="number"
                step="any"
                placeholder={t('amountPlaceholder')}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  errors.amount ? 'border-red-500 bg-red-50/20' : 'border-border'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Interest Unit */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t('interestUnit')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.interestUnit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interestUnit: e.target.value as InterestUnit,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            >
              <option value="none">{t('unitNone')}</option>
              <option value="week">{t('unitWeek')}</option>
              <option value="month">{t('unitMonth')}</option>
              <option value="year">{t('unitYear')}</option>
              <option value="one-time">{t('unitOneTime')}</option>
            </select>
          </div>

          {/* Interest Rate (Conditionally active) */}
          {formData.interestUnit !== 'none' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {t('interestRate')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Percent className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder={t('ratePlaceholder')}
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    errors.interestRate ? 'border-red-500 bg-red-50/20' : 'border-border'
                  }`}
                />
              </div>
              {errors.interestRate && (
                <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.interestRate}
                </p>
              )}
            </div>
          )}

          {/* Repayment Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t('repaymentNotes')}
            </label>
            <div className="relative">
              <textarea
                rows={2}
                placeholder={t('notesPlaceholder')}
                value={formData.repaymentNotes}
                onChange={(e) => setFormData({ ...formData, repaymentNotes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t('dueDateLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              {editingDebt ? t('updateDebt') : t('saveDebt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
