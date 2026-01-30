/**
 * Transactions API - Sales, buyback, and exchange transactions
 */

import { tauriInvoke, ApiResponse } from './index';
import type { Transaction, Payment } from '../types';

export interface TransactionItem {
  inventory_id: string;
  unit_price: number;
  discount: number;
}

export interface BuybackItem {
  gold_type: string;
  gold_purity: number;
  weight_gram: number;
  unit_price: number;
}

export interface CreateTransactionRequest {
  type: 'sale' | 'buyback' | 'exchange';
  customer_id?: string;
  items: TransactionItem[];
  buyback_items?: BuybackItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface ProcessPaymentRequest {
  transaction_id: string;
  method: 'cash' | 'qris' | 'bank_transfer';
  amount: number;
  reference_no?: string;
}

export interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  transaction_type?: 'sale' | 'buyback' | 'exchange';
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  request: CreateTransactionRequest,
  userId: string,
  branchId: string
): Promise<ApiResponse<Transaction>> {
  return tauriInvoke<Transaction>('create_transaction', {
    request,
    userId,
    branchId,
  });
}

/**
 * Process payment for a transaction
 */
export async function processPayment(
  request: ProcessPaymentRequest
): Promise<ApiResponse<Payment>> {
  return tauriInvoke<Payment>('process_payment', { request });
}

/**
 * Void a transaction
 */
export async function voidTransaction(
  transactionId: string,
  reason: string
): Promise<ApiResponse<boolean>> {
  return tauriInvoke<boolean>('void_transaction', {
    transactionId,
    reason,
  });
}

/**
 * Get transactions with optional filters
 */
export async function getTransactions(
  filters?: TransactionFilters
): Promise<ApiResponse<Transaction[]>> {
  return tauriInvoke<Transaction[]>('get_transactions', {
    dateFrom: filters?.date_from,
    dateTo: filters?.date_to,
    transactionType: filters?.transaction_type,
  });
}
