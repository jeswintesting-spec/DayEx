import type { Expense, CategoryType } from './types';

const BASE = 'http://localhost:3001/api';

// ─── Raw API response types ───────────────────────────────────────────────────
interface ApiExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note: string;
}

// Map DB row → frontend Expense type
const mapExpense = (row: ApiExpense): Expense => ({
  id: row.id,
  title: row.title,
  amount: row.amount,
  category: row.category as CategoryType,
  date: row.date,
  note: row.note ?? '',
});

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface FetchExpensesParams {
  search?: string;
  category?: string;
  start?: string;
  end?: string;
  sort?: string;
}

export async function fetchExpenses(params: FetchExpensesParams = {}): Promise<Expense[]> {
  const qs = new URLSearchParams();
  if (params.search)   qs.set('search', params.search);
  if (params.category) qs.set('category', params.category);
  if (params.start)    qs.set('start', params.start);
  if (params.end)      qs.set('end', params.end);
  if (params.sort)     qs.set('sort', params.sort);

  const res = await fetch(`${BASE}/expenses?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  const rows: ApiExpense[] = await res.json();
  return rows.map(mapExpense);
}

export async function createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create expense');
  return mapExpense(await res.json());
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update expense');
  return mapExpense(await res.json());
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete expense');
}

export async function wipeAllExpenses(): Promise<void> {
  const res = await fetch(`${BASE}/expenses`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to wipe expenses');
}

export async function bulkCreateExpenses(expenses: Omit<Expense, 'id'>[]): Promise<Expense[]> {
  const res = await fetch(`${BASE}/expenses/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expenses }),
  });
  if (!res.ok) throw new Error('Failed to bulk insert expenses');
  const rows: ApiExpense[] = await res.json();
  return rows.map(mapExpense);
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export async function fetchBudget(): Promise<number> {
  const res = await fetch(`${BASE}/budget`);
  if (!res.ok) throw new Error('Failed to fetch budget');
  const data = await res.json();
  return data.monthly_limit as number;
}

export async function saveBudget(monthly_limit: number): Promise<number> {
  const res = await fetch(`${BASE}/budget`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthly_limit }),
  });
  if (!res.ok) throw new Error('Failed to save budget');
  const data = await res.json();
  return data.monthly_limit as number;
}
