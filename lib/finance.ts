import { Transaction, Budget } from './storage';
import { CategoryId } from '@/constants/categories';

// ─── Currency symbols ─────────────────────────────────────────────────────────
export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$',   name: 'US Dollar'     },
  EUR: { symbol: '€',   name: 'Euro'          },
  GBP: { symbol: '£',   name: 'British Pound' },
  NGN: { symbol: '₦',   name: 'Naira'         },
  GHS: { symbol: 'GH₵', name: 'Cedi'          },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling'},
  ZAR: { symbol: 'R',   name: 'Rand'          },
  JPY: { symbol: '¥',   name: 'Japanese Yen'  },
  INR: { symbol: '₹',   name: 'Indian Rupee'  },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar'},
};

export function fmt(amount: number, currency = 'USD'): string {
  const sym = CURRENCIES[currency]?.symbol ?? currency;
  const abs = Math.abs(amount);
  const formatted = abs >= 1_000_000
    ? `${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
    ? `${(abs / 1_000).toFixed(1)}k`
    : abs.toFixed(2);
  return `${sym}${formatted}`;
}

// ─── Aggregates ───────────────────────────────────────────────────────────────
export function totalIncome(txs: Transaction[])  { return txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0); }
export function totalExpense(txs: Transaction[]) { return txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0); }
export function balance(txs: Transaction[])      { return totalIncome(txs) - totalExpense(txs); }

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function thisMonth(txs: Transaction[]) {
  const now = new Date();
  return txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

export function thisWeek(txs: Transaction[]) {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return txs.filter(t => new Date(t.date) >= start);
}

// ─── Budget progress ──────────────────────────────────────────────────────────
export function budgetSpent(budget: Budget, txs: Transaction[]): number {
  const scoped = budget.period === 'monthly' ? thisMonth(txs) : thisWeek(txs);
  return scoped
    .filter(t => t.type === 'expense' && t.category === budget.category)
    .reduce((s, t) => s + t.amount, 0);
}

// ─── Last 7 days spending by day ──────────────────────────────────────────────
export function last7DaysSpend(txs: Transaction[]): { label: string; value: number }[] {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return days.map(d => {
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const value = txs
      .filter(t => {
        const td = new Date(t.date);
        return t.type === 'expense' &&
          td.getDate() === d.getDate() &&
          td.getMonth() === d.getMonth() &&
          td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
    return { label, value };
  });
}

// ─── Spend by category (this month) ──────────────────────────────────────────
export function spendByCategory(txs: Transaction[]): Record<CategoryId, number> {
  const monthly = thisMonth(txs).filter(t => t.type === 'expense');
  return monthly.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {} as Record<CategoryId, number>);
}

// ─── Last 6 months income vs expense ─────────────────────────────────────────
export function last6MonthsFlow(txs: Transaction[]): { month: string; income: number; expense: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleDateString('en', { month: 'short' });
    const inPeriod = txs.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    return {
      month,
      income:  inPeriod.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: inPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });
}