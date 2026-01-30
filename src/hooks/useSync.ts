/**
 * React Query hooks for Salesforce Sync
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSyncConfig,
  saveSyncConfig,
  testSfConnection,
  getSyncStatus,
  manualSync,
  pullGoldPricesFromSf,
  pullInventoryFromSf,
  toggleSyncEnabled,
} from '../api/sync';
import type { SaveSyncConfigRequest } from '../types';

// Query keys
export const syncKeys = {
  all: ['sync'] as const,
  config: () => [...syncKeys.all, 'config'] as const,
  status: () => [...syncKeys.all, 'status'] as const,
};

/**
 * Hook to get sync configuration
 */
export function useSyncConfig() {
  return useQuery({
    queryKey: syncKeys.config(),
    queryFn: async () => {
      const response = await getSyncConfig();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get sync status
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: syncKeys.status(),
    queryFn: async () => {
      const response = await getSyncStatus();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to save sync configuration
 */
export function useSaveSyncConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SaveSyncConfigRequest) => {
      const response = await saveSyncConfig(request);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.config() });
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
    },
  });
}

/**
 * Hook to test Salesforce connection
 */
export function useTestSfConnection() {
  return useMutation({
    mutationFn: async () => {
      const response = await testSfConnection();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}

/**
 * Hook to run manual sync
 */
export function useManualSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await manualSync();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all queries after sync
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
      queryClient.invalidateQueries({ queryKey: ['goldPrices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Hook to pull gold prices from Salesforce
 */
export function usePullGoldPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await pullGoldPricesFromSf();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
      queryClient.invalidateQueries({ queryKey: ['goldPrices'] });
    },
  });
}

/**
 * Hook to pull inventory from Salesforce
 */
export function usePullInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branchSfId?: string) => {
      const response = await pullInventoryFromSf(branchSfId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

/**
 * Hook to toggle sync enabled/disabled
 */
export function useToggleSyncEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await toggleSyncEnabled(enabled);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.config() });
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
    },
  });
}
