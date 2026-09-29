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

export interface OrderListItem {
  id: string;
  receipt_no: string;
  order_number?: string;
  customer_name?: string;
  table_number?: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  items?: Array<{ id: string; product_id?: string; product_name: string; quantity: number; unit_price: number; total_price: number; cost_price?: number }>;
}

export interface OrdersPaginatedResponse {
  success: boolean;
  orders: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: OrderListItem[];
  };
}

export const ordersApi = {
  // Backed by GET /orders — supports branch_id, status ('all' for every
  // status), search and Laravel's standard ?page= pagination (20/page,
  // fixed server-side — the backend does not accept a custom per_page or
  // a date-range filter, so callers page through results as needed).
  getOrders(params?: { branch_id?: string; status?: string; search?: string; page?: number }) {
    return apiClient.get<OrdersPaginatedResponse>('/orders', { params });
  },

  getOrder(id: string) {
    return apiClient.get<{ success: boolean; order: OrderListItem; cogs_total?: number }>(`/orders/${id}`);
  },

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
