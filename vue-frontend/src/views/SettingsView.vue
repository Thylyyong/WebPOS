<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { settingsApi } from '../api/settings.api';
import { useUiStore } from '../stores/ui.store';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import StaffController from '../components/settings/StaffController.vue';
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';
import {
  Save,
  Store,
  Receipt,
  Sliders,
  QrCode,
  ShieldCheck,
  LogOut,
  Trash2,
  Upload,
  RefreshCw,
  X,
  Users,
} from 'lucide-vue-next';
import type { StoreSettings } from '../types/pos.types';

const uiStore = useUiStore();
const authStore = useAuthStore();
const router = useRouter();

const settings = ref<StoreSettings>({
  store_name: 'KIRI POS',
  store_address: '124 Grand Avenue, Suite 400',
  store_phone: '+1 (555) 019-2834',
  store_email: 'contact@kiripos.com',
  currency_symbol: '$',
  default_tax_rate: '10',
  receipt_header: 'Welcome to KIRI POS!',
  receipt_footer: 'Thank you for dining with us! Please come again.',
  qr_code_image: '',
  khqr_payload: '',
});

const isSaving = ref(false);
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
  const backendBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/api\/?$/, '') || '';
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
}

async function onQrFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    uiStore.showToast('Please select an image file (PNG, JPG, WEBP, SVG)', 'warning');
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
      settings.value.qr_code_image = res.data.qr_code_url || res.data.qr_code_image;
      uiStore.showToast('Payment QR code image uploaded successfully!', 'success');
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to upload QR image', 'error');
  } finally {
    isUploadingQr.value = false;
    input.value = '';
  }
}

function removeQrImage() {
  settings.value.qr_code_image = '';
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

onMounted(async () => {
  try {
    const res = await settingsApi.getSettings();
    if (res.data.success && res.data.settings) {
      settings.value = { ...settings.value, ...res.data.settings };
    }
  } catch (_) {}
});

async function saveSettings() {
  isSaving.value = true;
  try {
    await settingsApi.updateSettings(settings.value);
    uiStore.showToast('Store settings saved successfully', 'success');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to save settings', 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Settings &amp; Store Profile</template>
    <template #subtitle>Configure business details, taxes, receipts, and payment QR codes</template>
    <template #actions>
      <button
        type="button"
        @click="saveSettings"
        :disabled="isSaving"
        class="h-9 px-4 rounded-lg bg-teal-600 text-white flex items-center gap-1.5 text-xs font-semibold hover:bg-teal-700 shadow-sm transition disabled:opacity-50"
      >
        <RefreshCw v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
        <Save v-else class="w-3.5 h-3.5" />
        <span>{{ isSaving ? 'Saving...' : 'Save Settings' }}</span>
      </button>
    </template>

    <div class="max-w-4xl mx-auto w-full flex flex-col gap-5">
      <!-- One unified settings panel: each section is a row (title on the left, controls on the right) -->
      <div class="rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        <section class="p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Store class="w-4 h-4 text-teal-600" />
              <span>Store Profile</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">Business name, address and contact details shown on receipts.</p>
          </div>
          <div class="flex flex-col gap-3.5 min-w-0">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Store Name</label>
            <input
              v-model="settings.store_name"
              type="text"
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Store Address</label>
            <input
              v-model="settings.store_address"
              type="text"
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Phone Number</label>
            <input
              v-model="settings.store_phone"
              type="text"
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Email Address</label>
            <input
              v-model="settings.store_email"
              type="email"
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          </div>
        </section>
        <section class="p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Sliders class="w-4 h-4 text-teal-600" />
              <span>Taxes &amp; Currency</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">Currency symbol and the default sales tax rate.</p>
          </div>
          <div class="flex flex-col gap-3.5 min-w-0">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Currency Symbol</label>
            <input
              v-model="settings.currency_symbol"
              type="text"
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Default Sales Tax Rate (%)</label>
            <input
              v-model="settings.default_tax_rate"
              type="number"
              step="0.1"
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div class="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[11.5px] text-teal-800">
            Tax is calculated automatically on order checkout:
            <strong class="font-bold text-teal-900">Subtotal × (Tax Rate / 100)</strong>.
          </div>

          </div>
        </section>
        <section class="p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
              <QrCode class="w-4 h-4 text-teal-600" />
              <span>Customer Payment QR Code (ABA KHQR / PromptPay / Mobile Banking)</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">The QR code customers scan at checkout.</p>
          </div>
          <div class="flex flex-col gap-3.5 min-w-0">
          <p class="text-[12px] text-slate-500 -mt-1">
            Upload your merchant payment QR code image. This QR code is displayed to customers directly on the POS screen during QR checkout.
          </p>

          <input
            ref="qrFileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onQrFileChange"
          />

          <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div
              class="w-32 h-32 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative"
            >
              <img
                v-if="settings.qr_code_image"
                :src="resolveQrImageUrl(settings.qr_code_image)"
                alt="Payment QR"
                class="w-full h-full object-contain p-1"
              />
              <QrCode v-else class="w-10 h-10 text-slate-300" />
              <div
                v-if="isUploadingQr"
                class="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center"
              >
                <RefreshCw class="w-5 h-5 text-teal-600 animate-spin" />
              </div>
            </div>

            <div class="flex-1 flex flex-col gap-2 text-center sm:text-left">
              <div>
                <h4 class="text-[13px] font-bold text-slate-800">
                  {{ settings.qr_code_image ? 'Store Payment QR Configured' : 'No Payment QR Configured' }}
                </h4>
                <p class="text-[11.5px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, WEBP, or SVG images (Max 5MB).
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2 mt-1 justify-center sm:justify-start">
                <button
                  type="button"
                  @click="qrFileInput?.click()"
                  :disabled="isUploadingQr"
                  class="px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw v-if="isUploadingQr" class="w-3.5 h-3.5 animate-spin" />
                  <Upload v-else class="w-3.5 h-3.5" />
                  <span>{{ settings.qr_code_image ? 'Change QR Image' : 'Upload QR Image' }}</span>
                </button>
                <button
                  v-if="settings.qr_code_image"
                  type="button"
                  @click="removeQrImage"
                  class="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition flex items-center gap-1"
                >
                  <X class="w-3.5 h-3.5" />
                  <span>Remove QR</span>
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Static Bank / KHQR Payload String (Optional)</label>
            <input
              v-model="settings.khqr_payload"
              type="text"
              placeholder="e.g. 00020101021229370016A000000727040122..."
              class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          </div>
        </section>
        <section class="p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Receipt class="w-4 h-4 text-teal-600" />
              <span>Thermal Receipt Template Format</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">Header and footer printed on every receipt.</p>
          </div>
          <div class="flex flex-col gap-3.5 min-w-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-600">Receipt Header Banner</label>
              <textarea
                v-model="settings.receipt_header"
                rows="3"
                class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-600">Receipt Footer Thank You Message</label>
              <textarea
                v-model="settings.receipt_footer"
                rows="3"
                class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
          </div>

          </div>
        </section>
        <section v-if="authStore.isBoss" class="p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users class="w-4 h-4 text-teal-600" />
              <span>Staff Controller</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">Create cashier accounts and change their passwords. Changes here apply immediately.</p>
          </div>
          <div class="min-w-0">
            <StaffController />
          </div>
        </section>
        <section class="p-5 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
              <ShieldCheck class="w-4 h-4 text-teal-600" />
              <span>Current Account &amp; Access</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">The signed-in account and session control.</p>
          </div>
          <div class="flex flex-col items-start gap-3 min-w-0">
            <p class="text-xs text-slate-500">
            Logged in as <strong class="font-bold text-slate-800">{{ authStore.user?.name }}</strong> ({{ authStore.user?.role_name || authStore.user?.role }}). Store branch: <strong class="font-bold text-slate-800">{{ authStore.activeBranch?.name }}</strong>.
          </p>
            <button
              type="button"
              @click="handleLogout"
              class="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span>Switch Role / Logout</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </AppSidebarShell>
</template>
