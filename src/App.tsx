import { useState } from 'react';
import { Plus, LayoutDashboard, ReceiptText, Settings } from 'lucide-react';
import { useExpenses } from './hooks/useExpenses';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { BudgetConfig } from './components/BudgetConfig';
import type { Expense } from './types';

type TabType = 'dashboard' | 'expenses' | 'settings';

function App() {
  const {
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
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setIsFormOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}>
        <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Connecting to database…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Cannot reach the backend</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px' }}>{error}</p>
        <code style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--secondary)' }}>
          cd server &amp;&amp; node index.js
        </code>
      </div>
    );
  }

  const handleOpenEditModal = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      deleteExpense(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Premium Sticky Header */}
      <header className="app-header">
        <div className="logo" onClick={() => setActiveTab('dashboard')}>
          <div className="logo-icon">DE</div>
          Day<span>Ex</span>
        </div>

        {/* Desktop / Core Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <ReceiptText size={16} />
            <span>Expenses</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right side controls: Quick Budget & Add Expense Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="budget-badge" style={{ display: 'none' /* hidden on small screen, details on dashboard */ }}>
            <span className="budget-badge-val">Used of Budget</span>
            <span className="budget-badge-num">
              ₹{stats.currentMonthTotal.toLocaleString('en-IN')} / ₹{stats.budgetLimit.toLocaleString('en-IN')}
            </span>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleOpenAddModal}
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="dashboard-container">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats}
            recentExpenses={expenses}
            onOpenAddModal={handleOpenAddModal}
            onNavigateToExpenses={() => setActiveTab('expenses')}
          />
        )}

        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>
                  Transactions Explorer
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Showing {filteredExpenses.length} of {expenses.length} transaction records
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} /> Add Expense
              </button>
            </div>
            
            <ExpenseList 
              expenses={filteredExpenses}
              allExpenses={expenses}
              filters={filters}
              onFilterChange={setFilters}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteConfirm}
              onOpenAddModal={handleOpenAddModal}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>
                Control Center
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Manage budgets, database tables, and import/export operations
              </p>
            </div>

            <BudgetConfig 
              currentLimit={stats.budgetLimit}
              onSaveLimit={setMonthlyLimit}
            />
          </div>
        )}
      </main>

      {/* Overlay Drawer Form */}
      <ExpenseForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={addExpense}
        onUpdate={updateExpense}
        expenseToEdit={expenseToEdit}
      />

      {/* Responsive mobile floating action button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: 'var(--shadow-lg), 0 0 15px rgba(139, 92, 246, 0.4)',
          display: 'none', // Default display rule. Triggered inside responsive styling
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90
        }}
        className="mobile-fab"
        onClick={handleOpenAddModal}
        aria-label="Add Expense"
      >
        <Plus size={24} />
      </button>

      {/* CSS overrides for mobile FAB display and styling tweaks */}
      <style>{`
        @media (max-width: 768px) {
          .app-header .btn-primary {
            display: none;
          }
          .mobile-fab {
            display: flex !important;
          }
        }
      `}</style>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          DayEx &copy; {new Date().getFullYear()} &bull; Built with React + TypeScript + Glassmorphism CSS.
        </div>
        <div style={{ fontSize: '0.75rem' }}>
          All data is saved locally in your browser. Read our <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("DayEx stores all details strictly in your local storage. No information is transmitted across any network."); }}>Privacy Policy</a>.
        </div>
      </footer>
    </div>
  );
}

export default App;
