import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ordersApi } from '../api/orders.api';
import type { CartItem, Product, DiningTable, CheckoutPayload, CompletedOrder, PaymentMethod } from '../types/pos.types';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const selectedTable = ref<DiningTable | null>(null);
  const customerName = ref<string>('Walk-In Guest');
  const orderType = ref<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const orderDiscountPercent = ref<number>(0);
  const lastCompletedOrder = ref<CompletedOrder | null>(null);

  const subtotal = computed(() => {
    return Math.round(items.value.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) * 100) / 100;
  });

  const discountAmount = computed(() => {
    // Sum of per-item discounts
    const perItemDiscount = items.value.reduce((sum, item) => {
      const lineBase = item.quantity * item.unit_price;
      return sum + (lineBase * (item.discount_percent / 100));
    }, 0);
    // Plus order level discount
    const orderDiscount = (subtotal.value - perItemDiscount) * (orderDiscountPercent.value / 100);
    return Math.round((perItemDiscount + orderDiscount) * 100) / 100;
  });

  const taxAmount = computed(() => {
    const taxableAmount = Math.max(0, subtotal.value - discountAmount.value);
    return Math.round(taxableAmount * 0.10 * 100) / 100; // 10% default tax
  });

  const totalDue = computed(() => {
    const total = Math.max(0, subtotal.value - discountAmount.value + taxAmount.value);
    return Math.round(total * 100) / 100;
  });

  const totalItemsCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0);
  });

  function addToCart(product: Product) {
    const existingIndex = items.value.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      const item = items.value[existingIndex];
      const newQty = item.quantity + 1;
      const baseTotal = newQty * item.unit_price;
      const discounted = baseTotal * (1 - item.discount_percent / 100);
      items.value[existingIndex] = {
        ...item,
        quantity: newQty,
        total_price: Math.round(discounted * 100) / 100
      };
    } else {
      items.value.push({
        product,
        quantity: 1,
        unit_price: product.price,
        discount_percent: 0,
        total_price: product.price,
      });
    }
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const item = items.value[index];
    if (item) {
      const baseTotal = quantity * item.unit_price;
      const discounted = baseTotal * (1 - item.discount_percent / 100);
      items.value[index] = {
        ...item,
        quantity,
        total_price: Math.round(discounted * 100) / 100
      };
    }
  }

  function updateItemDiscount(index: number, discountPercent: number) {
    const item = items.value[index];
    if (item) {
      const clampedDiscount = Math.min(100, Math.max(0, discountPercent));
      const baseTotal = item.quantity * item.unit_price;
      const discounted = baseTotal * (1 - clampedDiscount / 100);
      items.value[index] = {
        ...item,
        discount_percent: clampedDiscount,
        total_price: Math.round(discounted * 100) / 100
      };
    }
  }

  function removeItem(index: number) {
    items.value.splice(index, 1);
  }

  function clearCart() {
    items.value = [];
    selectedTable.value = null;
    customerName.value = 'Walk-In Guest';
    orderType.value = 'DINE_IN';
    orderDiscountPercent.value = 0;
  }

  function setTable(table: DiningTable | null) {
    selectedTable.value = table;
    if (table) {
      if (table.customer_name) {
        customerName.value = table.customer_name;
      }
      orderType.value = 'DINE_IN';
    }
  }

  async function processCheckout(params: {
    branchId: string;
    cashierId: number;
    paymentMethod: PaymentMethod;
    cashTendered?: number;
  }) {
    const changeAmount = params.cashTendered ? Math.max(0, params.cashTendered - totalDue.value) : 0;

    const payload: CheckoutPayload = {
      branch_id: params.branchId,
      cashier_id: params.cashierId,
      table_id: selectedTable.value?.id || null,
      table_number: selectedTable.value?.table_number || null,
      customer_name: customerName.value,
      order_type: orderType.value,
      subtotal: subtotal.value,
      discount_amount: discountAmount.value,
      tax_amount: taxAmount.value,
      total_amount: totalDue.value,
      payment_method: params.paymentMethod,
      cash_tendered: params.cashTendered,
      change_amount: changeAmount,
      items: items.value.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    };

    const res = await ordersApi.createOrder(payload);
    if (res.data.success) {
      lastCompletedOrder.value = res.data.order;
      clearCart();
      return res.data.order;
    }
    throw new Error(res.data.message || 'Checkout failed');
  }

  async function holdOrder(branchId: string) {
    const payload = {
      branch_id: branchId,
      customer_name: customerName.value,
      table_number: selectedTable.value?.table_number,
      subtotal: subtotal.value,
      total_amount: totalDue.value,
      items: items.value.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    };
    const res = await ordersApi.holdOrder(payload);
    if (res.data.success) {
      clearCart();
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to hold order');
  }

  return {
    items,
    selectedTable,
    customerName,
    orderType,
    orderDiscountPercent,
    lastCompletedOrder,
    subtotal,
    discountAmount,
    taxAmount,
    totalDue,
    totalItemsCount,
    addToCart,
    updateQuantity,
    updateItemDiscount,
    removeItem,
    clearCart,
    setTable,
    processCheckout,
    holdOrder
  };
});
