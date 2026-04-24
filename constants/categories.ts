import theme from './theme';

export type CategoryId =
  | 'food' | 'transport' | 'housing' | 'health'
  | 'entertainment' | 'shopping' | 'education'
  | 'salary' | 'freelance' | 'investment' | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;        // Ionicons name
  color: string;
  type: 'expense' | 'income' | 'both';
}

export const CATEGORIES: Category[] = [
  { id:'salary',        label:'Salary',        icon:'briefcase',           color:theme.income,  type:'income'  },
  { id:'freelance',     label:'Freelance',      icon:'laptop-outline',      color:theme.teal,    type:'income'  },
  { id:'investment',    label:'Investment',     icon:'trending-up',         color:theme.blue,    type:'income'  },
  { id:'food',          label:'Food',           icon:'fast-food',           color:theme.orange,  type:'expense' },
  { id:'transport',     label:'Transport',      icon:'car',                 color:theme.blue,    type:'expense' },
  { id:'housing',       label:'Housing',        icon:'home',                color:theme.purple,  type:'expense' },
  { id:'health',        label:'Health',         icon:'medkit',              color:theme.expense, type:'expense' },
  { id:'entertainment', label:'Entertainment',  icon:'game-controller',     color:theme.pink,    type:'expense' },
  { id:'shopping',      label:'Shopping',       icon:'bag-handle',          color:theme.gold,    type:'expense' },
  { id:'education',     label:'Education',      icon:'school',              color:theme.teal,    type:'expense' },
  { id:'other',         label:'Other',          icon:'ellipsis-horizontal', color:theme.subtext, type:'both'    },
];

export const getCat = (id: CategoryId): Category =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];