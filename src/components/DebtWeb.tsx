'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, Sparkles, X, Volume2, ShieldCheck, AlertCircle, Heart, Store, Landmark, Smartphone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { FinancialUrgencyBadge, RelationalUrgencyBadge, LenderTypeBadge } from '@/components/UrgencyBadge';
import { VoiceExplanationPlayer } from '@/components/VoiceExplanationPlayer';
import { generateDeterministicDebtExplanation } from '@/lib/explanationService';

interface WebDebt {
  id: string;
  lenderName: string;
  lenderType: string;
  principalAmount: number;
  remainingBalance: number;
  interestType: string;
  interestRate: number;
  effectiveAnnualCost: number;
  monthlyBleed: number;
  urgencyTier: 'high' | 'medium' | 'low';
  socialWeight: string;
}

interface DebtWebProps {
  debts: WebDebt[];
  className?: string;
}

export function DebtWeb({ debts, className = '' }: DebtWebProps) {
  const { language } = useLanguage();
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(debts[0]?.id || null);

  const selectedDebt = debts.find((d) => d.id === selectedDebtId) || debts[0] || null;

  // Compute node positions in a circular orbit around central "You" node
  const total = debts.length;
  const radius = 130; // SVG circle radius
  const centerX = 200;
  const centerY = 160;

  const nodes = debts.map((d, index) => {
    const angle = (index / (total || 1)) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Color by urgency
    let strokeColor = '#10b981'; // green / low
    if (d.effectiveAnnualCost >= 36) strokeColor = '#ef4444'; // red / high
    else if (d.effectiveAnnualCost >= 12) strokeColor = '#f59e0b'; // amber / medium

    return {
      ...d,
      x,
      y,
      strokeColor,
    };
  });

  const explanationText = selectedDebt
    ? generateDeterministicDebtExplanation(
        {
          lenderName: selectedDebt.lenderName,
          lenderType: selectedDebt.lenderType,
          principalAmount: selectedDebt.principalAmount,
          remainingBalance: selectedDebt.remainingBalance,
          interestType: selectedDebt.interestType,
          interestRate: selectedDebt.interestRate,
          effectiveAnnualCost: selectedDebt.effectiveAnnualCost,
          monthlyBleed: selectedDebt.monthlyBleed,
          financialUrgency: selectedDebt.urgencyTier,
          relationalUrgency: selectedDebt.socialWeight,
        },
        language
      )
    : '';

  return (
    <div className={`rounded-3xl bg-card border border-border shadow-sm overflow-hidden ${className}`}>
      <div className="p-6 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Visualization
          </span>
          <h2 className="font-display text-2xl font-bold text-foreground mt-0.5">
            Your Debt Web
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tap any node to view its plain-language AI explanation and audio breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High EAC</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 0% / Low</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* SVG Graph Web Canvas */}
        <div className="lg:col-span-7 p-4 flex items-center justify-center bg-muted/20 relative min-h-[340px]">
          <svg viewBox="0 0 400 320" className="w-full max-w-md h-auto select-none">
            {/* Background subtle rings */}
            <circle cx={centerX} cy={centerY} r={radius} className="stroke-border/70 fill-none" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={centerX} cy={centerY} r={radius * 0.55} className="stroke-border/40 fill-none" strokeWidth="1" />

            {/* Connecting tension threads from Center to each Satellite */}
            {nodes.map((n) => {
              const isSelected = n.id === selectedDebtId;
              return (
                <motion.line
                  key={`line-${n.id}`}
                  x1={centerX}
                  y1={centerY}
                  x2={n.x}
                  y2={n.y}
                  stroke={n.strokeColor}
                  strokeWidth={isSelected ? 3.5 : 1.8}
                  strokeOpacity={isSelected ? 1 : 0.4}
                  strokeDasharray={n.effectiveAnnualCost === 0 ? '3 3' : undefined}
                  animate={{ strokeOpacity: isSelected ? 1 : 0.4 }}
                  transition={{ duration: 0.3 }}
                />
              );
            })}

            {/* Center "You / Household" Node */}
            <g className="cursor-default">
              <circle cx={centerX} cy={centerY} r={28} className="fill-primary shadow-lg" />
              <text x={centerX} y={centerY + 4} textAnchor="middle" className="fill-primary-foreground font-display font-extrabold text-xs">
                YOU
              </text>
            </g>

            {/* Satellite Debt Nodes */}
            {nodes.map((n) => {
              const isSelected = n.id === selectedDebtId;
              return (
                <g
                  key={`node-${n.id}`}
                  onClick={() => setSelectedDebtId(n.id)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse when selected */}
                  {isSelected && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={24}
                      className="fill-none stroke-primary"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isSelected ? 20 : 16}
                    fill={n.strokeColor}
                    className="transition-all duration-200 group-hover:opacity-90 shadow-md"
                  />

                  {/* Icon or Initials */}
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    className="fill-white font-bold text-[10px] pointer-events-none"
                  >
                    ₹{(n.remainingBalance / 1000).toFixed(0)}k
                  </text>

                  {/* Node Label Below */}
                  <text
                    x={n.x}
                    y={n.y + (n.y > centerY ? 24 : -18)}
                    textAnchor="middle"
                    className={`text-[11px] font-bold fill-foreground transition-colors ${
                      isSelected ? 'fill-primary font-extrabold' : ''
                    }`}
                  >
                    {n.lenderName.length > 12 ? `${n.lenderName.slice(0, 10)}…` : n.lenderName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Detail & AI Explanation Panel */}
        <div className="lg:col-span-5 p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between bg-card">
          {selectedDebt ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Debt
                  </span>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    {selectedDebt.lenderName}
                  </h3>
                </div>
                <LenderTypeBadge lenderType={selectedDebt.lenderType} />
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Balance</div>
                  <div className="font-display text-lg font-extrabold text-foreground mt-0.5">
                    ₹{selectedDebt.remainingBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Amount still owed</div>
                </div>

                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">True Yearly Cost</div>
                  <div className="font-display text-lg font-extrabold text-primary mt-0.5">
                    {selectedDebt.effectiveAnnualCost}% <span className="text-xs font-normal text-muted-foreground">/ yr</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Effective Annual Cost (EAC)</div>
                </div>

                <div className="rounded-xl bg-background p-3 border border-border col-span-2">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Interest Drain</div>
                  <div className="font-display text-base font-extrabold text-destructive mt-0.5">
                    ₹{selectedDebt.monthlyBleed.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-muted-foreground ml-1">/mo draining away</span>
                  </div>
                </div>
              </div>

              {/* Signals */}
              <div className="flex flex-wrap gap-2">
                <FinancialUrgencyBadge urgencyTier={selectedDebt.urgencyTier} eac={selectedDebt.effectiveAnnualCost} />
                <RelationalUrgencyBadge socialWeight={selectedDebt.socialWeight} lenderType={selectedDebt.lenderType} />
              </div>

              {/* Voice & Explanation Player with Confidence Tag */}
              <VoiceExplanationPlayer
                text={explanationText}
                language={language}
                title="Debt Summary & Advice"
                isHighConfidence={selectedDebt.interestRate !== undefined}
                hasAssumptions={!selectedDebt.interestRate && selectedDebt.effectiveAnnualCost > 0}
                assumptionNotes={!selectedDebt.interestRate && selectedDebt.effectiveAnnualCost > 0
                  ? ['Interest rate was estimated based on your description.']
                  : undefined
                }
              />
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Select a node in the web to see its explanation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
