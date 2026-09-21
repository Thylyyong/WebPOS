import { apiClient } from './client';
import type { CheckoutPayload, CompletedOrder } from '../types/pos.types';

export interface CheckoutResponse {
  success: boolean;
  message: string;
  order: CompletedOrder;
}

export interface HoldOrderPayload {
  branch_id: string;
  customer_name?: string;
  table_number?: string;
  subtotal: number;
  total_amount: number;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export interface SplitBillPayload {
  split_count: number;
  payments: Array<{
    amount: number;
    payment_method: string;
  }>;
}

export const ordersApi = {
  createOrder(data: CheckoutPayload) {
    return apiClient.post<CheckoutResponse>('/orders', data);
  },

  holdOrder(data: HoldOrderPayload) {
    return apiClient.post<{ success: boolean; message: string; held_order_id?: string }>('/orders/hold', data);
  },

  getParkedOrders(branch_id: string) {
    return apiClient.get<{ success: boolean; orders: any[] }>('/orders/parked', { params: { branch_id } });
  },

  splitOrder(orderId: string, data: SplitBillPayload) {
    return apiClient.post<{ success: boolean; message: string }>(`/orders/${orderId}/split`, data);
  }
};
