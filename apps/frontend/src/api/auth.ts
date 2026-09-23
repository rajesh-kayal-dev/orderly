import apiClient from './client';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

export const authApi = {
  login: async (payload: LoginPayload): Promise<{ success: boolean; data: AuthResponse }> => {
    const res = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<{ success: boolean; data: AuthResponse }> => {
    const res = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', payload);
    return res.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get<{ success: boolean; data: any }>('/auth/profile');
    return res.data;
  },

  getCurrentUser: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.put<{ success: boolean; data: User }>('/auth/me', data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },
};
