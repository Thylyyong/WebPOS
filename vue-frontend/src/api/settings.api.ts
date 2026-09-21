import { apiClient } from './client';
import type { StoreSettings, Branch } from '../types/pos.types';

export const settingsApi = {
  getSettings() {
    return apiClient.get<{ success: boolean; settings: StoreSettings }>('/settings');
  },

  updateSettings(settings: Partial<StoreSettings>) {
    return apiClient.post<{ success: boolean; message: string; settings: StoreSettings }>('/settings', { settings });
  },

  getBranches() {
    return apiClient.get<{ success: boolean; branches: Branch[] }>('/branches');
  }
};
