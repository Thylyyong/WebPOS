<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { authApi } from '../api/auth.api';
import PinPad from '../components/common/PinPad.vue';
import { Store, ShieldCheck, UserCheck, Sparkles, KeyRound } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();

const pin = ref('');
const selectedUsername = ref<string>('cashier');
const isSubmitting = ref(false);
const availableRoles = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await authApi.getRoles();
    if (res.data.success && res.data.roles) {
      availableRoles.value = res.data.roles;
    }
  } catch (_) {
    availableRoles.value = [
      { id: 16, name: 'Boss', username: 'boss', role: 'BOSS' },
      { id: 17, name: 'Cashier', username: 'cashier', role: 'CASHIER' }
    ];
  }
});

async function handlePinSubmit(code: string) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await authStore.loginWithPin(code, selectedUsername.value);
    uiStore.showToast(`Welcome back, ${res.user.name}!`, 'success');
    router.push('/pos');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Invalid PIN code', 'error');
    pin.value = '';
  } finally {
    isSubmitting.value = false;
  }
}

function quickLogin(username: string, defaultPin: string) {
  selectedUsername.value = username;
  pin.value = defaultPin;
  handlePinSubmit(defaultPin);
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#090D16] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
    <!-- Ambient Glow Backgrounds -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

    <div class="w-full max-w-md flex flex-col items-center relative z-10">
      <!-- Brand Header -->
      <div class="flex flex-col items-center text-center mb-6">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] mb-3">
          <Store class="w-9 h-9" />
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">OmniPOS Terminal</h1>
        <p class="text-xs text-slate-400 mt-1">Select staff profile & enter 4-digit PIN</p>
      </div>

      <!-- Role Selector Cards -->
      <div class="grid grid-cols-2 gap-3 w-full mb-6">
        <!-- Cashier Card -->
        <button
          type="button"
          @click="selectedUsername = 'cashier'; pin = ''"
          class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
          :class="selectedUsername === 'cashier'
            ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'"
        >
          <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-2" :class="selectedUsername === 'cashier' ? 'text-emerald-400' : 'text-slate-400'">
            <UserCheck class="w-5 h-5" />
          </div>
          <span class="text-sm font-bold text-white">Cashier</span>
          <span class="text-[10px] text-slate-400 mt-0.5">Terminal & Tables</span>
          <span class="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 font-semibold border border-slate-700">
            PIN: 1234
          </span>
        </button>

        <!-- Boss Card -->
        <button
          type="button"
          @click="selectedUsername = 'boss'; pin = ''"
          class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
          :class="selectedUsername === 'boss'
            ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'"
        >
          <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-2" :class="selectedUsername === 'boss' ? 'text-amber-400' : 'text-slate-400'">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <span class="text-sm font-bold text-white">Boss</span>
          <span class="text-[10px] text-slate-400 mt-0.5">Full Oversight & P&L</span>
          <span class="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-amber-400 font-semibold border border-slate-700">
            PIN: 9999
          </span>
        </button>
      </div>

      <!-- Touch Keypad Card -->
      <div class="w-full bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center">
        <div class="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <KeyRound class="w-3.5 h-3.5 text-emerald-400" />
          <span>Enter Passcode for: <strong class="text-white capitalize">{{ selectedUsername }}</strong></span>
        </div>

        <PinPad
          v-model="pin"
          :disabled="isSubmitting"
          submit-label="SIGN IN"
          @submit="handlePinSubmit"
        />

        <!-- One-Click Demo Shortcut Buttons -->
        <div class="mt-5 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs gap-2">
          <button
            type="button"
            @click="quickLogin('cashier', '1234')"
            class="flex-1 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto Cashier</span>
          </button>

          <button
            type="button"
            @click="quickLogin('boss', '9999')"
            class="flex-1 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles class="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Boss</span>
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-6 text-center text-[11px] text-slate-500 font-medium">
        OmniPOS Cloud • Connected to Laravel Backend (SQLite)
      </div>
    </div>
  </div>
</template>
