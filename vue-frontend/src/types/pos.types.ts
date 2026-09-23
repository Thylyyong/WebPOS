// Authentication & Roles
export type UserRole = 'BOSS' | 'CASHIER' | 'MAIN_BOSS' | 'SUB_BOSS' | 'STAFF_CASHIER' | 'CHEF';

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  branch_id: string;
  branch_name: string;
  is_main_boss?: boolean;
  is_sub_boss?: boolean;
  is_cashier?: boolean;
}

export interface Branch {
  id: string;
  branch_name: string;
  branch_code?: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

// Catalog & Products
export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
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
  in_stock?: number;
  stock_quantity: number;
  tax_rate: number;
  color_hex?: string;
  is_available: boolean;
}

// Cart & Orders
export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total_price: number;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'SPLIT';

export interface CheckoutPayload {
  branch_id: string;
  cashier_id: number;
  table_id?: string | null;
  table_number?: string | null;
  customer_name: string;
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  cash_tendered?: number;
  change_amount?: number;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export interface OrderReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CompletedOrder {
  id: string;
  receipt_no: string;
  status: string;
  customer_name?: string;
  table_number?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  cash_tendered?: number;
  change_amount?: number;
  created_at: string;
  items: OrderReceiptItem[];
}

// Floor Plan & Dining Tables
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILLED' | 'RESERVED';

export interface DiningTable {
  id: string;
  branch_id?: string;
  table_number: string;
  name?: string;
  zone: string;
  capacity: number;
  status: TableStatus;
  customer_name?: string | null;
  order_total?: number;
  current_order_id?: string;
  opened_at?: string;
}

// Shift Register & Cash Drawer
export interface CashMovementRecord {
  id?: string;
  session_id: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  reason: string;
  supervisor_pin?: string;
  created_at?: string;
}

export interface RegisterSession {
  id: string;
  branch_id: string;
  branch_name?: string;
  cashier_id?: number;
  cashier_name: string;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  opening_notes?: string;
  cash_sales: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  closing_cash_counted?: number;
  cash_difference?: number;
  cash_movements?: CashMovementRecord[];
}

export interface ZReportData {
  session_id: string;
  cashier_name: string;
  opened_at: string;
  closed_at: string;
  opening_cash: number;
  gross_sales: number;
  discounts: number;
  net_sales: number;
  tax_total: number;
  payment_breakdown: {
    cash: number;
    card: number;
    qr: number;
  };
  drawer_reconciliation: {
    opening_cash: number;
    cash_sales: number;
    cash_in: number;
    cash_out: number;
    expected_cash: number;
    counted_cash: number;
    difference: number;
  };
}

// Accounting & P&L
export interface ProfitLossData {
  gross_sales: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percent: number;
  total_expenses: number;
  net_profit: number;
  net_margin_percent: number;
}

export interface ExpenseRecord {
  id: string;
  branch_id: string;
  category: string;
  title: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface FranchiseSettlementData {
  period_start: string;
  period_end: string;
  gross_sales: number;
  base_rent: number;
  royalty_percent: number;
  royalty_amount: number;
  total_settlement_due: number;
}

// Store Settings
export interface StoreSettings {
  store_name: string;
  store_address?: string;
  store_phone: string;
  store_email?: string;
  currency_symbol: string;
  default_tax_rate: string | number;
  receipt_header: string;
  receipt_footer: string;
  logo_path?: string;
  // Stored via the same generic Setting key/value store (POST /settings).
  qr_code_image?: string;
  khqr_payload?: string;
}
