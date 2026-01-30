/**
 * Reports Hooks - React Query hooks for dashboard and reports
 */

import { useQuery } from '@tanstack/react-query';
import * as api from '../api/reports';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  sales: (dateFrom: string, dateTo: string) =>
    [...reportKeys.all, 'sales', dateFrom, dateTo] as const,
  daily: (date: string) => [...reportKeys.all, 'daily', date] as const,
  stock: () => [...reportKeys.all, 'stock'] as const,
};

/**
 * Hook to get dashboard summary
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: async () => {
      const response = await api.getDashboardSummary();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch dashboard summary');
      }
      return response.data;
    },
    staleTime: 1000 * 60, // Refresh every minute
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}

/**
 * Hook to get sales report
 */
export function useSalesReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: reportKeys.sales(dateFrom, dateTo),
    queryFn: async () => {
      const response = await api.getSalesReport(dateFrom, dateTo);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sales report');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!dateFrom && !!dateTo,
  });
}

/**
 * Hook to get daily summary
 */
export function useDailySummary(date: string) {
  return useQuery({
    queryKey: reportKeys.daily(date),
    queryFn: async () => {
      const response = await api.getDailySummary(date);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch daily summary');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!date,
  });
}

/**
 * Hook to get stock report
 */
export function useStockReport() {
  return useQuery({
    queryKey: reportKeys.stock(),
    queryFn: async () => {
      const response = await api.getStockReport();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch stock report');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook for generating date ranges
 */
export function useDateRanges() {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getLastNDays = (n: number) => {
    const from = new Date(today);
    from.setDate(from.getDate() - n);
    return { from: formatDate(from), to: formatDate(today) };
  };

  const getThisMonth = () => {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDate(from), to: formatDate(today) };
  };

  const getLastMonth = () => {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: formatDate(from), to: formatDate(to) };
  };

  return {
    today: formatDate(today),
    last7Days: getLastNDays(7),
    last30Days: getLastNDays(30),
    thisMonth: getThisMonth(),
    lastMonth: getLastMonth(),
  };
}
