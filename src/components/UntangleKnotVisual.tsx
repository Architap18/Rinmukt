'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface UntangleKnotVisualProps {
  progressPercentage: number; // 0 (100% tangled) to 100 (100% untangled / paid off)
  totalDebtCount?: number;
}

export function UntangleKnotVisual({ progressPercentage, totalDebtCount = 4 }: UntangleKnotVisualProps) {
  // Normalize progress (0 to 1)
  const p = Math.min(1, Math.max(0, progressPercentage / 100));

  // Tangle factor: 1 when 0% paid off (fully tangled), 0 when 100% paid off (straight lines)
  const t = 1 - p;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Untangling Journey</h3>
          <p className="text-xs text-muted-foreground">
            {progressPercentage === 100
              ? '🎉 All knots completely untangled! You are debt-free.'
              : `${Math.round(progressPercentage)}% untangled — ${totalDebtCount} active debts normalized.`}
          </p>
        </div>
        <div className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
          {Math.round(progressPercentage)}% Clear
        </div>
      </div>

      <div className="h-32 w-full flex items-center justify-center relative bg-muted/40 rounded-xl p-4 overflow-hidden">
        <svg viewBox="0 0 400 100" className="w-full h-full stroke-current text-primary" fill="none" strokeWidth="3" strokeLinecap="round">
          {/* Thread 1: High Interest (Terracotta) */}
          <motion.path
            d={`M 20 20 C ${100 + 40 * t} ${20 + 70 * t}, ${200 - 60 * t} ${80 - 60 * t}, 380 20`}
            className="text-amber-600 dark:text-amber-500"
            animate={{
              d: `M 20 20 C ${100 + 40 * t} ${20 + 70 * t}, ${200 - 60 * t} ${80 - 60 * t}, 380 20`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {/* Thread 2: Medium Interest (Orange) */}
          <motion.path
            d={`M 20 40 C ${120 - 50 * t} ${80 - 40 * t}, ${220 + 50 * t} ${10 + 50 * t}, 380 40`}
            className="text-orange-600 dark:text-orange-400"
            animate={{
              d: `M 20 40 C ${120 - 50 * t} ${80 - 40 * t}, ${220 + 50 * t} ${10 + 50 * t}, 380 40`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.1 }}
          />

          {/* Thread 3: Social / Family (Purple) */}
          <motion.path
            d={`M 20 60 C ${150 + 60 * t} ${10 + 60 * t}, ${250 - 50 * t} ${90 - 50 * t}, 380 60`}
            className="text-purple-600 dark:text-purple-400"
            animate={{
              d: `M 20 60 C ${150 + 60 * t} ${10 + 60 * t}, ${250 - 50 * t} ${90 - 50 * t}, 380 60`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
          />

          {/* Thread 4: Shopkeeper (Sky Blue) */}
          <motion.path
            d={`M 20 80 C ${110 - 30 * t} ${90 - 50 * t}, ${290 + 30 * t} ${10 + 50 * t}, 380 80`}
            className="text-sky-600 dark:text-sky-400"
            animate={{
              d: `M 20 80 C ${110 - 30 * t} ${90 - 50 * t}, ${290 + 30 * t} ${10 + 50 * t}, 380 80`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.3 }}
          />

          {/* Dynamic Knot Points that smooth out as progress increases */}
          {t > 0.05 && (
            <motion.g
              animate={{ opacity: t }}
              transition={{ duration: 0.5 }}
            >
              <circle cx="180" cy="50" r={10 * t} className="fill-amber-500/20 stroke-amber-600" strokeWidth="2" />
              <circle cx="240" cy="45" r={8 * t} className="fill-purple-500/20 stroke-purple-600" strokeWidth="2" />
            </motion.g>
          )}
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}
