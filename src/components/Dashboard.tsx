import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { CATEGORIES } from '../types';
import type { Expense, CategoryType } from '../types';

interface DashboardProps {
  stats: {
    currentMonthTotal: number;
    allTimeTotal: number;
    categoryData: { name: string; value: number }[];
    dailyTrend: { rawDate: string; dateLabel: string; amount: number }[];
    budgetLimit: number;
    budgetUsagePercent: number;
    budgetWarningStatus: 'normal' | 'warning' | 'critical';
  };
  recentExpenses: Expense[];
  onOpenAddModal: () => void;
  onNavigateToExpenses: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentExpenses,
  onOpenAddModal,
  onNavigateToExpenses
}) => {
  const {
    currentMonthTotal,
    categoryData,
    dailyTrend,
    budgetLimit,
    budgetUsagePercent,
    budgetWarningStatus
  } = stats;

  const remainingBudget = budgetLimit - currentMonthTotal;
  const isBudgetExceeded = remainingBudget < 0;

  // Custom tooltips for Recharts
  const CustomAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(13, 15, 23, 0.95)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(5px)'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
            {payload[0].payload.rawDate}
          </p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)' }}>
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const cat = CATEGORIES[data.name as CategoryType] || CATEGORIES.Others;
      return (
        <div style={{
          background: 'rgba(13, 15, 23, 0.95)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.85rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{cat.icon}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{data.name}:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: cat.color }}>
            ₹{data.value.toLocaleString('en-IN')}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Quick Stats Cards Grid */}
      <div className="overview-grid">
        {/* Total Month Spent Card */}
        <div className="glass-card">
          <div className="card-title">This Month's Spending</div>
          <div className="card-value">
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
            {currentMonthTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="card-icon" style={{ color: 'var(--primary)' }}>
            <TrendingUp size={20} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Spent across all categories this month
          </p>
        </div>

        {/* Budget Limit Card */}
        <div className="glass-card">
          <div className="card-title">Monthly Limit</div>
          <div className="card-value">
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
            {budgetLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="card-icon" style={{ color: 'var(--secondary)' }}>
            <DollarSign size={20} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Set custom limit in Settings
          </p>
        </div>

        {/* Remaining Budget Card */}
        <div className="glass-card">
          <div className="card-title">Remaining Budget</div>
          <div 
            className="card-value"
            style={{ color: isBudgetExceeded ? 'var(--accent)' : 'var(--text-green)' }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>₹</span>
            {Math.abs(remainingBudget).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div 
            className="card-icon" 
            style={{ 
              color: isBudgetExceeded ? 'var(--accent)' : 'var(--text-green)',
              background: isBudgetExceeded ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)'
            }}
          >
            {isBudgetExceeded ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            {isBudgetExceeded 
              ? 'Warning: Budget limit exceeded!' 
              : 'Left for the rest of the month'}
          </p>
        </div>
      </div>

      {/* 2. Budget Progress alert & bar */}
      <div className="glass-card">
        <h3 className="chart-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 Monthly Budget Progress
          {budgetWarningStatus === 'critical' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.15rem 0.5rem', background: 'rgba(244, 63, 94, 0.15)', borderRadius: '4px' }}>
              <AlertTriangle size={12} /> Limit Exceeded
            </span>
          )}
        </h3>

        <div className="budget-progress-container">
          <div className="progress-header">
            <span>{budgetUsagePercent.toFixed(1)}% Used</span>
            <span>₹{currentMonthTotal.toLocaleString('en-IN')} / ₹{budgetLimit.toLocaleString('en-IN')}</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${budgetWarningStatus}`} 
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            />
          </div>
        </div>

        {budgetWarningStatus !== 'normal' && (
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '0.85rem 1rem', 
              borderRadius: 'var(--radius-sm)', 
              background: budgetWarningStatus === 'critical' ? 'rgba(244,63,94,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${budgetWarningStatus === 'critical' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
              color: budgetWarningStatus === 'critical' ? '#ff8e8e' : '#ffdf80',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertTriangle size={16} />
            <span>
              {budgetWarningStatus === 'critical' 
                ? `You have exceeded your monthly limit by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}! Consider trimming down discretionary costs.`
                : `Warning: You have used ${budgetUsagePercent.toFixed(0)}% of your monthly budget. Monitor your upcoming purchases.`}
            </span>
          </div>
        )}
      </div>

      {/* 3. Charts Analysis Panels */}
      <div className="charts-grid">
        {/* Daily Spend Trend Area Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Daily Spending Trend</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This Month</span>
          </div>
          
          <div className="chart-container-box">
            {dailyTrend.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No active data for this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="dateLabel" 
                    stroke="var(--text-muted)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--primary)" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorSpend)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Category Share</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This Month</span>
          </div>

          <div className="chart-container-box" style={{ flexDirection: 'column', gap: '1rem' }}>
            {categoryData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No categories logged yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => {
                        const cat = CATEGORIES[entry.name as CategoryType] || CATEGORIES.Others;
                        return <Cell key={`cell-${entry.name}`} fill={cat.color} />;
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Category Legends */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.65rem',
                  width: '100%',
                  padding: '0 0.5rem'
                }}>
                  {categoryData.map((item) => {
                    const cat = CATEGORIES[item.name as CategoryType] || CATEGORIES.Others;
                    return (
                      <div 
                        key={item.name}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}
                      >
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: cat.color,
                          flexShrink: 0
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat.icon} {item.name} ({Math.round((item.value / currentMonthTotal) * 100)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Activities panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="chart-title">Recent Transactions</h3>
          <button 
            className="btn" 
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: 'transparent' }}
            onClick={onNavigateToExpenses}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p style={{ fontSize: '0.9rem' }}>No expenses recorded yet.</p>
            <button className="btn btn-primary" onClick={onOpenAddModal} style={{ marginTop: '0.5rem' }}>
              ➕ Add An Expense
            </button>
          </div>
        ) : (
          <div className="transaction-list-compact">
            {recentExpenses.slice(0, 5).map((exp) => {
              const catInfo = CATEGORIES[exp.category] || CATEGORIES.Others;
              return (
                <div key={exp.id} className="transaction-item">
                  <div className="tx-left">
                    <div 
                      className="tx-cat-badge"
                      style={{ background: catInfo.bgGradient, width: '2rem', height: '2rem', fontSize: '1rem' }}
                    >
                      {catInfo.icon}
                    </div>
                    <div className="tx-info">
                      <span className="tx-title" style={{ fontSize: '0.9rem' }}>{exp.title}</span>
                      <span className="tx-date" style={{ fontSize: '0.75rem' }}>
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <span className="tx-amount" style={{ fontSize: '0.95rem' }}>
                    ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
