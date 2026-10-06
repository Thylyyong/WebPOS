import { defineStore } from 'pinia';
import { ref } from 'vue';
import { registerApi } from '../api/register.api';
import type { RegisterSession, ZReportData } from '../types/pos.types';

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * The API returns running totals as total_cash_sales / total_cash_in / total_cash_out
 * and only fills expected_cash when the shift is closed. Map them onto the fields the
 * UI uses and compute the expected drawer cash from the data the system already holds:
 * Opening Cash + Cash Sales + Cash In - Cash Out (same formula as the backend close).
 */
function normalizeSession(raw: any): RegisterSession {
  const cashSales = num(raw.cash_sales ?? raw.total_cash_sales);
  const cashIn = num(raw.cash_in ?? raw.total_cash_in);
  const cashOut = num(raw.cash_out ?? raw.total_cash_out);
  const opening = num(raw.opening_cash);
  const computedExpected = Math.round((opening + cashSales + cashIn - cashOut) * 100) / 100;
  const isClosed = raw.status === 'CLOSED';
  return {
    ...raw,
    opening_cash: opening,
    cash_sales: cashSales,
    cash_in: cashIn,
    cash_out: cashOut,
    expected_cash: isClosed && raw.expected_cash != null ? num(raw.expected_cash) : computedExpected,
  } as RegisterSession;
}

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
        activeSession.value = res.data.session ? normalizeSession(res.data.session) : null;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function openRegister(data: { branch_id: string; opening_cash: number; opening_notes?: string }) {
    const res = await registerApi.openRegister(data);
    if (res.data.success) {
      activeSession.value = normalizeSession(res.data.session);
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
          activeSession.value.cash_in = num(activeSession.value.cash_in) + data.amount;
        } else {
          activeSession.value.cash_out = num(activeSession.value.cash_out) + data.amount;
        }
        activeSession.value = normalizeSession(activeSession.value);
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
      activeSession.value = normalizeSession(res.data.session);
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
