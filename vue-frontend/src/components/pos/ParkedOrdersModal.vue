<script setup lang="ts">
import { ref, watch } from 'vue';
import { ordersApi } from '../../api/orders.api';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { PauseCircle, ArrowRightCircle, RefreshCw } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const authStore = useAuthStore();
const cartStore = useCartStore();
const uiStore = useUiStore();

const parkedOrders = ref<any[]>([]);
const isLoading = ref(false);

async function loadParked() {
  isLoading.value = true;
  try {
    const branchId = authStore.activeBranch?.id || 'store_main';
    const res = await ordersApi.getParkedOrders(branchId);
    if (res.data.success) {
      parkedOrders.value = res.data.orders || [];
    }
  } catch (_) {
    parkedOrders.value = [];
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.show, (val) => {
  if (val) loadParked();
});

function resumeOrder(order: any) {
  // If cart currently has items, warn or replace
  cartStore.clearCart();
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      cartStore.addToCart({
        id: item.product_id,
        category_id: '',
        name: item.product_name,
        price: item.unit_price,
        cost: 0,
        stock_quantity: 99,
        tax_rate: 10,
        is_available: true
      });
    });
  }
  if (order.customer_name) {
    cartStore.customerName = order.customer_name;
  }
  uiStore.showToast(`Resumed ticket #${order.id || ''}`, 'success');
  emit('close');
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Parked / Held Orders"
    max-width="lg"
  >
    <div class="flex flex-col gap-3 select-none">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">Recall orders saved for later payment</span>
        <button
          @click="loadParked"
          class="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </button>
      </div>

      <div v-if="parkedOrders.length === 0" class="py-12 text-center text-slate-500">
        <PauseCircle class="w-10 h-10 mx-auto text-slate-600 mb-2" />
        <p class="text-sm font-semibold text-slate-300">No Parked Orders</p>
        <p class="text-xs text-slate-500 mt-0.5">Use "Hold Cart" on the POS terminal to temporarily park an active order.</p>
      </div>

      <div v-else class="flex flex-col gap-2 max-h-80 overflow-y-auto">
        <div
          v-for="order in parkedOrders"
          :key="order.id"
          class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
        >
          <div>
            <div class="font-bold text-sm text-white">
              {{ order.customer_name || 'Walk-In Guest' }}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              <span>{{ order.table_number ? `Table: ${order.table_number} • ` : '' }}</span>
              <span>{{ order.items?.length || 0 }} items</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-emerald-400">${{ (order.total_amount || 0).toFixed(2) }}</span>
            <button
              @click="resumeOrder(order)"
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition"
            >
              <span>Resume</span>
              <ArrowRightCircle class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
      >
        Close
      </button>
    </template>
  </AppModal>
</template>
