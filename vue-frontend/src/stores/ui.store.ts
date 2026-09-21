import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CompletedOrder } from '../types/pos.types';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([]);
  const isReceiptOpen = ref<boolean>(false);
  const activeReceiptOrder = ref<CompletedOrder | null>(null);

  function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  function openReceipt(order: CompletedOrder) {
    activeReceiptOrder.value = order;
    isReceiptOpen.value = true;
  }

  function closeReceipt() {
    isReceiptOpen.value = false;
  }

  return {
    toasts,
    isReceiptOpen,
    activeReceiptOrder,
    showToast,
    removeToast,
    openReceipt,
    closeReceipt
  };
});
