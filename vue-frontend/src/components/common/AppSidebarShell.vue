<script setup lang="ts">
/**
 * Light "OMNI POS Enterprise" back-office shell.
 *
 * The original POS Terminal / Tables / Register screens use the dark
 * "Obsidian Luxury" AppHeader shell and are left untouched. This shell
 * powers the newer back-office style screens shown in the reference
 * screenshots (Menu & Categories, Products, History, Analytics,
 * Settings) which follow a light, left-sidebar layout instead.
 */
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutGrid,
  Monitor,
  Grid3x3,
  ChevronDown,
  ChevronRight,
  Boxes,
  Tag,
  FileText,
  BarChart3,
  Landmark,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCheck
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuOpen = ref(route.path.startsWith('/menu'));

function isActive(path: string) {
  return route.path === path;
}
function isActivePrefix(prefix: string) {
  return route.path.startsWith(prefix);
}

function go(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="h-screen w-screen flex bg-[#F5F7FA] text-slate-800 overflow-hidden select-none">
    <!-- Left Sidebar -->
    <aside class="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <!-- Brand -->
      <div class="h-16 flex items-center gap-2 px-5 border-b border-slate-100">
        <div class="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
          <LayoutGrid class="w-4 h-4" />
        </div>
        <div class="leading-tight">
          <div class="text-[13px] font-extrabold text-teal-700 tracking-tight">OMNI POS</div>
          <div class="text-[9px] font-semibold text-slate-400 tracking-wide">Enterprise</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        <button
          type="button"
          @click="go('/register')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
          :class="isActive('/register') || isActive('/pos') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <Monitor class="w-4 h-4" />
          <span>Register</span>
        </button>

        <button
          type="button"
          @click="go('/tables')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
          :class="isActive('/tables') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <Grid3x3 class="w-4 h-4" />
          <span>Tables</span>
        </button>

        <!-- Menu (expandable) -->
        <div>
          <button
            type="button"
            @click="menuOpen = !menuOpen"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
            :class="isActivePrefix('/menu') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
          >
            <Boxes class="w-4 h-4" />
            <span class="flex-1 text-left">Menu</span>
            <ChevronDown v-if="menuOpen" class="w-3.5 h-3.5" />
            <ChevronRight v-else class="w-3.5 h-3.5" />
          </button>
          <div v-if="menuOpen" class="ml-4 pl-3 border-l border-slate-100 mt-0.5 space-y-0.5">
            <button
              type="button"
              @click="go('/menu/products')"
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition"
              :class="isActive('/menu/products') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
            >
              <Tag class="w-3.5 h-3.5" />
              <span>Products</span>
            </button>
            <button
              type="button"
              @click="go('/menu/categories')"
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition"
              :class="isActive('/menu/categories') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
            >
              <Boxes class="w-3.5 h-3.5" />
              <span>Category</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          @click="go('/history')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
          :class="isActive('/history') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <FileText class="w-4 h-4" />
          <span>History</span>
        </button>

        <button
          v-if="authStore.isBoss"
          type="button"
          @click="go('/accounting')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
          :class="isActive('/accounting') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <Landmark class="w-4 h-4" />
          <span>P&amp;L Acct</span>
        </button>

        <button
          v-if="authStore.isBoss"
          type="button"
          @click="go('/analytics')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
          :class="isActive('/analytics') ? 'bg-teal-600 text-white font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <BarChart3 class="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </nav>

      <!-- Settings (bottom) -->
      <div class="p-2.5 border-t border-slate-100">
        <button
          v-if="authStore.isBoss"
          type="button"
          @click="go('/settings')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition"
          :class="isActive('/settings') ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <SettingsIcon class="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>

    <!-- Main column -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header class="h-16 shrink-0 px-6 flex items-center justify-between border-b border-slate-200 bg-white">
        <div class="min-w-0">
          <h1 class="text-base font-bold text-slate-900 leading-tight truncate">
            <slot name="title">Dashboard</slot>
          </h1>
          <p class="text-[11.5px] text-slate-400 leading-tight truncate">
            <slot name="subtitle"></slot>
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <slot name="actions"></slot>

          <div
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
            :class="authStore.isBoss
              ? 'bg-violet-50 text-violet-600 border-violet-200'
              : 'bg-cyan-50 text-cyan-600 border-cyan-200'"
          >
            <ShieldCheck v-if="authStore.isBoss" class="w-3.5 h-3.5" />
            <UserCheck v-else class="w-3.5 h-3.5" />
            <span>{{ authStore.isBoss ? 'Owner (Boss)' : 'Staff Cashier' }}</span>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
