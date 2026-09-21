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
  CreditCard, 
  FolderOpen, 
  User, 
  MapPin, 
  X 
} from 'lucide-vue-next';

const cartStore = useCartStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const showPaymentModal = ref(false);
const showSplitModal = ref(false);
const showParkedModal = ref(false);

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
  <aside class="w-full lg:w-96 xl:w-[420px] bg-slate-950/80 border-l border-slate-800/80 flex flex-col h-full select-none">
    <!-- Ticket Header -->
    <div class="p-3.5 border-b border-slate-800 flex flex-col gap-2.5">
      <!-- Order Type Selector & Recall Parked -->
      <div class="flex items-center justify-between">
        <div class="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            @click="cartStore.orderType = 'DINE_IN'"
            class="px-2.5 py-1 rounded-lg transition"
            :class="cartStore.orderType === 'DINE_IN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          >
            Dine In
          </button>
          <button
            type="button"
            @click="cartStore.orderType = 'TAKEAWAY'"
            class="px-2.5 py-1 rounded-lg transition"
            :class="cartStore.orderType === 'TAKEAWAY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          >
            Takeaway
          </button>
        </div>

        <button
          type="button"
          @click="showParkedModal = true"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-amber-400 hover:bg-amber-950/20 border border-slate-800 transition"
        >
          <FolderOpen class="w-3.5 h-3.5" />
          <span>Parked Tickets</span>
        </button>
      </div>

      <!-- Guest & Table Meta -->
      <div class="flex items-center gap-2">
        <div class="flex-1 relative">
          <User class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="cartStore.customerName"
            type="text"
            placeholder="Customer Name..."
            class="w-full h-8 pl-8 pr-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <!-- Table Badge if assigned -->
        <div
          v-if="cartStore.selectedTable"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold"
        >
          <MapPin class="w-3 h-3" />
          <span>{{ cartStore.selectedTable.table_number }}</span>
          <button @click="cartStore.selectedTable = null" class="text-indigo-400 hover:text-white">
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
        class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500"
      >
        <ShoppingBag class="w-12 h-12 text-slate-700 mb-2 stroke-[1.5]" />
        <h5 class="text-sm font-bold text-slate-400">Order is Empty</h5>
        <p class="text-xs text-slate-600 mt-1 max-w-[200px]">Tap products on the menu or scan a barcode to begin.</p>
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
    <div class="p-3.5 border-t border-slate-800/90 bg-slate-950/90 flex flex-col gap-3">
      <CartTotals />

      <!-- Action Buttons Row -->
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          @click="handleClearCart"
          :disabled="cartStore.items.length === 0"
          class="h-10 rounded-xl bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          @click="handleHoldCart"
          :disabled="cartStore.items.length === 0"
          class="h-10 rounded-xl bg-slate-900 hover:bg-amber-950/30 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-800/40 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <PauseCircle class="w-3.5 h-3.5" />
          <span>Hold Cart</span>
        </button>

        <button
          type="button"
          @click="showSplitModal = true"
          :disabled="cartStore.items.length === 0"
          class="h-10 rounded-xl bg-slate-900 hover:bg-cyan-950/30 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-cyan-800/40 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Split class="w-3.5 h-3.5" />
          <span>Split Bill</span>
        </button>
      </div>

      <!-- Main Pay / Tender Button -->
      <button
        type="button"
        @click="showPaymentModal = true"
        :disabled="cartStore.items.length === 0"
        class="w-full h-14 rounded-2xl glow-btn-primary flex items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <CreditCard class="w-5 h-5" />
        <span>Pay / Checkout (${{ cartStore.totalDue.toFixed(2) }})</span>
      </button>
    </div>

    <!-- Modals -->
    <PaymentModal :show="showPaymentModal" @close="showPaymentModal = false" />
    <SplitBillModal :show="showSplitModal" @close="showSplitModal = false" />
    <ParkedOrdersModal :show="showParkedModal" @close="showParkedModal = false" />
    <ReceiptModal />
  </aside>
</template>
