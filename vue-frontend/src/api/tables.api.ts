import { apiClient } from './client';
import type { DiningTable } from '../types/pos.types';

export interface TablesResponse {
  success: boolean;
  tables: DiningTable[];
}

export const tablesApi = {
  getTables(branch_id: string) {
    return apiClient.get<TablesResponse>('/tables', { params: { branch_id } });
  },

  assignTable(id: string, customer_name?: string, order_total: number = 0) {
    return apiClient.post<{ success: boolean; message: string; table: DiningTable }>(`/tables/${id}/assign`, {
      customer_name,
      order_total
    });
  },

  transferTable(sourceId: string, targetTableId: string) {
    return apiClient.post<{ success: boolean; message: string }>(`/tables/${sourceId}/transfer`, {
      target_table_id: targetTableId
    });
  },

  releaseTable(id: string) {
    return apiClient.post<{ success: boolean; message: string }>(`/tables/${id}/release`, {});
  }
};
