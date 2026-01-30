/**
 * Gold Prices API - Gold price management commands
 */

import { tauriInvoke, ApiResponse } from './index';
import type { GoldPrice } from '../types';

export interface SetGoldPriceRequest {
  gold_type: 'LM' | 'UBS' | 'Lokal';
  purity: number;
  buy_price: number;
  sell_price: number;
}

/**
 * Get today's gold prices
 */
export async function getTodayPrices(): Promise<ApiResponse<GoldPrice[]>> {
  return tauriInvoke<GoldPrice[]>('get_today_prices');
}

/**
 * Set or update gold price for today
 */
export async function setGoldPrice(request: SetGoldPriceRequest): Promise<ApiResponse<GoldPrice>> {
  return tauriInvoke<GoldPrice>('set_gold_price', { request });
}

/**
 * Get price history for a specific gold type and purity
 */
export async function getPriceHistory(
  goldType: string,
  purity: number,
  days: number = 30
): Promise<ApiResponse<GoldPrice[]>> {
  return tauriInvoke<GoldPrice[]>('get_price_history', {
    goldType,
    purity,
    days,
  });
}

/**
 * Get all gold prices for a specific date
 */
export async function getAllPricesForDate(date: string): Promise<ApiResponse<GoldPrice[]>> {
  return tauriInvoke<GoldPrice[]>('get_all_prices_for_date', { date });
}

/**
 * Get today's price for a specific gold type and purity (for calculations)
 */
export async function getPriceForCalculation(
  goldType: string,
  purity: number
): Promise<ApiResponse<GoldPrice | null>> {
  return tauriInvoke<GoldPrice | null>('get_price_for_calculation', {
    goldType,
    purity,
  });
}
