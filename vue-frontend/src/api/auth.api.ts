import { apiClient } from './client';
import type { User } from '../types/pos.types';

export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export interface RolesResponse {
  success: boolean;
  roles: Array<{
    id: number;
    name: string;
    username: string;
    role: string;
    branch_id: string;
    branch_name: string;
  }>;
}

export const authApi = {
  getRoles() {
    return apiClient.get<RolesResponse>('/auth/roles');
  },

  loginWithPin(pin_code: string, username?: string) {
    return apiClient.post<LoginResponse>('/auth/login-pin', { pin_code, username });
  },

  switchBranch(branch_id: string) {
    return apiClient.post<{ success: boolean; message: string }>('/auth/switch-branch', { branch_id });
  },

  logout() {
    return apiClient.post('/auth/logout');
  }
};
