import apiClient from './client';
import type { Restaurant, MenuCategory, MenuItem } from '../types/restaurant';

export const restaurantApi = {
  getAll: async (params?: { search?: string; cuisine?: string }): Promise<{ success: boolean; data: Restaurant[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; data: Restaurant[]; total: number }>('/restaurants', { params });
    return res.data;
  },

  getById: async (id: string | number): Promise<{ success: boolean; data: Restaurant }> => {
    const res = await apiClient.get<{ success: boolean; data: Restaurant }>(`/restaurants/${id}`);
    return res.data;
  },

  getMyProfile: async (): Promise<{ success: boolean; data: Restaurant }> => {
    const res = await apiClient.get<{ success: boolean; data: Restaurant }>('/restaurants/my-profile');
    return res.data;
  },

  updateMyProfile: async (data: Partial<Restaurant>): Promise<{ success: boolean; data: Restaurant }> => {
    const res = await apiClient.put<{ success: boolean; data: Restaurant }>('/restaurants/my-profile', data);
    return res.data;
  },

  openRestaurant: async (): Promise<{ success: boolean; data: Restaurant }> => {
    const res = await apiClient.post<{ success: boolean; data: Restaurant }>('/restaurants/my-profile/open');
    return res.data;
  },

  closeRestaurant: async (): Promise<{ success: boolean; data: Restaurant }> => {
    const res = await apiClient.post<{ success: boolean; data: Restaurant }>('/restaurants/my-profile/close');
    return res.data;
  },

  create: async (data: Partial<Restaurant>): Promise<{ success: boolean; data: Restaurant }> => {
    const res = await apiClient.post<{ success: boolean; data: Restaurant }>('/restaurants', data);
    return res.data;
  },
};

export const menuApi = {
  getFullMenu: async (restaurantId: string | number): Promise<{ success: boolean; data: MenuCategory[] }> => {
    const res = await apiClient.get<{ success: boolean; data: MenuCategory[] }>(`/menu/full/${restaurantId}`);
    return res.data;
  },

  getItems: async (restaurantId?: string | number): Promise<{ success: boolean; data: MenuItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: MenuItem[] }>('/menu', { params: { restaurantId } });
    return res.data;
  },

  createItem: async (data: Partial<MenuItem>): Promise<{ success: boolean; data: MenuItem }> => {
    const res = await apiClient.post<{ success: boolean; data: MenuItem }>('/menu', data);
    return res.data;
  },

  updateItem: async (id: string | number, data: Partial<MenuItem>): Promise<{ success: boolean; data: MenuItem }> => {
    const res = await apiClient.put<{ success: boolean; data: MenuItem }>(`/menu/${id}`, data);
    return res.data;
  },

  toggleAvailability: async (id: string | number, is_available?: boolean): Promise<{ success: boolean; data: MenuItem }> => {
    const res = await apiClient.patch<{ success: boolean; data: MenuItem }>(`/menu/${id}/toggle-availability`, { is_available });
    return res.data;
  },
};
