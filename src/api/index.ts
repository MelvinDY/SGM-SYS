/**
 * Tauri API Layer
 * Wrapper for invoking Tauri backend commands with proper typing
 */

import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '../lib/utils';

/**
 * Standard API response format matching backend ApiResponse<T>
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Invoke a Tauri command with proper error handling
 * Falls back to demo mode when not running in Tauri
 */
export async function tauriInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  if (!isTauri()) {
    console.warn(`[Demo Mode] Command "${command}" called outside Tauri environment`);
    return {
      success: false,
      error: 'Running in demo mode - Tauri backend not available',
    };
  }

  try {
    const result = await invoke<ApiResponse<T>>(command, args);
    return result;
  } catch (error) {
    console.error(`[Tauri Error] ${command}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper to unwrap API response and throw on error
 * Use this when you want to handle errors via try/catch
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error || 'Unknown error');
  }
  return response.data;
}

// Re-export all API modules
export * from './auth';
export * from './inventory';
export * from './transactions';
export * from './customers';
export * from './goldPrices';
export * from './reports';
export * from './sync';
