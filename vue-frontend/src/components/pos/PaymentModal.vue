<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCartStore } from '../../stores/cart.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { Banknote, CreditCard, QrCode, CheckCircle2, ArrowRight } from 'lucide-vue-next';
import type { PaymentMethod } from '../../types/pos.types';

const props = defineProps<{
  show: boolean;
  initialMethod?: PaymentMethod;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const cartStore = useCartStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const selectedMethod = ref<PaymentMethod>('CASH');
const cashTendered = ref<number>(cartStore.totalDue);
const isProcessing = ref(false);

watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedMethod.value = props.initialMethod || 'CASH';
    cashTendered.value = cartStore.totalDue;
  }
});

const changeDue = computed(() => {
  if (selectedMethod.value !== 'CASH') return 0;
  return Math.max(0, Math.round((cashTendered.value - cartStore.totalDue) * 100) / 100);
});

const canSubmit = computed(() => {
  if (cartStore.items.length === 0) return false;
  if (selectedMethod.value === 'CASH') {
    return cashTendered.value >= cartStore.totalDue;
  }
  return true;
});

function setTender(amount: number) {
  cashTendered.value = amount;
}

async function handleCompletePayment() {
  if (!canSubmit.value || isProcessing.value) return;
  isProcessing.value = true;
  try {
    const branchId = authStore.activeBranch?.id || 'store_main';
    const cashierId = authStore.user?.id || 17;

    const order = await cartStore.processCheckout({
      branchId,
      cashierId,
      paymentMethod: selectedMethod.value,
      cashTendered: selectedMethod.value === 'CASH' ? cashTendered.value : undefined
    });

    uiStore.showToast(`Order #${order.receipt_no} completed successfully!`, 'success');
    emit('close');
    uiStore.openReceipt(order);
  } catch (err: any) {
    uiStore.showToast(err.message || 'Payment processing failed', 'error');
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    light
    @close="emit('close')"
    title="Checkout & Tender Payment"
    max-width="lg"
  >
    <div class="flex flex-col gap-4 select-none">
      <!-- Total Due Banner -->
      <div class="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between">
        <div>
          <span class="text-xs uppercase font-bold tracking-wider text-teal-600/80">Total Amount Due</span>
          <div class="text-3xl font-black text-teal-700 font-mono tracking-tight mt-0.5">
            ${{ cartStore.totalDue.toFixed(2) }}
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-500 font-medium">Guest: {{ cartStore.customerName }}</span>
          <div v-if="cartStore.selectedTable" class="text-xs text-teal-600 font-semibold mt-0.5">
            {{ cartStore.selectedTable.table_number }}
          </div>
        </div>
      </div>

      <!-- Payment Method Tabs -->
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          @click="selectedMethod = 'CASH'"
          class="h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition"
          :class="selectedMethod === 'CASH'
            ? 'bg-teal-50 border-teal-400 text-teal-700'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'"
        >
          <Banknote class="w-5 h-5" />
          <span>Cash</span>
        </button>

        <button
          type="button"
          @click="selectedMethod = 'CARD'"
          class="h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition"
          :class="selectedMethod === 'CARD'
            ? 'bg-teal-50 border-teal-400 text-teal-700'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'"
        >
          <CreditCard class="w-5 h-5" />
          <span>Credit / Debit Card</span>
        </button>

        <button
          type="button"
          @click="selectedMethod = 'QR'"
          class="h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition"
          :class="selectedMethod === 'QR'
            ? 'bg-teal-50 border-teal-400 text-teal-700'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'"
        >
          <QrCode class="w-5 h-5" />
          <span>QR PromptPay / Code</span>
        </button>
      </div>

      <!-- Cash Tendered Details (When Cash selected) -->
      <div v-if="selectedMethod === 'CASH'" class="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <label class="text-xs font-semibold text-slate-500">Cash Tendered by Customer</label>

        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
          <input
            v-model.number="cashTendered"
            type="number"
            step="0.01"
            class="w-full h-12 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-xl font-bold font-mono text-slate-800 focus:outline-none focus:border-teal-500"
          />
        </div>

        <!-- Quick Cash Buttons -->
        <div class="grid grid-cols-5 gap-2 mt-1">
          <button
            type="button"
            @click="setTender(cartStore.totalDue)"
            class="h-10 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
          >
            Exact
          </button>
          <button
            type="button"
            @click="setTender(Math.ceil(cartStore.totalDue / 10) * 10 || 10)"
            class="h-10 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
          >
            Round $10
          </button>
          <button
            type="button"
            @click="setTender(20)"
            class="h-10 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
          >
            $20
          </button>
          <button
            type="button"
            @click="setTender(50)"
            class="h-10 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
          >
            $50
          </button>
          <button
            type="button"
            @click="setTender(100)"
            class="h-10 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
          >
            $100
          </button>
        </div>

        <!-- Change Due Highlight -->
        <div class="mt-2 p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Change Due to Customer</span>
          <span
            class="text-xl font-black font-mono"
            :class="cashTendered >= cartStore.totalDue ? 'text-teal-600' : 'text-rose-500'"
          >
            ${{ changeDue.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Card / QR Instructions -->
      <div v-else class="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center flex flex-col items-center gap-2">
        <div class="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <h4 class="text-sm font-bold text-slate-800">Ready for {{ selectedMethod === 'CARD' ? 'Card Swipe / Tap' : 'QR Scan' }}</h4>
        <p class="text-xs text-slate-500 max-w-xs">
          Terminal is listening. Tap "Complete Transaction" once authorized on the physical EFTPOS / QR terminal.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        :disabled="isProcessing"
        class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="button"
        @click="handleCompletePayment"
        :disabled="!canSubmit || isProcessing"
        class="px-6 py-2.5 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span v-if="isProcessing">Processing...</span>
        <template v-else>
          <span>Complete Transaction</span>
          <ArrowRight class="w-4 h-4" />
        </template>
      </button>
    </template>
  </AppModal>
</template>
