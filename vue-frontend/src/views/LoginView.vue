<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { authApi } from '../api/auth.api';
import PinPad from '../components/common/PinPad.vue';
import { 
  Store, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  KeyRound, 
  ChefHat, 
  Coffee, 
  Users, 
  Shield,
  LayoutGrid
} from 'lucide-vue-next';

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
    if (res.data.success && res.data.roles && res.data.roles.length > 0) {
      availableRoles.value = res.data.roles;
      // Default to cashier or first user
      const defaultUser = res.data.roles.find((r: any) => r.username === 'cashier') || res.data.roles[0];
      if (defaultUser) {
        selectedUsername.value = defaultUser.username;
      }
    }
  } catch (_) {
    availableRoles.value = [
      { id: 17, name: 'Cashier', username: 'cashier', role: 'CASHIER', role_name: 'Cashier' },
      { id: 16, name: 'Boss', username: 'boss', role: 'BOSS', role_name: 'Boss / Owner' }
    ];
  }
});

function getRoleIcon(role: string) {
  const r = (role || '').toUpperCase();
  if (r.includes('BOSS') || r.includes('ADMIN') || r.includes('OWNER')) return ShieldCheck;
  if (r.includes('CHEF') || r.includes('KITCHEN')) return ChefHat;
  if (r.includes('BARISTA') || r.includes('COFFEE')) return Coffee;
  if (r.includes('WAITER')) return Users;
  return UserCheck;
}

function getRoleBadgeClass(role: string) {
  const r = (role || '').toUpperCase();
  if (r.includes('BOSS') || r.includes('ADMIN')) {
    return 'bg-amber-950/50 text-amber-300 border-amber-500/30';
  }
  if (r.includes('MANAGER')) {
    return 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30';
  }
  if (r.includes('CHEF')) {
    return 'bg-rose-950/50 text-rose-300 border-rose-500/30';
  }
  return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
}

function getCardActiveStyle(role: string) {
  const r = (role || '').toUpperCase();
  if (r.includes('BOSS') || r.includes('ADMIN')) {
    return 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
  }
  if (r.includes('MANAGER')) {
    return 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
  }
  if (r.includes('CHEF')) {
    return 'bg-rose-950/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]';
  }
  return 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
}

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
  <div class="min-h-screen w-full bg-[#090D16] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
    <!-- Ambient Glow Backgrounds -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

    <div class="w-full max-w-lg flex flex-col items-center relative z-10">
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

      <!-- Dynamic Role & Staff Selector Cards Grid -->
      <div class="w-full mb-6">
        <div class="flex items-center justify-between mb-2 px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Select Profile</span>
          <span class="text-[11px] text-slate-500">{{ availableRoles.length }} active profiles</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
          <button
            v-for="profile in availableRoles"
            :key="profile.id"
            type="button"
            @click="selectedUsername = profile.username; pin = ''"
            class="p-3 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
            :class="selectedUsername === profile.username
              ? getCardActiveStyle(profile.role)
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'"
          >
            <div
              class="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center mb-1.5 transition"
              :class="selectedUsername === profile.username ? 'text-white bg-slate-700' : 'text-slate-400'"
            >
              <component :is="getRoleIcon(profile.role)" class="w-4 h-4" />
            </div>

            <span class="text-xs font-bold text-white truncate max-w-full">
              {{ profile.name }}
            </span>

            <span
              class="mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border truncate max-w-full"
              :class="getRoleBadgeClass(profile.role)"
            >
              {{ profile.role_name || profile.role }}
            </span>
          </button>
        </div>
      </div>

      <!-- Touch Keypad Card -->
      <div class="w-full bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center">
        <div class="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <KeyRound class="w-3.5 h-3.5 text-emerald-400" />
          <span>Enter PIN for: <strong class="text-white capitalize font-mono">{{ selectedUsername }}</strong></span>
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

        <!-- Other roles: PIN required -->
        <div v-else class="w-full flex flex-col items-center">
          <PinPad
            v-model="pin"
            :disabled="isSubmitting"
            submit-label="SIGN IN"
            @submit="handlePinSubmit"
          />
        </div>

        <!-- One-Click Demo Shortcut Buttons -->
        <div class="mt-5 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs gap-2">
          <button
            type="button"
            @click="quickLogin('cashier', '1234')"
            class="flex-1 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto Cashier (1234)</span>
          </button>

          <button
            type="button"
            @click="quickLogin('boss', '9999')"
            class="flex-1 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles class="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Boss (9999)</span>
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-5 text-center text-[10.5px] text-slate-400 font-medium">
        Profile: POS CA9 (15.6" Landscape)
      </div>
    </div>
  </div>
</template>
