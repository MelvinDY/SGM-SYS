/**
 * Transaction Hooks - React Query hooks for transactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/transactions';
import { inventoryKeys } from './useInventory';

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: api.TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
};

/**
 * Hook to get transactions with optional filters
 */
export function useTransactions(filters?: api.TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const response = await api.getTransactions(filters);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch transactions');
      }
      return response.data;
    },
    staleTime: 1000 * 30, // Refresh every 30s
  });
}

/**
 * Hook to create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      userId,
      branchId,
    }: {
      request: api.CreateTransactionRequest;
      userId: string;
      branchId: string;
    }) => {
      const response = await api.createTransaction(request, userId, branchId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create transaction');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate transactions and inventory (status changes)
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/**
 * Hook to process payment
 */
export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: api.ProcessPaymentRequest) => {
      const response = await api.processPayment(request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to process payment');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

/**
 * Hook to void a transaction
 */
export function useVoidTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      reason,
    }: {
      transactionId: string;
      reason: string;
    }) => {
      const response = await api.voidTransaction(transactionId, reason);
      if (!response.success) {
        throw new Error(response.error || 'Failed to void transaction');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate transactions and inventory (restored items)
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/**
 * Combined hook to create transaction and process payment in one flow
 */
export function useCheckout() {
  const createTransaction = useCreateTransaction();
  const processPayment = useProcessPayment();

  const checkout = async ({
    transactionRequest,
    paymentMethod,
    paymentAmount,
    referenceNo,
    userId,
    branchId,
  }: {
    transactionRequest: api.CreateTransactionRequest;
    paymentMethod: 'cash' | 'qris' | 'bank_transfer';
    paymentAmount: number;
    referenceNo?: string;
    userId: string;
    branchId: string;
  }) => {
    // Step 1: Create transaction
    const transaction = await createTransaction.mutateAsync({
      request: transactionRequest,
      userId,
      branchId,
    });

    // Step 2: Process payment
    const payment = await processPayment.mutateAsync({
      transaction_id: transaction.id,
      method: paymentMethod,
      amount: paymentAmount,
      reference_no: referenceNo,
    });

    return { transaction, payment };
  };

  return {
    checkout,
    isLoading: createTransaction.isPending || processPayment.isPending,
    error: createTransaction.error || processPayment.error,
  };
}
