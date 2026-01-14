// Database entity types based on PRD schema

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  branch_id: string;
  username: string;
  full_name: string;
  role: 'owner' | 'kasir';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  nik?: string;
  address?: string;
  notes?: string;
  total_transactions: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  sku?: string;
  name: string;
  description?: string;
  gold_type: 'LM' | 'UBS' | 'Lokal';
  gold_purity: number; // 375-999
  weight_gram: number;
  labor_cost: number;
  images?: string;
  is_active: boolean;
  created_at: string;
  // Joined fields
  category?: Category;
}

export interface Inventory {
  id: string;
  product_id: string;
  branch_id: string;
  barcode: string;
  status: 'available' | 'sold' | 'reserved';
  location?: string;
  purchase_price: number;
  purchase_date?: string;
  supplier?: string;
  notes?: string;
  sold_at?: string;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface GoldPrice {
  id: string;
  date: string;
  gold_type: 'LM' | 'UBS' | 'Lokal';
  purity: number;
  buy_price: number; // per gram
  sell_price: number; // per gram
  source?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  branch_id: string;
  user_id: string;
  customer_id?: string;
  invoice_no: string;
  type: 'sale' | 'buyback' | 'exchange';
  subtotal: number;
  discount: number;
  total_amount: number;
  notes?: string;
  status: 'pending' | 'completed' | 'void';
  created_at: string;
  // Joined fields
  customer?: Customer;
  user?: User;
  items?: TransactionItem[];
  payments?: Payment[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  gold_price_ref?: number;
  // Joined fields
  inventory?: Inventory;
}

export interface Payment {
  id: string;
  transaction_id: string;
  method: 'cash' | 'qris' | 'bank_transfer';
  amount: number;
  reference_no?: string;
  bank_name?: string;
  status: 'pending' | 'success' | 'failed';
  paid_at?: string;
  created_at: string;
}

export interface SyncLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  synced: boolean;
  synced_at?: string;
  created_at: string;
}

// Cart types for POS
export interface CartItem {
  inventory: Inventory;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customer?: Customer;
}

// Report types
export interface SalesReport {
  date: string;
  total_transactions: number;
  total_sales: number;
  total_buyback: number;
  total_exchange: number;
  net_sales: number;
}

export interface StockReport {
  category: string;
  total_items: number;
  available_items: number;
  sold_items: number;
  total_weight: number;
  total_value: number;
}

export interface DailySummary {
  date: string;
  sales_count: number;
  sales_amount: number;
  buyback_count: number;
  buyback_amount: number;
  exchange_count: number;
  exchange_amount: number;
  cash_received: number;
  qris_received: number;
  bank_transfer_received: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Session {
  user: User;
  token: string;
  expires_at: string;
}

// Settings types
export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
}

export interface PrinterSettings {
  enabled: boolean;
  name: string;
  paper_width: 58 | 80;
}

export interface PaymentSettings {
  midtrans_env: 'sandbox' | 'production';
  qris_enabled: boolean;
  bank_transfer_enabled: boolean;
}

export interface SyncSettings {
  enabled: boolean;
  interval_minutes: number;
  supabase_url: string;
}

export interface AppSettings {
  store: StoreSettings;
  printer: PrinterSettings;
  payment: PaymentSettings;
  sync: SyncSettings;
}
