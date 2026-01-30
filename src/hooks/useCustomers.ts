/**
 * Customer Hooks - React Query hooks for customer management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/customers';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: () => [...customerKeys.lists()] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

/**
 * Hook to get all customers
 */
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: async () => {
      const response = await api.getCustomers();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customers');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to search customers
 */
export function useSearchCustomer(query: string) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: async () => {
      const response = await api.searchCustomer(query);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to search customers');
      }
      return response.data;
    },
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 1000 * 30, // Short cache for search results
  });
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: api.CreateCustomerParams) => {
      const response = await api.createCustomer(params);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create customer');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate customer queries
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
