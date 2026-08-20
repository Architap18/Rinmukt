'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/lib/translations';
import { Globe } from 'lucide-react';

export function Header() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="w-full bg-card border-b border-border shadow-sm py-4 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-600/20 shrink-0">
            {/* Knot / Untangle Icon */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12c3-4 6 4 9 0s6 4 7 0" />
              <path d="M4 16c3-4 6 4 9 0s6 4 7 0" opacity="0.7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              {t('appTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-muted/70 p-1 rounded-xl border border-border">
            <Globe className="w-4 h-4 text-amber-600 ml-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-2 py-1"
              aria-label="Select language"
            >
              <option value="en" className="bg-card text-foreground">English</option>
              <option value="hi" className="bg-card text-foreground">हिन्दी (Hindi)</option>
              <option value="mr" className="bg-card text-foreground">मराठी (Marathi)</option>
            </select>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('privateStorage')}
          </span>
        </div>
      </div>
    </header>
  );
}
