/**
 * Customers API - Customer management commands
 */

import { tauriInvoke, ApiResponse } from './index';
import type { Customer } from '../types';

export interface CreateCustomerParams {
  name: string;
  phone?: string;
  nik?: string;
  address?: string;
  notes?: string;
}

/**
 * Get all customers
 */
export async function getCustomers(): Promise<ApiResponse<Customer[]>> {
  return tauriInvoke<Customer[]>('get_customers');
}

/**
 * Create a new customer
 */
export async function createCustomer(params: CreateCustomerParams): Promise<ApiResponse<Customer>> {
  return tauriInvoke<Customer>('create_customer', {
    name: params.name,
    phone: params.phone,
    nik: params.nik,
    address: params.address,
    notes: params.notes,
  });
}

/**
 * Search customers by name or phone
 */
export async function searchCustomer(query: string): Promise<ApiResponse<Customer[]>> {
  return tauriInvoke<Customer[]>('search_customer', { query });
}
