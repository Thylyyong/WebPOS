<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
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

const router = useRouter();
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

async function resumeOrder(order: any) {
  // Already the order being worked on — just go back to the terminal.
  if (cartStore.resumedOrder?.id === order.id) {
    emit('close');
    await router.push('/pos');
    return;
  }

  // Don't silently throw away an in-progress cart.
  if (cartStore.items.length > 0 &&
      !confirm('The current cart has items that are not saved. Replace it with this held order?')) {
    return;
  }

  try {
    // Continue the EXISTING order: load it into the main POS cart (no new order is created).
    await cartStore.resumeParkedOrder(order);
    emit('close');
    await router.push('/pos'); // no-op when already on the POS terminal
    uiStore.showToast(`Continuing held order ${order.receipt_no || ''}`.trim(), 'success');
  } catch (err: any) {
    uiStore.showToast(err?.message || 'Failed to resume held order', 'error');
  }
}
</script>

<template>
  <AppModal
    :show="show"
    light
    @close="emit('close')"
    title="Parked / Held Orders"
    max-width="lg"
  >
    <div class="flex flex-col gap-3 select-none">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">Tap an order to continue it on the POS terminal</span>
        <button
          @click="loadParked"
          class="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </button>
      </div>

      <div v-if="parkedOrders.length === 0" class="py-12 text-center text-slate-400">
        <PauseCircle class="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p class="text-sm font-semibold text-slate-500">No Parked Orders</p>
        <p class="text-xs text-slate-400 mt-0.5">Use "Hold Cart" on the POS terminal to temporarily park an active order.</p>
      </div>

      <div v-else class="flex flex-col gap-2 max-h-80 overflow-y-auto">
        <div
          v-for="order in parkedOrders"
          :key="order.id"
          role="button"
          tabindex="0"
          @click="resumeOrder(order)"
          @keydown.enter="resumeOrder(order)"
          class="p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <div class="font-bold text-sm text-slate-800">
              {{ order.customer_name || 'Walk-In Guest' }}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              <span>{{ order.receipt_no ? `${order.receipt_no} • ` : '' }}</span>
              <span>{{ order.table_number ? `${order.table_number} • ` : '' }}</span>
              <span>{{ order.items?.length || 0 }} items</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-teal-600">${{ (order.total_amount || 0).toFixed(2) }}</span>
            <button
              type="button"
              @click.stop="resumeOrder(order)"
              class="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 transition"
            >
              <span>Continue</span>
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
        class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition"
      >
        Close
      </button>
    </template>
  </AppModal>
</template>
