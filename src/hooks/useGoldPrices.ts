/**
 * Gold Prices Hooks - React Query hooks for gold price management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/goldPrices';

// Query keys
export const goldPriceKeys = {
  all: ['goldPrices'] as const,
  today: () => [...goldPriceKeys.all, 'today'] as const,
  history: (goldType: string, purity: number, days: number) =>
    [...goldPriceKeys.all, 'history', goldType, purity, days] as const,
  date: (date: string) => [...goldPriceKeys.all, 'date', date] as const,
  calculation: (goldType: string, purity: number) =>
    [...goldPriceKeys.all, 'calculation', goldType, purity] as const,
};

/**
 * Hook to get today's gold prices
 */
export function useTodayPrices() {
  return useQuery({
    queryKey: goldPriceKeys.today(),
    queryFn: async () => {
      const response = await api.getTodayPrices();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch today prices');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to app
  });
}

/**
 * Hook to get price history
 */
export function usePriceHistory(goldType: string, purity: number, days: number = 30) {
  return useQuery({
    queryKey: goldPriceKeys.history(goldType, purity, days),
    queryFn: async () => {
      const response = await api.getPriceHistory(goldType, purity, days);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch price history');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // History doesn't change often, cache for 1 hour
    enabled: !!goldType && !!purity, // Only fetch when we have type and purity
  });
}

/**
 * Hook to get all prices for a specific date
 */
export function usePricesForDate(date: string) {
  return useQuery({
    queryKey: goldPriceKeys.date(date),
    queryFn: async () => {
      const response = await api.getAllPricesForDate(date);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch prices for date');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Historical dates don't change
    enabled: !!date,
  });
}

/**
 * Hook to get price for calculation (specific type/purity)
 */
export function usePriceForCalculation(goldType: string, purity: number) {
  return useQuery({
    queryKey: goldPriceKeys.calculation(goldType, purity),
    queryFn: async () => {
      const response = await api.getPriceForCalculation(goldType, purity);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch price for calculation');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!goldType && !!purity,
  });
}

/**
 * Hook to set gold price
 */
export function useSetGoldPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: api.SetGoldPriceRequest) => {
      const response = await api.setGoldPrice(request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to set gold price');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all gold price queries
      queryClient.invalidateQueries({ queryKey: goldPriceKeys.all });
    },
  });
}

/**
 * Helper hook to build a price lookup map from today's prices
 * Returns a function to look up price by type and purity
 */
export function useGoldPriceLookup() {
  const { data: prices, isLoading, error } = useTodayPrices();

  const getPricePerGram = (goldType: string, purity: number): number | null => {
    if (!prices) return null;
    const price = prices.find(
      (p) => p.gold_type === goldType && p.purity === purity
    );
    return price?.sell_price ?? null;
  };

  const getBuyPricePerGram = (goldType: string, purity: number): number | null => {
    if (!prices) return null;
    const price = prices.find(
      (p) => p.gold_type === goldType && p.purity === purity
    );
    return price?.buy_price ?? null;
  };

  return {
    prices,
    isLoading,
    error,
    getPricePerGram,
    getBuyPricePerGram,
  };
}
