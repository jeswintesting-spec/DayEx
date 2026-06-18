export type CategoryType = 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Entertainment' | 'Others';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  date: string;
  note: string;
}

export interface Budget {
  monthlyLimit: number;
}

export interface ExpenseFilters {
  search: string;
  category: CategoryType | 'All';
  filterMonth: string; // "YYYY-MM" or "" for all
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'month-asc' | 'month-desc';
}

export interface CategoryInfo {
  label: CategoryType;
  icon: string; // Emoji
  color: string; // Hex color
  bgGradient: string; // CSS gradient for styling
}

export const CATEGORIES: Record<CategoryType, CategoryInfo> = {
  Food: {
    label: 'Food',
    icon: '🍔',
    color: '#ff6b6b',
    bgGradient: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)'
  },
  Travel: {
    label: 'Travel',
    icon: '✈️',
    color: '#4dadf7',
    bgGradient: 'linear-gradient(135deg, #4dadf7, #70c4ff)'
  },
  Shopping: {
    label: 'Shopping',
    icon: '🛍️',
    color: '#cc5de8',
    bgGradient: 'linear-gradient(135deg, #cc5de8, #da77f2)'
  },
  Bills: {
    label: 'Bills',
    icon: '🧾',
    color: '#fcc419',
    bgGradient: 'linear-gradient(135deg, #fcc419, #ffd43b)'
  },
  Entertainment: {
    label: 'Entertainment',
    icon: '🎬',
    color: '#20c997',
    bgGradient: 'linear-gradient(135deg, #20c997, #38d9a9)'
  },
  Others: {
    label: 'Others',
    icon: '🏷️',
    color: '#adb5bd',
    bgGradient: 'linear-gradient(135deg, #adb5bd, #dee2e6)'
  }
};
