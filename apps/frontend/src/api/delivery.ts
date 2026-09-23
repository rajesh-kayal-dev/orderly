import apiClient from './client';
import type { DeliveryItem, DeliveryPartnerProfile, AppNotification } from '../types/delivery';
import type { User } from '../types/auth';

export const deliveryApi = {
  getDeliveries: async (): Promise<{ success: boolean; data: DeliveryItem[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; data: DeliveryItem[]; total: number }>('/deliveries');
    return res.data;
  },

  acceptDelivery: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/deliveries/${id}/accept`);
    return res.data;
  },

  pickupDelivery: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/deliveries/${id}/pickup`);
    return res.data;
  },

  transitDelivery: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/deliveries/${id}/transit`);
    return res.data;
  },

  completeDelivery: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/deliveries/${id}/complete`);
    return res.data;
  },

  getPartnerProfile: async (): Promise<{ success: boolean; data: DeliveryPartnerProfile }> => {
    const res = await apiClient.get<{ success: boolean; data: DeliveryPartnerProfile }>('/delivery-partners/my-profile');
    return res.data;
  },

  updateAvailability: async (is_available: boolean): Promise<{ success: boolean; data: DeliveryPartnerProfile }> => {
    const res = await apiClient.put<{ success: boolean; data: DeliveryPartnerProfile }>('/delivery-partners/availability', { is_available });
    return res.data;
  },
};

export const adminApi = {
  getUsers: async (params?: { search?: string; role?: string; status?: string }): Promise<{ success: boolean; data: User[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; data: User[]; total: number }>('/admin/users', { params });
    return res.data;
  },

  getPendingApprovals: async (): Promise<{ success: boolean; data: User[] }> => {
    const res = await apiClient.get<{ success: boolean; data: User[] }>('/admin/users/pending-approvals');
    return res.data;
  },

  approveUser: async (id: string): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.post<{ success: boolean; data: User }>(`/admin/users/${id}/approve`);
    return res.data;
  },

  rejectUser: async (id: string, reason?: string): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.post<{ success: boolean; data: User }>(`/admin/users/${id}/reject`, { reason });
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.patch<{ success: boolean; data: User }>(`/admin/users/${id}/status`, { status });
    return res.data;
  },
};

export const notificationApi = {
  getAll: async (): Promise<{ success: boolean; data: AppNotification[] }> => {
    const res = await apiClient.get<{ success: boolean; data: AppNotification[] }>('/notifications');
    return res.data;
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>('/notifications/read-all');
    return res.data;
  },
};
