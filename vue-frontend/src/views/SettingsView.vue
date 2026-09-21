<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { settingsApi } from '../api/settings.api';
import { useUiStore } from '../stores/ui.store';
import AppHeader from '../components/common/AppHeader.vue';
import { Settings, Save, Store, Receipt, Sliders } from 'lucide-vue-next';
import type { StoreSettings } from '../types/pos.types';

const uiStore = useUiStore();

const settings = ref<StoreSettings>({
  store_name: 'OmniPOS Bistro',
  store_address: '124 Grand Avenue, Suite 400',
  store_phone: '+1 (555) 019-2834',
  store_email: 'contact@omnipos-bistro.com',
  currency_symbol: '$',
  default_tax_rate: '10',
  receipt_header: 'Welcome to OmniPOS Bistro!',
  receipt_footer: 'Thank you for dining with us! Please come again.'
});

const isSaving = ref(false);

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
      </div>
    </main>
  </div>
</template>
