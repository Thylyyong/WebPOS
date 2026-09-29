<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCartStore } from '../../stores/cart.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import { settingsApi } from '../../api/settings.api';
import AppModal from '../common/AppModal.vue';
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowRight,
  Upload,
  RefreshCw,
} from 'lucide-vue-next';
import type { PaymentMethod, StoreSettings } from '../../types/pos.types';

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

const storeSettings = ref<StoreSettings | null>(null);
const qrImageUrl = ref<string>('');
const isUploadingQr = ref(false);
const qrFileInput = ref<HTMLInputElement | null>(null);

function resolveQrImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }
  return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
}

async function loadStoreQr() {
  try {
    const res = await settingsApi.getSettings();
    if (res.data.success && res.data.settings) {
      storeSettings.value = res.data.settings;
      qrImageUrl.value = res.data.settings.qr_code_url || res.data.settings.qr_code_image || '';
    }
  } catch (err) {
    console.error('Failed to load store settings:', err);
  }
}

onMounted(loadStoreQr);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      selectedMethod.value = props.initialMethod || 'CASH';
      cashTendered.value = cartStore.totalDue;
      loadStoreQr();
    }
  }
);

async function handleQrImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    uiStore.showToast('Please choose a valid image file (PNG, JPG, WEBP, SVG)', 'warning');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    uiStore.showToast('QR image must be under 5MB', 'warning');
    input.value = '';
    return;
  }

  isUploadingQr.value = true;
  try {
    const res = await settingsApi.uploadQrImage(file);
    if (res.data.success) {
      qrImageUrl.value = res.data.qr_code_url || res.data.qr_code_image;
      uiStore.showToast('Store payment QR image updated successfully!', 'success');
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to upload QR image', 'error');
  } finally {
    isUploadingQr.value = false;
    input.value = '';
  }
}

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
      cashTendered: selectedMethod.value === 'CASH' ? cashTendered.value : undefined,
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
          :class="
            selectedMethod === 'CASH'
              ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
          "
        >
          <Banknote class="w-5 h-5" />
          <span>Cash</span>
        </button>

        <button
          type="button"
          @click="selectedMethod = 'CARD'"
          class="h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition"
          :class="
            selectedMethod === 'CARD'
              ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
          "
        >
          <CreditCard class="w-5 h-5" />
          <span>Credit / Debit Card</span>
        </button>

        <button
          type="button"
          @click="selectedMethod = 'QR'"
          class="h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition"
          :class="
            selectedMethod === 'QR'
              ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
          "
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

      <!-- Card Swipe / Tap Instructions (When Card selected) -->
      <div v-else-if="selectedMethod === 'CARD'" class="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center flex flex-col items-center gap-2">
        <div class="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
          <CreditCard class="w-6 h-6" />
        </div>
        <h4 class="text-sm font-bold text-slate-800">Ready for Card Swipe / Tap</h4>
        <p class="text-xs text-slate-500 max-w-xs">
          Insert, swipe, or tap customer card on terminal. Tap "Complete Transaction" once authorized on the physical EFTPOS / Card terminal.
        </p>
      </div>

      <!-- QR Payment (When QR selected) -->
      <div v-else-if="selectedMethod === 'QR'" class="flex flex-col items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <!-- Hidden file input for uploading QR code -->
        <input
          ref="qrFileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleQrImageUpload"
        />

        <!-- If QR image is configured -->
        <template v-if="qrImageUrl">
          <div class="text-center">
            <h4 class="text-[13.5px] font-bold text-slate-800">Scan QR Code to Pay</h4>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Supports ABA KHQR, PromptPay, Bakong, Wing, or Any Banking App
            </p>
          </div>

          <!-- QR Image Card -->
          <div class="relative bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
            <img
              :src="resolveQrImageUrl(qrImageUrl)"
              alt="Payment QR Code"
              class="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl select-none"
              loading="lazy"
            />
            <div
              v-if="isUploadingQr"
              class="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-2"
            >
              <RefreshCw class="w-6 h-6 text-teal-600 animate-spin" />
              <span class="text-xs font-semibold text-teal-700">Updating QR...</span>
            </div>
          </div>

          <!-- Total Due badge -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <span>Amount Due:</span>
            <span class="font-extrabold text-teal-700 font-mono text-sm">${{ cartStore.totalDue.toFixed(2) }}</span>
          </div>

          <!-- Admin Quick Action: Change QR -->
          <div class="flex items-center gap-3 mt-0.5">
            <button
              type="button"
              @click="qrFileInput?.click()"
              :disabled="isUploadingQr"
              class="flex items-center gap-1.5 text-[11.5px] font-semibold text-teal-600 hover:text-teal-700 transition hover:underline"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ isUploadingQr ? 'Uploading...' : 'Change QR Image' }}</span>
            </button>
          </div>
        </template>

        <!-- If NO QR image configured yet -->
        <template v-else>
          <div class="w-full py-6 flex flex-col items-center justify-center text-center gap-2.5">
            <div class="w-14 h-14 rounded-2xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shadow-xs">
              <QrCode class="w-7 h-7" />
            </div>
            <div>
              <h4 class="text-[13.5px] font-bold text-slate-800">No Payment QR Configured</h4>
              <p class="text-[11.5px] text-slate-400 max-w-xs mt-1">
                Admin can upload a merchant payment QR code (ABA KHQR, PromptPay, Wing) to show directly to customers here.
              </p>
            </div>
            <button
              type="button"
              @click="qrFileInput?.click()"
              :disabled="isUploadingQr"
              class="mt-1 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-teal-700 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw v-if="isUploadingQr" class="w-3.5 h-3.5 animate-spin" />
              <Upload v-else class="w-3.5 h-3.5" />
              <span>{{ isUploadingQr ? 'Uploading...' : 'Upload Payment QR Image' }}</span>
            </button>
          </div>
        </template>
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
        class="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
