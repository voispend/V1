export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
}

export interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
  currency: string;
}

export type ExpenseCategory = 
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Utilities'
  | 'Health'
  | 'Rent'
  | 'Misc';

export const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'restaurant-outline', color: '#F97316' },
  { name: 'Transport', icon: 'car-outline', color: '#3B82F6' },
  { name: 'Shopping', icon: 'bag-outline', color: '#EC4899' },
  { name: 'Entertainment', icon: 'film-outline', color: '#EAB308' },
  { name: 'Utilities', icon: 'bulb-outline', color: '#10B981' },
  { name: 'Health', icon: 'medical-outline', color: '#EF4444' },
  { name: 'Rent', icon: 'home-outline', color: '#8B5CF6' },
  { name: 'Misc', icon: 'cube-outline', color: '#6B7280' },
];

// Receipt parsing types
export interface ReceiptParseRequest {
  image_b64: string;
  locale_hint?: string;
  currency_hint?: string;
}

export interface ReceiptParseResponse {
  vendor: string | null;
  date_iso: string | null;
  currency: string | null;
  amount: number | null;
  confidence: number;
  model: string;
}

export interface ReceiptParseError {
  error: string;
}