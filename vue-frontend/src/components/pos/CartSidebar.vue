<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore } from '../../stores/cart.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import CartItemRow from './CartItemRow.vue';
import CartTotals from './CartTotals.vue';
import PaymentModal from './PaymentModal.vue';
import SplitBillModal from './SplitBillModal.vue';
import ParkedOrdersModal from './ParkedOrdersModal.vue';
import ReceiptModal from './ReceiptModal.vue';
import {
  ShoppingBag,
  Trash2,
  PauseCircle,
  Split,
  Banknote,
  QrCode,
  FolderOpen,
  User,
  MapPin,
  X
} from 'lucide-vue-next';
import type { PaymentMethod } from '../../types/pos.types';

const cartStore = useCartStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const showPaymentModal = ref(false);
const paymentInitialMethod = ref<PaymentMethod>('CASH');
const showSplitModal = ref(false);
const showParkedModal = ref(false);

function openPayment(method: PaymentMethod) {
  if (cartStore.items.length === 0) return;
  paymentInitialMethod.value = method;
  showPaymentModal.value = true;
}

async function handleHoldCart() {
  if (cartStore.items.length === 0) return;
  try {
    const branchId = authStore.activeBranch?.id || 'store_main';
    await cartStore.holdOrder(branchId);
    uiStore.showToast('Order parked and held successfully', 'success');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to hold order', 'error');
  }
}

function handleClearCart() {
  if (cartStore.items.length === 0) return;
  if (confirm('Clear all items from current cart?')) {
    cartStore.clearCart();
    uiStore.showToast('Cart cleared', 'info');
  }
}
</script>

<template>
  <aside class="w-full lg:w-96 xl:w-[420px] bg-white border-l border-slate-200 flex flex-col h-full select-none">
    <!-- Ticket Header -->
    <div class="p-3.5 border-b border-slate-100 flex flex-col gap-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ShoppingBag class="w-4 h-4 text-teal-600" />
          <h3 class="text-[13.5px] font-bold text-slate-800">Current Order</h3>
          <span class="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
            {{ cartStore.totalItemsCount }} items
          </span>
        </div>
        <button
          type="button"
          @click="showParkedModal = true"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition"
        >
          <FolderOpen class="w-3.5 h-3.5" />
          <span>Parked</span>
        </button>
      </div>

      <!-- Order Type Selector -->
      <div class="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold w-fit">
        <button
          type="button"
          @click="cartStore.orderType = 'DINE_IN'"
          class="px-2.5 py-1 rounded-lg transition"
          :class="cartStore.orderType === 'DINE_IN' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          Dine In
        </button>
        <button
          type="button"
          @click="cartStore.orderType = 'TAKEAWAY'"
          class="px-2.5 py-1 rounded-lg transition"
          :class="cartStore.orderType === 'TAKEAWAY' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          Takeaway
        </button>
      </div>

      <!-- Guest & Table Meta -->
      <div class="flex items-center gap-2">
        <div class="flex-1 relative">
          <User class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="cartStore.customerName"
            type="text"
            placeholder="Customer Name..."
            class="w-full h-8 pl-8 pr-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-teal-500"
          />
        </div>

        <!-- Table Badge if assigned -->
        <div
          v-if="cartStore.selectedTable"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold"
        >
          <MapPin class="w-3 h-3" />
          <span>{{ cartStore.selectedTable.table_number }}</span>
          <button @click="cartStore.selectedTable = null" class="text-teal-500 hover:text-teal-800">
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Scrollable Items List -->
    <div class="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2">
      <!-- Empty Cart State -->
      <div
        v-if="cartStore.items.length === 0"
        class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
      >
        <ShoppingBag class="w-12 h-12 text-slate-200 mb-2 stroke-[1.5]" />
        <h5 class="text-sm font-bold text-slate-500">Your cart is empty</h5>
        <p class="text-xs text-slate-400 mt-1 max-w-[200px]">Tap products from menu to add.</p>
      </div>

      <!-- Item Rows -->
      <CartItemRow
        v-for="(item, index) in cartStore.items"
        :key="item.product.id"
        :item="item"
        :index="index"
        @update-qty="cartStore.updateQuantity"
        @update-discount="cartStore.updateItemDiscount"
        @remove="cartStore.removeItem"
      />
    </div>

    <!-- Cart Footer & Totals -->
    <div class="p-3.5 border-t border-slate-100 bg-white flex flex-col gap-3">
      <CartTotals />

      <!-- Secondary Actions Row -->
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          @click="handleClearCart"
          :disabled="cartStore.items.length === 0"
          class="h-9 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-500 border border-slate-200 hover:border-rose-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          @click="handleHoldCart"
          :disabled="cartStore.items.length === 0"
          class="h-9 rounded-xl bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-600 border border-slate-200 hover:border-amber-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <PauseCircle class="w-3.5 h-3.5" />
          <span>Hold</span>
        </button>

        <button
          type="button"
          @click="showSplitModal = true"
          :disabled="cartStore.items.length === 0"
          class="h-9 rounded-xl bg-white hover:bg-sky-50 text-slate-500 hover:text-sky-600 border border-slate-200 hover:border-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Split class="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
      </div>

      <!-- Pay Buttons (2x2, matching reference layout) -->
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          @click="openPayment('CASH')"
          :disabled="cartStore.items.length === 0"
          class="h-12 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 flex flex-col items-center justify-center gap-0.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Banknote class="w-4 h-4" />
          <span class="text-[10.5px] font-extrabold tracking-wide">CASH PAY</span>
        </button>
        <button
          type="button"
          @click="openPayment('QR')"
          :disabled="cartStore.items.length === 0"
          class="h-12 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex flex-col items-center justify-center gap-0.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <QrCode class="w-4 h-4" />
          <span class="text-[10.5px] font-extrabold tracking-wide">QR CODE</span>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <PaymentModal :show="showPaymentModal" :initial-method="paymentInitialMethod" @close="showPaymentModal = false" />
    <SplitBillModal :show="showSplitModal" @close="showSplitModal = false" />
    <ParkedOrdersModal :show="showParkedModal" @close="showParkedModal = false" />
    <ReceiptModal />
  </aside>
</template>
