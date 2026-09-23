<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { settingsApi } from '../api/settings.api';
import { useUiStore } from '../stores/ui.store';
import AppHeader from '../components/common/AppHeader.vue';
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';
import { Settings, Save, Store, Receipt, Sliders, QrCode, ShieldCheck, LogOut, Trash2, Upload, Info } from 'lucide-vue-next';
import type { StoreSettings } from '../types/pos.types';

const uiStore = useUiStore();
const authStore = useAuthStore();
const router = useRouter();

const settings = ref<StoreSettings>({
  store_name: 'OmniPOS Bistro',
  store_address: '124 Grand Avenue, Suite 400',
  store_phone: '+1 (555) 019-2834',
  store_email: 'contact@omnipos-bistro.com',
  currency_symbol: '$',
  default_tax_rate: '10',
  receipt_header: 'Welcome to OmniPOS Bistro!',
  receipt_footer: 'Thank you for dining with us! Please come again.',
  qr_code_image: '',
  khqr_payload: ''
});

const isSaving = ref(false);

function onQrFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 800 * 1024) {
    uiStore.showToast('Please choose an image under 800KB (stored as text in the settings table).', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => { settings.value.qr_code_image = reader.result as string; };
  reader.readAsDataURL(file);
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

// Neither of these has a backend route: AuthController has no PIN-update
// endpoint, and there is no "wipe transactional data" endpoint anywhere in
// routes/api.php. Left disabled rather than faked.
function pinChangeNotSupported() {
  uiStore.showToast('Changing the Boss PIN needs a backend auth endpoint that does not exist yet.', 'warning');
}
function resetDbNotSupported() {
  uiStore.showToast('Resetting the database needs a dedicated backend endpoint — not implemented, to avoid touching the backend.', 'warning');
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
  <div class="h-screen w-screen flex flex-col bg-[#090D16] overflow-hidden select-none">
    <AppHeader />

    <main class="flex-1 p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-6">
      <!-- Title & Save Action Bar -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-black text-white flex items-center gap-2.5">
              <Settings class="w-6 h-6 text-emerald-400" />
              <span>Store & POS Terminal Settings</span>
            </h2>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Boss Only
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Customize business identity, sales tax calculations, and thermal receipts.</p>
        </div>

        <button
          type="button"
          @click="saveSettings"
          :disabled="isSaving"
          class="h-10 px-5 rounded-xl glow-btn-primary flex items-center gap-2 text-xs font-bold transition disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          <span>{{ isSaving ? 'Saving...' : 'Save Settings' }}</span>
        </button>
      </div>

      <!-- Settings Cards Form -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Store Information -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
          <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <Store class="w-4 h-4 text-emerald-400" />
            <span>Store Profile</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Store Name</label>
            <input
              v-model="settings.store_name"
              type="text"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Store Address</label>
            <input
              v-model="settings.store_address"
              type="text"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Phone Number</label>
            <input
              v-model="settings.store_phone"
              type="text"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Email Address</label>
            <input
              v-model="settings.store_email"
              type="email"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Tax & Currency Configuration -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
          <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <Sliders class="w-4 h-4 text-cyan-400" />
            <span>Taxes & Currency</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Currency Symbol</label>
            <input
              v-model="settings.currency_symbol"
              type="text"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Default Sales Tax Rate (%)</label>
            <input
              v-model="settings.default_tax_rate"
              type="number"
              step="0.1"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Tax is calculated automatically on order checkout: <strong class="text-slate-300">Subtotal × (Tax Rate / 100)</strong>.
          </div>
        </div>

        <!-- Receipt Customization (Full width) -->
        <div class="md:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
          <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <Receipt class="w-4 h-4 text-amber-400" />
            <span>Thermal Receipt Template Format</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Receipt Header Banner</label>
              <textarea
                v-model="settings.receipt_header"
                rows="3"
                class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Receipt Footer Thank You Message</label>
              <textarea
                v-model="settings.receipt_footer"
                rows="3"
                class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <!-- Payment QR -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
          <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <QrCode class="w-4 h-4 text-emerald-400" />
            <span>Static Payment QR Code (KHQR / PromptPay)</span>
          </div>
          <p class="text-[11px] text-slate-400 -mt-1">
            Upload your static merchant QR code (ABA KHQR, PromptPay, Wing) for customer checkout scans.
          </p>

          <div class="flex items-center gap-3">
            <div class="w-20 h-20 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="settings.qr_code_image" :src="settings.qr_code_image" class="w-full h-full object-contain" />
              <QrCode v-else class="w-6 h-6 text-slate-700" />
            </div>
            <label class="flex-1 h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 flex items-center gap-2 cursor-pointer hover:border-emerald-500/50">
              <Upload class="w-3.5 h-3.5" />
              <span>Upload QR Code Image</span>
              <input type="file" accept="image/*" class="hidden" @change="onQrFileChange" />
            </label>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Bank Payment QR Payload / KHQR String (Optional)</label>
            <input
              v-model="settings.khqr_payload"
              type="text"
              placeholder="Encoded onto printed receipts when static QR image is unset"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Employee Security -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
          <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <ShieldCheck class="w-4 h-4 text-emerald-400" />
            <span>Employee Security & Change PIN</span>
          </div>
          <p class="text-[11px] text-slate-400 -mt-1">
            Change master security PIN for Owner (Boss). Staff Cashier does not require a PIN for fast frontline access.
          </p>

          <div class="flex items-start gap-2 p-2.5 rounded-xl bg-sky-950/40 border border-sky-900/50 text-[10.5px] text-sky-300">
            <Info class="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>PIN changes aren't wired up — the auth API only exposes login, /me, logout and switch-branch, with no PIN-update route.</span>
          </div>

          <div class="flex items-center gap-2 mt-auto">
            <button
              type="button"
              @click="pinChangeNotSupported"
              class="flex-1 h-10 rounded-xl border border-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <ShieldCheck class="w-3.5 h-3.5" />
              Change Boss PIN
            </button>
            <button
              type="button"
              @click="handleLogout"
              class="flex-1 h-10 rounded-xl glow-btn-primary text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogOut class="w-3.5 h-3.5" />
              Switch Role / Logout
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="md:col-span-2 p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex flex-col gap-3">
          <div class="flex items-center gap-2 text-sm font-bold text-rose-300">
            <Trash2 class="w-4 h-4" />
            <span>Reset Database (Fresh Client Setup)</span>
          </div>
          <p class="text-[11px] text-rose-300/70">
            Permanently clears all sales transactions, order history, custom categories, products, register
            sessions, and restores initial factory defaults. Use this before selling or deploying to a new client.
          </p>
          <p class="text-[10.5px] text-slate-400">
            Disabled: there is no reset/wipe route in <code class="font-mono">routes/api.php</code>, and adding one
            would mean modifying the backend, which is outside the scope of this frontend-only change.
          </p>
          <button
            type="button"
            @click="resetDbNotSupported"
            class="self-start h-10 px-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center gap-2 cursor-not-allowed"
          >
            <Trash2 class="w-3.5 h-3.5" />
            Reset Database
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
