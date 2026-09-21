import { defineStore } from 'pinia';
import { ref } from 'vue';
import { registerApi } from '../api/register.api';
import type { RegisterSession, ZReportData } from '../types/pos.types';

export const useRegisterStore = defineStore('register', () => {
  const activeSession = ref<RegisterSession | null>(null);
  const hasActiveSession = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const lastZReport = ref<ZReportData | null>(null);

  async function fetchCurrentSession(branchId: string) {
    isLoading.value = true;
    try {
      const res = await registerApi.getCurrentSession(branchId);
      if (res.data.success) {
        hasActiveSession.value = res.data.has_active_session;
        activeSession.value = res.data.session || null;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function openRegister(data: { branch_id: string; opening_cash: number; opening_notes?: string }) {
    const res = await registerApi.openRegister(data);
    if (res.data.success) {
      activeSession.value = res.data.session;
      hasActiveSession.value = true;
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to open register');
  }

  async function recordCashMovement(data: {
    session_id: string;
    type: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    reason: string;
    supervisor_pin: string;
  }) {
    const res = await registerApi.cashMovement(data);
    if (res.data.success) {
      // update local expected cash
      if (activeSession.value) {
        if (data.type === 'CASH_IN') {
          activeSession.value.cash_in += data.amount;
          activeSession.value.expected_cash += data.amount;
        } else {
          activeSession.value.cash_out += data.amount;
          activeSession.value.expected_cash -= data.amount;
        }
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to record cash movement');
  }

  async function closeRegister(data: {
    session_id: string;
    closing_cash_counted: number;
    closing_notes?: string;
  }) {
    const res = await registerApi.closeRegister(data);
    if (res.data.success) {
      activeSession.value = res.data.session;
      hasActiveSession.value = false;
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to close register');
  }

  async function fetchZReport(sessionId: string) {
    const res = await registerApi.getZReport(sessionId);
    if (res.data.success) {
      lastZReport.value = res.data.z_report;
      return res.data.z_report;
    }
    throw new Error('Failed to load Z-Report');
  }

  return {
    activeSession,
    hasActiveSession,
    isLoading,
    lastZReport,
    fetchCurrentSession,
    openRegister,
    recordCashMovement,
    closeRegister,
    fetchZReport
  };
});
