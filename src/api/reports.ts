/**
 * Reports API - Dashboard and reporting commands
 */

import { tauriInvoke, ApiResponse } from './index';
import type { SalesReport, DailySummary } from '../types';

export interface DashboardSummary {
  today_sales: number;
  today_transactions: number;
  total_stock: number;
  total_weight: number;
  sales_change: number;
  transactions_change: number;
}

export interface StockReportItem {
  category: string;
  total_items: number;
  available: number;
  sold: number;
  total_weight: number;
  total_value: number;
}

/**
 * Get dashboard summary for today
 */
export async function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  return tauriInvoke<DashboardSummary>('get_dashboard_summary');
}

/**
 * Get sales report for date range
 */
export async function getSalesReport(
  dateFrom: string,
  dateTo: string
): Promise<ApiResponse<SalesReport[]>> {
  return tauriInvoke<SalesReport[]>('get_sales_report', {
    dateFrom,
    dateTo,
  });
}

/**
 * Get detailed daily summary with payment breakdown
 */
export async function getDailySummary(date: string): Promise<ApiResponse<DailySummary>> {
  return tauriInvoke<DailySummary>('get_daily_summary', { date });
}

/**
 * Get stock report by category
 */
export async function getStockReport(): Promise<ApiResponse<StockReportItem[]>> {
  return tauriInvoke<StockReportItem[]>('get_stock_report');
}
