export interface User {
  id: number;
  name: string;
  username: string;
  role: 'BOSS' | 'CASHIER' | 'MAIN_BOSS' | 'SUB_BOSS' | 'STAFF_CASHIER' | 'CHEF';
  branch_id: string;
  branch_name: string;
  is_main_boss: boolean;
  is_sub_boss: boolean;
  is_cashier: boolean;
}

export interface Branch {
  id: string;
  branch_name: string;
  branch_code?: string;
  code?: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color_hex?: string;
  display_order: number;
  products_count?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Product {
  id: string;
  category_id: string;
  subcategory_id?: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  barcode?: string;
  image_path?: string;
  in_stock: number;
  stock_quantity: number;
  tax_rate: number;
  color_hex?: string;
  is_available: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total_price: number;
  notes?: string;
}

export interface DiningTable {
  id: string;
  branch_id: string;
  table_number: string;
  name: string;
  zone: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLED' | 'RESERVED';
  type: string;
  current_order_id?: string;
  customer_name?: string;
  order_total?: number;
  current_order_total?: number;
}

export interface RegisterSession {
  id: string;
  branch_id: string;
  branch_name: string;
  cashier_id?: number;
  cashier_name: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  opening_notes?: string;
  closing_cash_counted: number;
  closing_card_counted: number;
  expected_cash: number;
  cash_difference: number;
  status: 'OPEN' | 'CLOSED';
  total_orders: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_qr_sales: number;
  total_cash_in: number;
  total_cash_out: number;
}

export interface FinancialSummary {
  branch_name?: string;
  summary: {
    gross_sales: number;
    discounts: number;
    net_sales: number;
    cogs: number;
    gross_profit: number;
    total_expenses: number;
    hybrid_paid_to_boss?: number;
    net_profit: number;
  };
  settlement?: {
    base_rent: number;
    royalty_percent: number;
    royalty_amount: number;
    total_settlement: number;
  };
  expenses_breakdown?: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    date: string;
  }>;
}

export interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  currency_symbol: string;
  default_tax_rate: string;
  footer_note: string;
  logo_path?: string;
}
