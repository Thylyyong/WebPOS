<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useRegisterStore } from '../../stores/register.store';
import { 
  ShoppingBag, 
  Grid2x2, 
  Landmark, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Store, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const registerStore = useRegisterStore();

const currentTime = ref('');
let timer: any = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  if (authStore.activeBranch?.id) {
    registerStore.fetchCurrentSession(authStore.activeBranch.id).catch(() => {});
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="h-16 px-4 bg-slate-950/90 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 select-none">
    <!-- Left: Brand Logo & Branch Info -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <Store class="w-5 h-5" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-extrabold text-white text-base tracking-tight">OmniPOS</span>
          <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Terminal</span>
        </div>
        <div class="text-xs text-slate-400 flex items-center gap-1.5">
          <span>{{ authStore.activeBranch?.name || 'Main Branch' }}</span>
        </div>
      </div>
    </div>

    <!-- Center: Main Navigation Tabs -->
    <nav class="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
      <RouterLink
        to="/pos"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
        :class="route.path === '/pos' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
      >
        <ShoppingBag class="w-4 h-4" />
        <span>POS Terminal</span>
      </RouterLink>

      <RouterLink
        to="/tables"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
        :class="route.path === '/tables' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
      >
        <Grid2x2 class="w-4 h-4" />
        <span>Floor Plan</span>
      </RouterLink>

      <RouterLink
        to="/register"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
        :class="route.path === '/register' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
      >
        <Landmark class="w-4 h-4" />
        <span>Cash Register</span>
      </RouterLink>

      <RouterLink
        v-if="authStore.isBoss"
        to="/accounting"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
        :class="route.path === '/accounting' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
      >
        <TrendingUp class="w-4 h-4" />
        <span>P&L Financials</span>
      </RouterLink>

      <RouterLink
        v-if="authStore.isBoss"
        to="/settings"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
        :class="route.path === '/settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
      >
        <Settings class="w-4 h-4" />
        <span>Settings</span>
      </RouterLink>
    </nav>

    <!-- Right: Register Shift Status, Live Clock, User Profile, Logout -->
    <div class="flex items-center gap-3">
      <!-- Register Status Indicator -->
      <RouterLink
        to="/register"
        class="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs border transition"
        :class="registerStore.hasActiveSession 
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
          : 'bg-amber-950/40 border-amber-500/30 text-amber-300'"
      >
        <span class="w-2 h-2 rounded-full animate-pulse" :class="registerStore.hasActiveSession ? 'bg-emerald-400' : 'bg-amber-400'"></span>
        <span class="font-medium">{{ registerStore.hasActiveSession ? 'Drawer Open' : 'Drawer Closed' }}</span>
      </RouterLink>

      <!-- Digital Clock -->
      <div class="hidden lg:block text-xs font-mono font-medium text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
        {{ currentTime }}
      </div>

      <!-- Role Badge & Username -->
      <div class="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">
        <ShieldCheck v-if="authStore.isBoss" class="w-4 h-4 text-amber-400" />
        <UserCheck v-else class="w-4 h-4 text-cyan-400" />
        <div class="flex flex-col text-left">
          <span class="text-xs font-semibold text-white leading-tight">{{ authStore.user?.name || 'Staff' }}</span>
          <span class="text-[9px] uppercase tracking-wider font-bold" :class="authStore.isBoss ? 'text-amber-400' : 'text-cyan-400'">
            {{ authStore.user?.role || 'User' }}
          </span>
        </div>
      </div>

      <!-- Logout Button -->
      <button
        @click="handleLogout"
        title="Sign Out"
        class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 transition"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
