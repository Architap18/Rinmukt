export type InterestUnit = 'none' | 'week' | 'month' | 'year' | 'one-time';

export interface Debt {
  id: string;
  lender: string;
  amount: number;
  interestRate: number;
  interestUnit: InterestUnit;
  repaymentNotes: string;
  dueDate: string;
}

export interface DebtFormData {
  lender: string;
  amount: string;
  interestRate: string;
  interestUnit: InterestUnit;
  repaymentNotes: string;
  dueDate: string;
}

export interface ValidationErrors {
  lender?: string;
  amount?: string;
  interestRate?: string;
}
