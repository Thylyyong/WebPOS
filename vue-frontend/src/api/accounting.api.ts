import { apiClient } from './client';
import type { ProfitLossData, ExpenseRecord, FranchiseSettlementData } from '../types/pos.types';

export const accountingApi = {
  getProfitLoss(branch_id: string) {
    return apiClient.get<{ success: boolean; profit_loss: ProfitLossData }>('/accounting/profit-loss', {
      params: { branch_id }
    });
  },

  getExpenses(branch_id: string) {
    return apiClient.get<{ success: boolean; expenses: ExpenseRecord[] }>('/accounting/expenses', {
      params: { branch_id }
    });
  },

  createExpense(data: {
    branch_id: string;
    category: string;
    title: string;
    amount: number;
    notes?: string;
  }) {
    return apiClient.post<{ success: boolean; message: string; expense: ExpenseRecord }>('/accounting/expenses', data);
  },

  getSettlementSummary(branch_id: string) {
    return apiClient.get<{ success: boolean; settlement: FranchiseSettlementData }>('/settlement/summary', {
      params: { branch_id }
    });
  },

  triggerSettlement(data: {
    branch_id: string;
    period_start: string;
    period_end: string;
  }) {
    return apiClient.post<{ success: boolean; message: string; settlement: FranchiseSettlementData }>('/settlement/settle', data);
  }
};
