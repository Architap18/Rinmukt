'use client';

import React from 'react';
import { Debt } from '@/types/debt';
import { DebtCard } from './DebtCard';

interface DebtListProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export function DebtList({ debts, onEdit, onDelete }: DebtListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {debts.map((debt) => (
        <DebtCard
          key={debt.id}
          debt={debt}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
