import { Expense } from '../types/expense';

const STORAGE_KEY = 'dali_expenses';

export class LocalExpenseRepository {
  getExpenses(): Expense[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed as Expense[] : [];
    } catch {
      return [];
    }
  }

  saveExpenses(expenses: Expense[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Giderler kaydedilemedi:', error);
    }
  }

  createExpense(data: Omit<Expense, 'id' | 'created_at'>): Expense {
    const expenses = this.getExpenses();
    const expense: Expense = {
      ...data,
      id: `expense-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    expenses.unshift(expense);
    this.saveExpenses(expenses);
    return expense;
  }

  deleteExpense(id: string): boolean {
    const expenses = this.getExpenses();
    const filtered = expenses.filter((expense) => expense.id !== id);
    if (filtered.length === expenses.length) return false;
    this.saveExpenses(filtered);
    return true;
  }
}

export const localExpenseRepository = new LocalExpenseRepository();
