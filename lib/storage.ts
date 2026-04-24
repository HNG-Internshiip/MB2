import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryId } from '@/constants/categories';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TxType = 'income' | 'expense';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: CategoryId;
  note: string;
  date: string;           // ISO string
  recurring: boolean;
  recurringInterval?: RecurringInterval;
  currency: string;       // e.g. 'NGN', 'USD'
}

export interface Budget {
  id: string;
  category: CategoryId;
  limit: number;
  period: 'weekly' | 'monthly';
  currency: string;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  transactions: '@fin_transactions',
  budgets:      '@fin_budgets',
  currency:     '@fin_currency',
  authPassed:   '@fin_auth_passed',
};

// ─── Generic helpers ──────────────────────────────────────────────────────────
async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

async function save<T>(key: string, value: T): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export const loadTransactions  = () => load<Transaction[]>(KEYS.transactions, []);
export const saveTransactions  = (data: Transaction[]) => save(KEYS.transactions, data);

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const loadBudgets  = () => load<Budget[]>(KEYS.budgets, []);
export const saveBudgets  = (data: Budget[]) => save(KEYS.budgets, data);

// ─── Currency preference ──────────────────────────────────────────────────────
export const loadCurrency = () => load<string>(KEYS.currency, 'USD');
export const saveCurrency = (c: string) => save(KEYS.currency, c);

// ─── UID ──────────────────────────────────────────────────────────────────────
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;