import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ordersApi } from '../api/orders.api';
import { useCatalogStore } from './catalog.store';
import { useTablesStore } from './tables.store';
import type { CartItem, Product, DiningTable, CheckoutPayload, CompletedOrder, PaymentMethod, HeldOrder } from '../types/pos.types';

// Prefer the human-readable message the API sends (e.g. "held order no longer available").
function apiErrorMessage(err: any, fallback: string): Error {
  return new Error(err?.response?.data?.message || err?.message || fallback);
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const selectedTable = ref<DiningTable | null>(null);
  const customerName = ref<string>('Walk-In Guest');
  const orderType = ref<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const orderDiscountPercent = ref<number>(0);
  const lastCompletedOrder = ref<CompletedOrder | null>(null);
  // Set while the cart is a continuation of an existing Pending/Hold order.
  // Checkout and re-hold then update THAT order instead of creating a new one.
  const resumedOrder = ref<{ id: string; receipt_no?: string } | null>(null);

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
    resumedOrder.value = null;
  }

  /**
   * Load an existing Pending/Hold order back into the POS cart so the cashier can
   * add/modify items and then pay (or hold again). The order keeps its identity
   * (resumedOrder.id) and its table link — no new order is created.
   */
  async function resumeParkedOrder(order: HeldOrder) {
    const catalog = useCatalogStore();
    const tablesStore = useTablesStore();

    clearCart();

    // Real catalog products when available (cost, stock, category), otherwise a
    // minimal stand-in so the held line is still editable.
    if (catalog.products.length === 0) {
      try { await catalog.fetchCatalog(); } catch (_) { /* fall back to stand-ins */ }
    }

    items.value = (order.items ?? []).map((oi, idx) => {
      const qty = Math.max(1, Number(oi.quantity) || 1);
      const unit = Number(oi.unit_price) || 0;
      const total = Number(oi.total_price);
      const base = qty * unit;
      // Per-item discount isn't stored on order lines; recover it from the saved line total.
      const discount = base > 0 && Number.isFinite(total)
        ? Math.min(100, Math.max(0, Math.round((1 - total / base) * 10000) / 100))
        : 0;
      const productId = oi.product_id ?? `held_${order.id}_${idx}`;
      const product: Product = catalog.products.find(p => p.id === oi.product_id) ?? {
        id: productId,
        category_id: '',
        name: oi.product_name,
        price: unit,
        cost: 0,
        stock_quantity: 99,
        tax_rate: 10,
        is_available: true,
      };
      return {
        product,
        quantity: qty,
        unit_price: unit,
        discount_percent: discount,
        total_price: Math.round((Number.isFinite(total) ? total : base) * 100) / 100,
      } as CartItem;
    });

    customerName.value = order.customer_name || 'Walk-In Guest';
    orderType.value = (order.order_type as any) === 'TAKEAWAY' || (order.order_type as any) === 'DELIVERY'
      ? (order.order_type as any)
      : 'DINE_IN';
    orderDiscountPercent.value = Number(order.discount_percent) || 0;

    // Keep the table relationship.
    if (order.table_id) {
      let table = tablesStore.tables.find(t => t.id === order.table_id);
      if (!table && order.branch_id) {
        try {
          await tablesStore.fetchTables(order.branch_id);
          table = tablesStore.tables.find(t => t.id === order.table_id);
        } catch (_) { /* use fallback below */ }
      }
      selectedTable.value = table ?? {
        id: order.table_id,
        table_number: order.table_number || order.table_id,
        zone: '',
        capacity: 0,
        status: 'OCCUPIED',
      };
    }

    resumedOrder.value = { id: order.id, receipt_no: order.receipt_no };
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
      order_id: resumedOrder.value?.id ?? null,
      cashier_id: params.cashierId,
      table_id: selectedTable.value?.id || null,
      table_number: selectedTable.value?.table_number || null,
      customer_name: customerName.value,
      order_type: orderType.value,
      subtotal: subtotal.value,
      discount_amount: discountAmount.value,
      discount_percent: orderDiscountPercent.value,
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

    let res;
    try {
      res = await ordersApi.createOrder(payload);
    } catch (err: any) {
      throw apiErrorMessage(err, 'Checkout failed');
    }
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
      order_id: resumedOrder.value?.id ?? null,
      customer_name: customerName.value,
      table_id: selectedTable.value?.id ?? null,
      table_number: selectedTable.value?.table_number ?? null,
      order_type: orderType.value,
      subtotal: subtotal.value,
      discount_amount: discountAmount.value,
      discount_percent: orderDiscountPercent.value,
      tax_amount: taxAmount.value,
      total_amount: totalDue.value,
      items: items.value.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    };
    let res;
    try {
      res = await ordersApi.holdOrder(payload);
    } catch (err: any) {
      throw apiErrorMessage(err, 'Failed to hold order');
    }
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
    resumedOrder,
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
    resumeParkedOrder,
    processCheckout,
    holdOrder
  };
});
