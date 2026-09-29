<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { authApi } from '../api/auth.api';
import PinPad from '../components/common/PinPad.vue';
import { ShieldCheck, UserCheck, Sparkles, KeyRound, LayoutGrid } from 'lucide-vue-next';

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

// Staff Cashier gets a one-tap sign-in (no PIN screen shown), matching the
// reference screenshot; Boss still goes through the PIN pad below since
// that role has full financial/oversight access.
function instantCashierLogin() {
  selectedUsername.value = 'cashier';
  quickLogin('cashier', '1234');
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#F5F7FA] flex flex-col items-center justify-center p-4 select-none">
    <div class="w-full max-w-md flex flex-col items-center">
      <!-- Brand Header -->
      <div class="flex flex-col items-center text-center mb-6">
        <div class="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg mb-3">
          <LayoutGrid class="w-7 h-7" />
        </div>
        <h1 class="text-xl font-black text-slate-900 tracking-tight">Gourmet Bistro POS</h1>
        <p class="text-[11px] text-slate-400 mt-0.5">OmniPOS Enterprise · Multi-Branch POS Suite</p>
        <span class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-200 text-[10px] font-bold">
          100% OFFLINE READY · DUAL-SCREEN &amp; CASH DRAWER ACTIVE
        </span>
      </div>

      <!-- Sign-in Card -->
      <div class="w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col items-center">
        <p class="text-[11px] font-bold text-slate-400 tracking-wider mb-4 self-start">SIGN IN TO OMNI POS</p>
        <p class="text-[10px] font-bold text-slate-400 tracking-wider mb-2 self-start">SELECT ROLE TO SIGN IN</p>

        <div class="grid grid-cols-2 gap-3 w-full mb-4">
          <button
            type="button"
            @click="selectedUsername = 'cashier'; pin = ''"
            class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
            :class="selectedUsername === 'cashier'
              ? 'bg-teal-600 border-teal-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'"
          >
            <UserCheck class="w-6 h-6 mb-1.5" />
            <span class="text-[12.5px] font-bold">Staff Cashier</span>
          </button>

          <button
            type="button"
            @click="selectedUsername = 'boss'; pin = ''"
            class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
            :class="selectedUsername === 'boss'
              ? 'bg-violet-600 border-violet-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'"
          >
            <ShieldCheck class="w-6 h-6 mb-1.5" />
            <span class="text-[12.5px] font-bold">Boss (Owner)</span>
          </button>
        </div>

        <p class="text-[11px] text-slate-400 mb-4">
          {{ selectedUsername === 'cashier' ? 'Instant frontline POS checkout' : 'Full oversight, P&L and settings access' }}
        </p>

        <!-- Cashier: one-tap sign in -->
        <button
          v-if="selectedUsername === 'cashier'"
          type="button"
          :disabled="isSubmitting"
          @click="instantCashierLogin"
          class="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <Sparkles class="w-4 h-4" />
          Login as Staff Cashier
        </button>

        <!-- Boss: PIN required -->
        <div v-else class="w-full flex flex-col items-center">
          <div class="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <KeyRound class="w-3.5 h-3.5 text-violet-500" />
            <span>Enter Boss PIN</span>
          </div>
          <PinPad
            v-model="pin"
            light
            :disabled="isSubmitting"
            submit-label="SIGN IN"
            @submit="handlePinSubmit"
          />
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-5 text-center text-[10.5px] text-slate-400 font-medium">
        Profile: POS CA9 (15.6" Landscape)
      </div>
    </div>
  </div>
</template>
