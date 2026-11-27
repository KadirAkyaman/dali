import { CurrencyCode } from './client';

export type ExpenseCategory = 'software' | 'advertising' | 'operations' | 'equipment' | 'other';

export interface Expense {
  id: string;
  title: string;
  vendor?: string | null;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  spent_at: string;
  note?: string | null;
  created_at: string;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  software: 'Yazılım & sistemler',
  advertising: 'Reklam & pazarlama',
  operations: 'Operasyon',
  equipment: 'Ekipman',
  other: 'Diğer',
};
