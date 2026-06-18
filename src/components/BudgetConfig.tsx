import React, { useState } from 'react';
import { Save, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BudgetConfigProps {
  currentLimit: number;
  onSaveLimit: (limit: number) => void;
}

export const BudgetConfig: React.FC<BudgetConfigProps> = ({
  currentLimit,
  onSaveLimit,
}) => {
  const [limitInput, setLimitInput] = useState(currentLimit.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(limitInput);
    if (!isNaN(parsed) && parsed > 0) {
      onSaveLimit(parsed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Budget Limit Setup */}
      <div className="glass-card settings-box">
        <h3 className="chart-title">⚙️ Budget Configurations</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Adjust your monthly spending limit. Alerts appear when you approach or exceed it.
        </p>

        <form onSubmit={handleSaveBudget} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="filter-group-item" style={{ flexGrow: 1, minWidth: '220px' }}>
            <label className="input-label" htmlFor="budget-limit-input">Monthly Budget Limit (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 500
              }}>₹</span>
              <input
                id="budget-limit-input"
                type="number"
                min="1"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '39px' }}>
            <Save size={16} /> Save Budget
          </button>
        </form>

        {saveSuccess && (
          <div style={{
            padding: '0.6rem 1rem', background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)',
            color: '#86efac', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <ShieldCheck size={16} />
            <span>Budget limit updated and saved to database!</span>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="glass-card">
        <h3 className="chart-title" style={{ marginBottom: '1rem' }}>💡 App Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>PostgreSQL Backend:</strong> DayEx now stores all data in a real PostgreSQL 18 database running locally. Data persists across sessions, browser clears, and device restarts.
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Rupee Symbol (₹):</strong> All amounts are formatted in Indian Standard Format for quick readability.
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '1rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--text-amber)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Keep backups!</strong>
              Export a JSON backup periodically. If the database is dropped or the server reinstalled, your data can be fully restored using the Restore button above.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
