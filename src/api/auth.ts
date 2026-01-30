/**
 * Auth API - Authentication commands
 */

import { tauriInvoke, ApiResponse } from './index';
import type { LoginResponse } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  full_name: string;
  role: string;
  branch_id: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserParams {
  username: string;
  password: string;
  full_name: string;
  role: 'owner' | 'kasir';
  branch_id: string;
}

/**
 * Authenticate user with username and password
 */
export async function login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return tauriInvoke<LoginResponse>('login', { request });
}

/**
 * Get all users
 */
export async function getUsers(): Promise<ApiResponse<UserResponse[]>> {
  return tauriInvoke<UserResponse[]>('get_users');
}

/**
 * Create a new user
 */
export async function createUser(params: CreateUserParams): Promise<ApiResponse<UserResponse>> {
  return tauriInvoke<UserResponse>('create_user', {
    username: params.username,
    password: params.password,
    fullName: params.full_name,
    role: params.role,
    branchId: params.branch_id,
  });
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  newPassword: string
): Promise<ApiResponse<boolean>> {
  return tauriInvoke<boolean>('change_password', {
    userId,
    newPassword,
  });
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(userId: string): Promise<ApiResponse<boolean>> {
  return tauriInvoke<boolean>('toggle_user_status', { userId });
}
