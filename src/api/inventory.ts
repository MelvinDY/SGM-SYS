/**
 * Inventory API - Product and inventory management commands
 */

import { tauriInvoke, ApiResponse } from './index';
import type { Category, Product, Inventory } from '../types';

export interface CreateProductParams {
  category_id: string;
  name: string;
  gold_type: 'LM' | 'UBS' | 'Lokal';
  gold_purity: number;
  weight_gram: number;
  labor_cost: number;
  sku?: string;
  description?: string;
}

export interface CreateInventoryRequest {
  product_id: string;
  barcode: string;
  purchase_price: number;
  location?: string;
}

export interface InventoryStats {
  total: number;
  available: number;
  sold: number;
  total_weight: number;
  total_value: number;
}

/**
 * Get all product categories
 */
export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return tauriInvoke<Category[]>('get_categories');
}

/**
 * Get all active products
 */
export async function getProducts(): Promise<ApiResponse<Product[]>> {
  return tauriInvoke<Product[]>('get_products');
}

/**
 * Create a new product
 */
export async function createProduct(params: CreateProductParams): Promise<ApiResponse<Product>> {
  return tauriInvoke<Product>('create_product', {
    categoryId: params.category_id,
    name: params.name,
    goldType: params.gold_type,
    goldPurity: params.gold_purity,
    weightGram: params.weight_gram,
    laborCost: params.labor_cost,
    sku: params.sku,
    description: params.description,
  });
}

/**
 * Get inventory items with optional status filter
 */
export async function getInventory(status?: string): Promise<ApiResponse<Inventory[]>> {
  return tauriInvoke<Inventory[]>('get_inventory', { status });
}

/**
 * Scan barcode and get inventory item
 */
export async function scanBarcode(barcode: string): Promise<ApiResponse<Inventory | null>> {
  return tauriInvoke<Inventory | null>('scan_barcode', { barcode });
}

/**
 * Add new inventory item
 */
export async function addInventory(
  request: CreateInventoryRequest,
  branchId: string
): Promise<ApiResponse<Inventory>> {
  return tauriInvoke<Inventory>('add_inventory', { request, branchId });
}

/**
 * Update inventory location
 */
export async function updateInventoryLocation(
  inventoryId: string,
  location: string
): Promise<ApiResponse<boolean>> {
  return tauriInvoke<boolean>('update_inventory_location', { inventoryId, location });
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats(): Promise<ApiResponse<InventoryStats>> {
  // Backend returns tuple, we transform it
  const response = await tauriInvoke<[number, number, number, number, number]>('get_inventory_stats');

  if (response.success && response.data) {
    const [total, available, sold, total_weight, total_value] = response.data;
    return {
      success: true,
      data: {
        total,
        available,
        sold,
        total_weight,
        total_value,
      },
    };
  }

  return {
    success: false,
    error: response.error,
  };
}

/**
 * Generate barcode for a category
 * Format: EM-[CAT]-[SEQ]-[CHK]
 */
export async function generateBarcode(categoryCode: string): Promise<ApiResponse<string>> {
  return tauriInvoke<string>('generate_barcode', { categoryCode });
}

export interface UpdateInventoryRequest {
  location?: string;
  purchase_price?: number;
  supplier?: string;
  notes?: string;
}

/**
 * Update inventory item
 */
export async function updateInventory(
  inventoryId: string,
  request: UpdateInventoryRequest
): Promise<ApiResponse<Inventory>> {
  return tauriInvoke<Inventory>('update_inventory', {
    inventoryId,
    location: request.location,
    purchasePrice: request.purchase_price,
    supplier: request.supplier,
    notes: request.notes,
  });
}

/**
 * Delete inventory item (only if status is available)
 */
export async function deleteInventory(inventoryId: string): Promise<ApiResponse<boolean>> {
  return tauriInvoke<boolean>('delete_inventory', { inventoryId });
}
