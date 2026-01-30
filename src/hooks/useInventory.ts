/**
 * Inventory Hooks - React Query hooks for inventory management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/inventory';

// Query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (status?: string) => [...inventoryKeys.lists(), { status }] as const,
  stats: () => [...inventoryKeys.all, 'stats'] as const,
  barcode: (barcode: string) => [...inventoryKeys.all, 'barcode', barcode] as const,
  categories: () => ['categories'] as const,
  products: () => ['products'] as const,
};

/**
 * Hook to get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: async () => {
      const response = await api.getCategories();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch categories');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Categories rarely change, cache for 1 hour
  });
}

/**
 * Hook to get all products
 */
export function useProducts() {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: async () => {
      const response = await api.getProducts();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch products');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to get inventory items
 */
export function useInventory(status?: string) {
  return useQuery({
    queryKey: inventoryKeys.list(status),
    queryFn: async () => {
      const response = await api.getInventory(status);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch inventory');
      }
      return response.data;
    },
    staleTime: 1000 * 30, // Inventory changes frequently, refresh every 30s
  });
}

/**
 * Hook to get inventory statistics
 */
export function useInventoryStats() {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: async () => {
      const response = await api.getInventoryStats();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch inventory stats');
      }
      return response.data;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}

/**
 * Hook to scan barcode
 */
export function useScanBarcode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barcode: string) => {
      const response = await api.scanBarcode(barcode);
      if (!response.success) {
        throw new Error(response.error || 'Failed to scan barcode');
      }
      return response.data;
    },
    onSuccess: (data, barcode) => {
      // Cache the barcode result
      queryClient.setQueryData(inventoryKeys.barcode(barcode), data);
    },
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: api.CreateProductParams) => {
      const response = await api.createProduct(params);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create product');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
    },
  });
}

/**
 * Hook to add inventory item
 */
export function useAddInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      branchId,
    }: {
      request: api.CreateInventoryRequest;
      branchId: string;
    }) => {
      const response = await api.addInventory(request, branchId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add inventory');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all inventory queries
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/**
 * Hook to update inventory location
 */
export function useUpdateInventoryLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryId,
      location,
    }: {
      inventoryId: string;
      location: string;
    }) => {
      const response = await api.updateInventoryLocation(inventoryId, location);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update location');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/**
 * Hook to generate barcode
 */
export function useGenerateBarcode() {
  return useMutation({
    mutationFn: async (category: string) => {
      const response = await api.generateBarcode(category);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate barcode');
      }
      return response.data;
    },
  });
}

/**
 * Hook to update inventory item
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryId,
      request,
    }: {
      inventoryId: string;
      request: api.UpdateInventoryRequest;
    }) => {
      const response = await api.updateInventory(inventoryId, request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update inventory');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/**
 * Hook to delete inventory item
 */
export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventoryId: string) => {
      const response = await api.deleteInventory(inventoryId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete inventory');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
