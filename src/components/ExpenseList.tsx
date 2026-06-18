import React from 'react';
import { Edit2, Trash2, Search, HelpCircle, XCircle, AlertTriangle } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { Expense, CategoryType, ExpenseFilters } from '../types';

interface ExpenseListProps {
  expenses: Expense[];       // filtered list shown in table
  allExpenses: Expense[];   // full list for deriving available months
  filters: ExpenseFilters;
  onFilterChange: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  allExpenses,
  filters,
  onFilterChange,
  onEdit,
  onDelete,
  onOpenAddModal
}) => {
  // Build sorted unique month list from ALL expenses e.g. ["2026-06", "2026-05"]
  const availableMonths = React.useMemo(() => {
    const monthSet = new Set(allExpenses.map(e => e.date.slice(0, 7)));
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a)); // newest first
  }, [allExpenses]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const name = new Date(parseInt(y), parseInt(m) - 1, 1)
      .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    return name; // e.g. "June 2026"
  };

  const handleFilterChange = (key: keyof ExpenseFilters, value: any) => {
    onFilterChange((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: 'All',
      filterMonth: '',
      startDate: '',
      endDate: '',
      sortBy: 'date-desc'
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== 'All' ||
    filters.filterMonth !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  // Warn when start > end
  const dateRangeError =
    filters.startDate && filters.endDate && filters.startDate > filters.endDate
      ? `"From" date is after "To" date — no results will match.`
      : null;

  // Human-readable description of active filters (for empty state)
  const activeFilterDesc = (): string => {
    const parts: string[] = [];
    if (filters.filterMonth) {
      const [y, m] = filters.filterMonth.split('-');
      parts.push(new Date(parseInt(y), parseInt(m) - 1, 1)
        .toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
    }
    if (filters.category !== 'All') parts.push(filters.category);
    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.startDate || filters.endDate) parts.push('the selected date range');
    return parts.length ? parts.join(', ') : 'your current filters';
  };

  return (
    <div className="glass-card table-card" style={{ padding: 0 }}>
      {/* Filtering Header Area */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div className="filter-bar">
          <div className="filter-group">
            {/* Search Input */}
            <div className="filter-group-item search">
              <label className="input-label" htmlFor="filter-search">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  id="filter-search"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Search title, description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Month Filter */}
            <div className="filter-group-item">
              <label className="input-label" htmlFor="filter-month">Month</label>
              <select
                id="filter-month"
                className="form-input"
                value={filters.filterMonth}
                onChange={(e) => handleFilterChange('filterMonth', e.target.value)}
              >
                <option value="">All Months</option>
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>{monthLabel(ym)}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="filter-group-item">
              <label className="input-label" htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                className="form-input"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="All">All Categories</option>
                {(Object.keys(CATEGORIES) as CategoryType[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORIES[cat].icon} {CATEGORIES[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="filter-group-item">
              <label className="input-label" htmlFor="filter-start-date">From Date</label>
              <input
                id="filter-start-date"
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="filter-group-item">
              <label className="input-label" htmlFor="filter-end-date">To Date</label>
              <input
                id="filter-end-date"
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Sort Order */}
            <div className="filter-group-item">
              <label className="input-label" htmlFor="filter-sort">Sort By</label>
              <select
                id="filter-sort"
                className="form-input"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="month-desc">Month: Newest First</option>
                <option value="month-asc">Month: Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
            </div>

            {/* Clear Button */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', minHeight: '38px' }}>
                <button 
                  className="btn" 
                  onClick={clearFilters}
                  style={{ height: '38px', whiteSpace: 'nowrap' }}
                >
                  <XCircle size={16} />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inverted date range warning banner */}
      {dateRangeError && (
        <div style={{
          margin: '0 1.5rem 1rem', padding: '0.65rem 1rem',
          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-amber)',
          fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {dateRangeError} Fix the dates or <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--text-amber)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>clear filters</button>.
        </div>
      )}

      {/* Main Expense Table */}
      {expenses.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">{hasActiveFilters ? '🔍' : '💸'}</span>
          <h3 className="empty-state-title">
            {hasActiveFilters ? 'No matching expenses' : 'No expenses yet'}
          </h3>
          <p style={{ maxWidth: '340px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {hasActiveFilters
              ? dateRangeError
                ? 'Fix the date range — "From" must be before "To".'
                : `No expenses found for ${activeFilterDesc()}. Try adjusting or clearing your filters.`
              : 'Start tracking your daily spending by adding your first expense.'}
          </p>
          {!hasActiveFilters && (
            <button className="btn btn-primary" onClick={onOpenAddModal} style={{ marginTop: '1rem' }}>
              ➕ Add Your First Expense
            </button>
          )}
          {hasActiveFilters && (
            <button className="btn" onClick={clearFilters} style={{ marginTop: '1rem' }}>
              <XCircle size={15} /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="expense-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Title / Detail</th>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '20%' }}>Category</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const catInfo = CATEGORIES[expense.category] || CATEGORIES.Others;
                return (
                  <tr key={expense.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div 
                          className="tx-cat-badge" 
                          style={{ 
                            background: catInfo.bgGradient,
                            color: '#fff',
                            width: '2.25rem',
                            height: '2.25rem',
                            flexShrink: 0
                          }}
                        >
                          {catInfo.icon}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                          <span className="tx-title" style={{ wordBreak: 'break-word' }}>
                            {expense.title}
                          </span>
                          {expense.note && (
                            <span 
                              className="tx-note" 
                              style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-muted)', 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '0.25rem' 
                              }}
                              title={expense.note}
                            >
                              <HelpCircle size={12} />
                              {expense.note.length > 35 ? `${expense.note.slice(0, 35)}...` : expense.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tx-date">
                        {new Date(expense.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="category-pill"
                        style={{
                          background: `rgba(${parseInt(catInfo.color.slice(1,3), 16)}, ${parseInt(catInfo.color.slice(3,5), 16)}, ${parseInt(catInfo.color.slice(5,7), 16)}, 0.15)`,
                          color: catInfo.color,
                          borderColor: `rgba(${parseInt(catInfo.color.slice(1,3), 16)}, ${parseInt(catInfo.color.slice(3,5), 16)}, ${parseInt(catInfo.color.slice(5,7), 16)}, 0.3)`
                        }}
                      >
                        {catInfo.icon} {catInfo.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="tx-amount" style={{ color: 'var(--text-primary)' }}>
                        ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="btn btn-icon-only"
                          style={{ background: 'transparent' }}
                          onClick={() => onEdit(expense)}
                          title="Edit Transaction"
                          aria-label="Edit"
                        >
                          <Edit2 size={15} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button
                          className="btn btn-icon-only"
                          style={{ background: 'transparent' }}
                          onClick={() => onDelete(expense.id)}
                          title="Delete Transaction"
                          aria-label="Delete"
                        >
                          <Trash2 size={15} style={{ color: 'var(--accent)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
