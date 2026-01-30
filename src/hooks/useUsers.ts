/**
 * User Hooks - React Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/auth';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
};

/**
 * Hook to get all users
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const response = await api.getUsers();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: api.CreateUserParams) => {
      const response = await api.createUser(params);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create user');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Hook to change user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => {
      const response = await api.changePassword(userId, newPassword);
      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
      return response.data;
    },
  });
}

/**
 * Hook to toggle user status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.toggleUserStatus(userId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to toggle user status');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
