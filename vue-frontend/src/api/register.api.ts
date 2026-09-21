import { apiClient } from './client';
import type { RegisterSession, ZReportData } from '../types/pos.types';

export interface CurrentSessionResponse {
  success: boolean;
  has_active_session: boolean;
  session?: RegisterSession;
}

export const registerApi = {
  getCurrentSession(branch_id: string) {
    return apiClient.get<CurrentSessionResponse>('/register/current', { params: { branch_id } });
  },

  openRegister(data: { branch_id: string; opening_cash: number; opening_notes?: string }) {
    return apiClient.post<{ success: boolean; message: string; session: RegisterSession }>('/register/open', data);
  },

  cashMovement(data: {
    session_id: string;
    type: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    reason: string;
    supervisor_pin: string;
  }) {
    return apiClient.post<{ success: boolean; message: string }>('/register/cash-movement', data);
  },

  closeRegister(data: {
    session_id: string;
    closing_cash_counted: number;
    closing_notes?: string;
  }) {
    return apiClient.post<{
      success: boolean;
      message: string;
      difference: number;
      session: RegisterSession;
    }>('/register/close', data);
  },

  getZReport(sessionId: string) {
    return apiClient.get<{ success: boolean; z_report: ZReportData }>(`/register/${sessionId}/z-report`);
  }
};
