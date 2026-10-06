<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import PinPad from '../components/common/PinPad.vue';
import { ShieldCheck, UserCheck, KeyRound, LayoutGrid, LogIn } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();

// 'staff' = individual cashier/staff account (name or username + password)
// 'boss'  = Owner/Admin PIN pad (unchanged)
const mode = ref<'staff' | 'boss'>('staff');
const pin = ref('');
const loginName = ref('');
const loginPassword = ref('');
const isSubmitting = ref(false);

function loginErrorMessage(err: any, fallback: string): string {
  return err?.response?.data?.message || err?.message || fallback;
}

// Owner/Admin: existing PIN pad flow
async function handlePinSubmit(code: string) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await authStore.loginWithPin(code, 'boss');
    uiStore.showToast(`Welcome back, ${res.user.name}!`, 'success');
    router.push('/pos');
  } catch (err: any) {
    uiStore.showToast(loginErrorMessage(err, 'Invalid PIN code'), 'error');
    pin.value = '';
  } finally {
    isSubmitting.value = false;
  }
}

// Individual cashier/staff: the account the Admin created in Settings → Staff Controller
async function handleStaffLogin() {
  if (isSubmitting.value) return;
  const name = loginName.value.trim();
  if (!name || !loginPassword.value) {
    uiStore.showToast('Enter your name or username and password', 'warning');
    return;
  }
  isSubmitting.value = true;
  try {
    const res = await authStore.loginWithPin(loginPassword.value, name);
    uiStore.showToast(`Welcome back, ${res.user.name}!`, 'success');
    router.push('/pos');
  } catch (err: any) {
    uiStore.showToast(
      err?.response?.status === 401 ? 'Invalid name/username or password' : loginErrorMessage(err, 'Login failed'),
      'error'
    );
    loginPassword.value = '';
  } finally {
    isSubmitting.value = false;
  }
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
        <h1 class="text-xl font-black text-slate-900 tracking-tight">KIRI POS</h1>
        <p class="text-[11px] text-slate-400 mt-0.5">KIRI POS Enterprise · Multi-Branch POS Suite</p>
        <span class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-200 text-[10px] font-bold">
          100% OFFLINE READY · DUAL-SCREEN &amp; CASH DRAWER ACTIVE
        </span>
      </div>

      <!-- Sign-in Card -->
      <div class="w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col items-center">
        <p class="text-[11px] font-bold text-slate-400 tracking-wider mb-4 self-start">SIGN IN TO KIRI POS</p>
        <p class="text-[10px] font-bold text-slate-400 tracking-wider mb-2 self-start">SELECT ROLE TO SIGN IN</p>

        <div class="grid grid-cols-2 gap-3 w-full mb-4">
          <button
            type="button"
            @click="mode = 'staff'; pin = ''"
            class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
            :class="mode === 'staff'
              ? 'bg-teal-600 border-teal-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'"
          >
            <UserCheck class="w-6 h-6 mb-1.5" />
            <span class="text-[12.5px] font-bold">Staff / Cashier</span>
          </button>

          <button
            type="button"
            @click="mode = 'boss'; pin = ''"
            class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-200"
            :class="mode === 'boss'
              ? 'bg-violet-600 border-violet-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'"
          >
            <ShieldCheck class="w-6 h-6 mb-1.5" />
            <span class="text-[12.5px] font-bold">Boss (Owner)</span>
          </button>
        </div>

        <p class="text-[11px] text-slate-400 mb-4">
          {{ mode === 'staff' ? 'Sign in with your own staff account' : 'Full oversight, P&L and settings access' }}
        </p>

        <!-- Staff / Cashier: own account -->
        <form v-if="mode === 'staff'" class="w-full flex flex-col gap-3" @submit.prevent="handleStaffLogin">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-slate-500">Name / Username</label>
            <input
              v-model="loginName"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              placeholder="e.g. Dara"
              :disabled="isSubmitting"
              class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white disabled:opacity-50"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-slate-500">Password</label>
            <input
              v-model="loginPassword"
              type="password"
              autocomplete="current-password"
              placeholder="Password"
              :disabled="isSubmitting"
              class="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full h-12 mt-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <LogIn class="w-4 h-4" />
            {{ isSubmitting ? 'Signing in...' : 'Login' }}
          </button>
        </form>

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
