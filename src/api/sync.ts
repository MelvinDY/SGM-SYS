/**
 * Salesforce Sync API
 */

import { tauriInvoke, ApiResponse } from './index';
import type { SyncConfig, SaveSyncConfigRequest, SyncStatus, SyncResult } from '../types';

/**
 * Get current sync configuration
 */
export async function getSyncConfig(): Promise<ApiResponse<SyncConfig | null>> {
  return tauriInvoke<SyncConfig | null>('get_sync_config');
}

/**
 * Save sync configuration
 */
export async function saveSyncConfig(request: SaveSyncConfigRequest): Promise<ApiResponse<SyncConfig>> {
  return tauriInvoke<SyncConfig>('save_sync_config', { request });
}

/**
 * Test Salesforce connection
 */
export async function testSfConnection(): Promise<ApiResponse<string>> {
  return tauriInvoke<string>('test_sf_connection');
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<ApiResponse<SyncStatus>> {
  return tauriInvoke<SyncStatus>('get_sync_status');
}

/**
 * Run manual sync (push + pull)
 */
export async function manualSync(): Promise<ApiResponse<SyncResult>> {
  return tauriInvoke<SyncResult>('manual_sync');
}

/**
 * Pull gold prices from Salesforce
 */
export async function pullGoldPricesFromSf(): Promise<ApiResponse<SyncResult>> {
  return tauriInvoke<SyncResult>('pull_gold_prices_from_sf');
}

/**
 * Pull inventory from Salesforce
 */
export async function pullInventoryFromSf(branchSfId?: string): Promise<ApiResponse<SyncResult>> {
  return tauriInvoke<SyncResult>('pull_inventory_from_sf', {
    branch_sf_id: branchSfId
  });
}

/**
 * Toggle sync enabled/disabled
 */
export async function toggleSyncEnabled(enabled: boolean): Promise<ApiResponse<boolean>> {
  return tauriInvoke<boolean>('toggle_sync_enabled', { enabled });
}
