import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Expense, CategoryType, ExpenseFilters } from '../types';
import * as api from '../api';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetLimit, setBudgetLimit] = useState<number>(20000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    category: 'All',
    filterMonth: '',
    startDate: '',
    endDate: '',
    sortBy: 'date-desc',
  });

  // ─── Load data on mount ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [exps, limit] = await Promise.all([api.fetchExpenses(), api.fetchBudget()]);
      setExpenses(exps);
      setBudgetLimit(limit);
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running on port 3001.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── CRUD ───────────────────────────────────────────────────────────────
  const addExpense = async (data: Omit<Expense, 'id'>) => {
    try {
      const created = await api.createExpense(data);
      setExpenses(prev => [created, ...prev]);
    } catch (err) {
      console.error('addExpense failed:', err);
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      const updated = await api.updateExpense(id, data);
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
    } catch (err) {
      console.error('updateExpense failed:', err);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('deleteExpense failed:', err);
    }
  };

  const setMonthlyLimit = async (limit: number) => {
    try {
      const saved = await api.saveBudget(limit);
      setBudgetLimit(saved);
    } catch (err) {
      console.error('setMonthlyLimit failed:', err);
    }
  };

  // ─── Filter & Sort (client-side after fetch) ─────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        const matchSearch =
          exp.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          exp.note.toLowerCase().includes(filters.search.toLowerCase());
        const matchCategory = filters.category === 'All' || exp.category === filters.category;
        const matchMonth = !filters.filterMonth || exp.date.startsWith(filters.filterMonth);
        let matchDate = true;
        if (filters.startDate) matchDate = matchDate && exp.date >= filters.startDate;
        if (filters.endDate)   matchDate = matchDate && exp.date <= filters.endDate;
        return matchSearch && matchCategory && matchMonth && matchDate;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc')   return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (filters.sortBy === 'date-asc')    return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (filters.sortBy === 'amount-desc') return b.amount - a.amount;
        if (filters.sortBy === 'amount-asc')  return a.amount - b.amount;
        if (filters.sortBy === 'month-desc' || filters.sortBy === 'month-asc') {
          // Compare by YYYY-MM (year-month only, ignoring day)
          const aMonth = a.date.slice(0, 7); // "2026-06"
          const bMonth = b.date.slice(0, 7);
          const cmp = aMonth.localeCompare(bMonth);
          // Within same month, sort by day descending
          if (cmp === 0) return new Date(b.date).getTime() - new Date(a.date).getTime();
          return filters.sortBy === 'month-desc' ? bMonth.localeCompare(aMonth) : cmp;
        }
        return 0;
      });
  }, [expenses, filters]);

  // ─── Statistics ──────────────────────────────────────────────────────────
  const currentMonthYear = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const stats = useMemo(() => {
    const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthYear));
    const currentMonthTotal = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);

    const categoryTotals: Record<CategoryType, number> = {
      Food: 0, Travel: 0, Shopping: 0, Bills: 0, Entertainment: 0, Others: 0,
    };
    currentMonthExpenses.forEach(e => {
      if (categoryTotals[e.category] !== undefined) categoryTotals[e.category] += e.amount;
      else categoryTotals.Others += e.amount;
    });

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(i => i.value > 0);

    const dailyMap: Record<string, number> = {};
    const currentYear = new Date().getFullYear();
    currentMonthExpenses.forEach(e => {
      dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
    });
    const dailyTrend = Object.entries(dailyMap)
      .map(([dateStr, amount]) => {
        const [, m, d] = dateStr.split('-');
        const monthName = new Date(currentYear, parseInt(m) - 1, 1)
          .toLocaleString('en-US', { month: 'short' });
        return { rawDate: dateStr, dateLabel: `${monthName} ${d}`, amount };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    const usagePercent = budgetLimit > 0 ? (currentMonthTotal / budgetLimit) * 100 : 0;
    let budgetWarningStatus: 'normal' | 'warning' | 'critical' = 'normal';
    if (usagePercent >= 100) budgetWarningStatus = 'critical';
    else if (usagePercent >= 85) budgetWarningStatus = 'warning';

    return {
      currentMonthTotal,
      allTimeTotal: expenses.reduce((s, e) => s + e.amount, 0),
      categoryData,
      dailyTrend,
      budgetLimit,
      budgetUsagePercent: usagePercent,
      budgetWarningStatus,
    };
  }, [expenses, budgetLimit, currentMonthYear]);

  // ─── Export / Import (JSON file backup) ─────────────────────────────────
  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ expenses, budget: { monthlyLimit: budgetLimit } }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DayEx_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || !Array.isArray(parsed.expenses) || parsed.expenses.length === 0) return false;

      // 1. Wipe existing data in DB
      await api.wipeAllExpenses();

      // 2. Bulk insert restored expenses in one transaction
      const toInsert = parsed.expenses.map((e: Expense) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
        note: e.note ?? '',
      }));
      await api.bulkCreateExpenses(toInsert);

      // 3. Restore budget limit if present
      if (parsed.budget?.monthlyLimit) {
        await api.saveBudget(parsed.budget.monthlyLimit);
      }

      // 4. Reload all data into state
      await loadAll();
      return true;
    } catch (err) {
      console.error('importData failed:', err);
      return false;
    }
  };

  return {
    expenses,
    loading,
    error,
    filters,
    setFilters,
    filteredExpenses,
    stats,
    addExpense,
    updateExpense,
    deleteExpense,
    setMonthlyLimit,
    exportData,
    importData,
  };
};
