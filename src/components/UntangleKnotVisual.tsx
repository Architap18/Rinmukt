'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sliders, CheckCircle2 } from 'lucide-react';

interface UntangleKnotVisualProps {
  progressPercentage: number; // 0 (100% tangled) to 100 (100% untangled / paid off)
  totalDebtCount?: number;
}

export function UntangleKnotVisual({ progressPercentage, totalDebtCount = 4 }: UntangleKnotVisualProps) {
  // Allow interactive simulation slider for judge walkthrough
  const [overrideProgress, setOverrideProgress] = useState<number | null>(null);

  const effectiveProgress = overrideProgress !== null ? overrideProgress : progressPercentage;
  const p = Math.min(1, Math.max(0, effectiveProgress / 100));
  // Tangle factor: 1 = fully tangled, 0 = fully untangled/straight
  const t = 1 - p;

  const getKnotStateLabel = () => {
    if (effectiveProgress >= 100) return { label: '🎉 Fully Untangled & Debt Free!', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' };
    if (effectiveProgress >= 65) return { label: '🌿 Major Knot Loosened — High Relief', color: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-300' };
    if (effectiveProgress >= 30) return { label: '⚡ Unwinding Underway — Bleed Reduced', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
    return { label: '🪢 Entangled Obligations — High Bleed', color: 'text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border-orange-300' };
  };

  const status = getKnotStateLabel();

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-card p-5 sm:p-7 shadow-md border border-border">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Debt Untangling Visualizer
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Live State
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Visualizes complex informal loan overlap relaxing into straight parallel payoff paths.
          </p>
        </div>

        <div className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-bold border ${status.color} shadow-xs shrink-0 inline-flex items-center gap-1.5`}>
          <Sparkles className="w-4 h-4" />
          <span>{status.label}</span>
        </div>
      </div>

      {/* SVG Canvas for Knot Physics */}
      <div className="h-36 sm:h-44 w-full flex items-center justify-center relative bg-muted/40 dark:bg-muted/20 rounded-2xl p-4 overflow-hidden border border-border/50">
        <svg viewBox="0 0 500 120" className="w-full h-full stroke-current overflow-visible" fill="none" strokeWidth="3.5" strokeLinecap="round">
          {/* Thread 1: Moneylender (Amber/Red) */}
          <motion.path
            d={`M 20 25 C ${120 + 80 * t} ${25 + 90 * t}, ${260 - 80 * t} ${100 - 80 * t}, 480 25`}
            className="text-amber-600 dark:text-amber-400 drop-shadow-sm"
            animate={{
              d: `M 20 25 C ${120 + 80 * t} ${25 + 90 * t}, ${260 - 80 * t} ${100 - 80 * t}, 480 25`,
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {/* Thread 2: BNPL App (Orange) */}
          <motion.path
            d={`M 20 50 C ${160 - 70 * t} ${105 - 55 * t}, ${300 + 70 * t} ${15 + 65 * t}, 480 50`}
            className="text-orange-500 dark:text-orange-400 drop-shadow-sm"
            animate={{
              d: `M 20 50 C ${160 - 70 * t} ${105 - 55 * t}, ${300 + 70 * t} ${15 + 65 * t}, 480 50`,
            }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
          />

          {/* Thread 3: Family / Relatives (Purple) */}
          <motion.path
            d={`M 20 75 C ${190 + 70 * t} ${15 + 75 * t}, ${330 - 70 * t} ${110 - 65 * t}, 480 75`}
            className="text-purple-600 dark:text-purple-400 drop-shadow-sm"
            animate={{
              d: `M 20 75 C ${190 + 70 * t} ${15 + 75 * t}, ${330 - 70 * t} ${110 - 65 * t}, 480 75`,
            }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          />

          {/* Thread 4: Shopkeeper (Sky Blue) */}
          <motion.path
            d={`M 20 100 C ${140 - 50 * t} ${115 - 65 * t}, ${370 + 40 * t} ${15 + 70 * t}, 480 100`}
            className="text-sky-600 dark:text-sky-400 drop-shadow-sm"
            animate={{
              d: `M 20 100 C ${140 - 50 * t} ${115 - 65 * t}, ${370 + 40 * t} ${15 + 70 * t}, 480 100`,
            }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          />

          {/* Tangled friction focal points */}
          {t > 0.08 && (
            <motion.g
              animate={{ opacity: t, scale: 0.6 + 0.4 * t }}
              transition={{ duration: 0.4 }}
            >
              <circle cx="210" cy="60" r={14 * t} className="fill-amber-500/20 stroke-amber-600 dark:stroke-amber-400" strokeWidth="2.5" />
              <circle cx="290" cy="55" r={12 * t} className="fill-purple-500/20 stroke-purple-600 dark:stroke-purple-400" strokeWidth="2.5" />
              <circle cx="250" cy="80" r={10 * t} className="fill-sky-500/20 stroke-sky-600 dark:stroke-sky-400" strokeWidth="2" />
            </motion.g>
          )}
        </svg>
      </div>

      {/* Thread Legend & Interactive Scrubber */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Moneylender</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> BNPL App</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Family / Goodwill</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> Shopkeeper Credit</span>
        </div>

        {/* Interactive Scrub Toggle for Judges */}
        <div className="flex items-center gap-2 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-foreground">Interactive Knot Test:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={effectiveProgress}
            onChange={(e) => setOverrideProgress(Number(e.target.value))}
            className="w-28 sm:w-36 accent-amber-600 cursor-pointer h-2 bg-muted rounded-lg"
            title="Drag to see how knot straightens as debt is paid"
          />
          <span className="text-xs font-mono font-bold text-amber-600 min-w-[36px]">
            {Math.round(effectiveProgress)}%
          </span>
          {overrideProgress !== null && (
            <button
              onClick={() => setOverrideProgress(null)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
