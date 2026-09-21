import { defineStore } from 'pinia';
import { ref } from 'vue';
import { accountingApi } from '../api/accounting.api';
import type { ProfitLossData, ExpenseRecord, FranchiseSettlementData } from '../types/pos.types';

export const useAccountingStore = defineStore('accounting', () => {
  const profitLoss = ref<ProfitLossData | null>(null);
  const expenses = ref<ExpenseRecord[]>([]);
  const settlement = ref<FranchiseSettlementData | null>(null);
  const isLoading = ref<boolean>(false);

  async function fetchFinancials(branchId: string) {
    isLoading.value = true;
    try {
      const [pnlRes, expRes, setRes] = await Promise.all([
        accountingApi.getProfitLoss(branchId),
        accountingApi.getExpenses(branchId),
        accountingApi.getSettlementSummary(branchId)
      ]);
      if (pnlRes.data.success) {
        profitLoss.value = pnlRes.data.profit_loss;
      }
      if (expRes.data.success) {
        expenses.value = expRes.data.expenses;
      }
      if (setRes.data.success) {
        settlement.value = setRes.data.settlement;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function logExpense(data: {
    branch_id: string;
    category: string;
    title: string;
    amount: number;
    notes?: string;
  }) {
    const res = await accountingApi.createExpense(data);
    if (res.data.success) {
      expenses.value.unshift(res.data.expense);
      // Refresh P&L
      fetchFinancials(data.branch_id);
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to record expense');
  }

  async function settleFranchise(data: {
    branch_id: string;
    period_start: string;
    period_end: string;
  }) {
    const res = await accountingApi.triggerSettlement(data);
    if (res.data.success) {
      settlement.value = res.data.settlement;
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to trigger settlement');
  }

  return {
    profitLoss,
    expenses,
    settlement,
    isLoading,
    fetchFinancials,
    logExpense,
    settleFranchise
  };
});
