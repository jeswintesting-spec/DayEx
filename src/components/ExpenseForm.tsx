import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { Expense, CategoryType } from '../types';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onUpdate?: (id: string, expense: Partial<Expense>) => void;
  expenseToEdit?: Expense | null;
}

const TODAY = () => new Date().toISOString().split('T')[0];
const MAX_AMOUNT = 10_00_00_000; // ₹10 Crore — sanity ceiling

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  expenseToEdit
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food');
  const [date, setDate] = useState(TODAY);
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<{ title?: string; amount?: string; date?: string; note?: string }>({});
  const [futureDateWarning, setFutureDateWarning] = useState(false);

  // Reset / populate when opened or switching between add/edit
  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setDate(expenseToEdit.date);
      setNote(expenseToEdit.note);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(TODAY());
      setNote('');
    }
    setErrors({});
    setFutureDateWarning(false);
  }, [expenseToEdit, isOpen]);

  // Live date warning (future date)
  const handleDateChange = (val: string) => {
    setDate(val);
    setFutureDateWarning(!!val && val > TODAY());
    setErrors(prev => ({ ...prev, date: undefined }));
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    // ── Title ─────────────────────────────────────────────────────────────────
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Title is required.';
    } else if (trimmedTitle.length < 2) {
      newErrors.title = 'Title must be at least 2 characters.';
    } else if (trimmedTitle.length > 100) {
      newErrors.title = 'Title must be 100 characters or fewer.';
    }

    // ── Amount ────────────────────────────────────────────────────────────────
    const parsedAmount = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required.';
    } else if (isNaN(parsedAmount)) {
      newErrors.amount = 'Enter a valid number.';
    } else if (parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0.';
    } else if (parsedAmount > MAX_AMOUNT) {
      newErrors.amount = `Amount cannot exceed ₹${MAX_AMOUNT.toLocaleString('en-IN')}.`;
    } else if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      newErrors.amount = 'Use at most 2 decimal places (e.g. 250.50).';
    }

    // ── Date ──────────────────────────────────────────────────────────────────
    if (!date) {
      newErrors.date = 'Date is required.';
    } else if (date < '2000-01-01') {
      newErrors.date = 'Date cannot be before Jan 1, 2000.';
    } else if (date > '2099-12-31') {
      newErrors.date = 'Date is too far in the future.';
    }
    // future date is a warning, not a hard error — don't block save

    // ── Note ──────────────────────────────────────────────────────────────────
    if (note.length > 200) {
      newErrors.note = 'Note must be 200 characters or fewer.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const expenseData = {
      title: title.trim(),
      amount: Math.round(parseFloat(amount) * 100) / 100, // ensure 2dp precision
      category,
      date,
      note: note.trim(),
    };

    if (expenseToEdit && onUpdate) {
      onUpdate(expenseToEdit.id, expenseData);
    } else {
      onSave(expenseData);
    }
    onClose();
  };

  const ErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? (
      <span style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        color: 'var(--accent)', fontSize: '0.75rem', marginTop: '0.3rem'
      }}>
        <AlertTriangle size={12} /> {msg}
      </span>
    ) : null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">
            {expenseToEdit ? '✏️ Edit Expense' : '➕ Add Expense'}
          </h2>
          <button className="btn btn-icon-only" onClick={onClose} aria-label="Close form">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>

          {/* Title */}
          <div className="filter-group-item">
            <label className="input-label" htmlFor="expense-title">
              Title <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              id="expense-title"
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Coffee at Starbucks"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              maxLength={100}
              autoComplete="off"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ErrorMsg msg={errors.title} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', marginTop: '0.25rem' }}>
                {title.trim().length}/100
              </span>
            </div>

            {/* Quick suggestions */}
            {!expenseToEdit && title.length === 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {['Starbucks Coffee', 'Uber taxi', 'Groceries', 'Netflix sub'].map((s) => (
                  <button
                    key={s} type="button"
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer'
                    }}
                    onClick={() => {
                      setTitle(s);
                      if (s.toLowerCase().includes('uber')) setCategory('Travel');
                      else if (s.toLowerCase().includes('netflix')) setCategory('Entertainment');
                      else setCategory('Food');
                    }}
                  >+ {s}</button>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="filter-group-item">
            <label className="input-label" htmlFor="expense-amount">
              Amount (₹) <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)',
                fontSize: '0.95rem', pointerEvents: 'none'
              }}>₹</span>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={MAX_AMOUNT}
                className={`form-input ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
                style={{ paddingLeft: '2rem' }}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
                }}
              />
            </div>
            <ErrorMsg msg={errors.amount} />
          </div>

          {/* Category Selector */}
          <div className="filter-group-item">
            <label className="input-label">Category</label>
            <div className="category-badges-grid">
              {(Object.keys(CATEGORIES) as CategoryType[]).map((catName) => {
                const info = CATEGORIES[catName];
                const isSelected = category === catName;
                return (
                  <button
                    type="button" key={catName}
                    className={`category-badge-selector ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCategory(catName)}
                  >
                    <span className="category-badge-icon">{info.icon}</span>
                    <span className="category-badge-label">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="filter-group-item">
            <label className="input-label" htmlFor="expense-date">
              Date <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              id="expense-date"
              type="date"
              className={`form-input ${errors.date ? 'input-error' : ''}`}
              value={date}
              min="2000-01-01"
              max="2099-12-31"
              onChange={(e) => handleDateChange(e.target.value)}
            />
            <ErrorMsg msg={errors.date} />
            {futureDateWarning && !errors.date && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: 'var(--text-amber)', fontSize: '0.75rem', marginTop: '0.3rem'
              }}>
                <AlertTriangle size={12} /> This date is in the future — are you sure?
              </span>
            )}
          </div>

          {/* Note */}
          <div className="filter-group-item">
            <label className="input-label" htmlFor="expense-note">Notes <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional)</span></label>
            <textarea
              id="expense-note"
              className={`form-input ${errors.note ? 'input-error' : ''}`}
              rows={3}
              placeholder="Add details, tags, store location..."
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (errors.note) setErrors(prev => ({ ...prev, note: undefined }));
              }}
              maxLength={200}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ErrorMsg msg={errors.note} />
              <span style={{
                fontSize: '0.7rem', marginLeft: 'auto', marginTop: '0.25rem',
                color: note.length > 180 ? 'var(--text-amber)' : 'var(--text-muted)'
              }}>
                {note.length}/200
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
