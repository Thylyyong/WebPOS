```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useRegisterStore } from '../../stores/register.store';
import {
  LayoutGrid,
  ShieldCheck,
  UserCheck,
  Search,
  Grid3x3,
  FileText,
  Boxes,
  BarChart3,
  Landmark,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const registerStore = useRegisterStore();

function go(path: string) {
  router.push(path);
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

onMounted(() => {
  if (authStore.activeBranch?.id) {
    registerStore.fetchCurrentSession(authStore.activeBranch.id).catch(() => {});
  }
});
</script>

<template>
  <header class="h-16 shrink-0 px-5 flex items-center justify-between border-b border-slate-200 bg-white">
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
        <LayoutGrid class="w-4.5 h-4.5" />
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-[14.5px] font-extrabold text-slate-900 truncate">
            Gourmet Bistro POS
          </h1>

          <span
            class="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide"
            :class="registerStore.hasActiveSession
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-500'"
          >
            Register: {{ registerStore.hasActiveSession ? 'OPEN' : 'CLOSED' }}
          </span>
        </div>

        <p class="text-[10.5px] text-slate-400 leading-tight">
          Main Store
        </p>
      </div>
    </div>

    <div class="flex-1 max-w-md mx-6 hidden md:block">
      <div class="relative">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="Search menu items..."
          class="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[12.5px] text-slate-700 focus:outline-none focus:border-teal-400"
        />
      </div>
    </div>

    <div
      class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
      :class="authStore.isBoss
        ? 'bg-violet-50 text-violet-600 border-violet-200'
        : 'bg-cyan-50 text-cyan-600 border-cyan-200'"
    >
      <ShieldCheck
        v-if="authStore.isBoss"
        class="w-3.5 h-3.5"
      />

      <UserCheck
        v-else
        class="w-3.5 h-3.5"
      />

      <span>
        {{ authStore.isBoss ? 'Owner (Boss)' : 'Staff Cashier' }}
      </span>
    </div>

    <div class="hidden xl:flex items-center gap-1 pl-2 ml-1 border-l border-slate-200">
      <button
        type="button"
        @click="go('/tables')"
        class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        title="Tables"
      >
        <Grid3x3 class="w-4 h-4" />
      </button>

      <button
        type="button"
        @click="go('/history')"
        class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        title="History"
      >
        <FileText class="w-4 h-4" />
      </button>

      <template v-if="authStore.isBoss">
        <button
          type="button"
          @click="go('/menu/products')"
          class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Menu"
        >
          <Boxes class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="go('/analytics')"
          class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Analytics"
        >
          <BarChart3 class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="go('/accounting')"
          class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="P&L Accounting"
        >
          <Landmark class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="go('/settings')"
          class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Settings"
        >
          <SettingsIcon class="w-4 h-4" />
        </button>
      </template>

      <button
        type="button"
        @click="handleLogout"
        class="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
        title="Logout"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
```

After pasting, save the file. Vite should automatically reload the page.

**The backend is not changed by this.** This only changes the Vue frontend top bar.
