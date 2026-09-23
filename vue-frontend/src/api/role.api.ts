import { apiClient } from './client';
import type { RoleDefinition, StaffAccount } from '../types/pos.types';

export interface RolesListResponse {
  success: boolean;
  roles: RoleDefinition[];
}

export interface StaffListResponse {
  success: boolean;
  staff: StaffAccount[];
}

export interface GenericRoleResponse {
  success: boolean;
  message?: string;
  role?: RoleDefinition;
}

export interface GenericStaffResponse {
  success: boolean;
  message?: string;
  staff?: StaffAccount;
}

export const roleApi = {
  // Roles Definitions
  getRoles() {
    return apiClient.get<RolesListResponse>('/admin/roles');
  },

  createRole(data: { name: string; code: string; description?: string; permissions?: string[] }) {
    return apiClient.post<GenericRoleResponse>('/admin/roles', data);
  },

  updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }) {
    return apiClient.put<GenericRoleResponse>(`/admin/roles/${id}`, data);
  },

  deleteRole(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/roles/${id}`);
  },

  // Staff User Accounts
  getStaff() {
    return apiClient.get<StaffListResponse>('/admin/staff');
  },

  createStaff(data: { name: string; username: string; pin_code: string; role: string; branch_id?: string }) {
    return apiClient.post<GenericStaffResponse>('/admin/staff', data);
  },

  updateStaff(id: number, data: { name?: string; username?: string; pin_code?: string; role?: string; branch_id?: string; is_active?: boolean }) {
    return apiClient.put<GenericStaffResponse>(`/admin/staff/${id}`, data);
  },

  deleteStaff(id: number) {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/staff/${id}`);
  }
};
