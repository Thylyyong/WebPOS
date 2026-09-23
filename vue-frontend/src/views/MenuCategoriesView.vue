<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import { catalogApi } from '../api/catalog.api';
import { useUiStore } from '../stores/ui.store';
import type { Category } from '../types/pos.types';
import { Plus, FileText, Trash2, ChevronUp, ChevronDown, RefreshCw, Info } from 'lucide-vue-next';

const uiStore = useUiStore();
const categories = ref<Category[]>([]);
const isLoading = ref(false);
const expanded = ref<Record<string, boolean>>({});

async function load() {
  isLoading.value = true;
  try {
    const res = await catalogApi.getCategories();
    if (res.data.success) {
      categories.value = res.data.categories;
      for (const c of categories.value) {
        if (!(c.id in expanded.value)) expanded.value[c.id] = true;
      }
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to load categories', 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id];
}

// The backend only exposes GET /catalog/categories (read-only). There is no
// route to create, edit, or delete a category/subcategory, so these actions
// are intentionally disabled rather than faked — see the notice banner below.
function notSupported() {
  uiStore.showToast('Category management needs a backend endpoint that does not exist yet (only GET /catalog/categories is available).', 'warning');
}

function letterFor(name: string) {
  return name.trim().charAt(0).toUpperCase() || '•';
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Menu &amp; Categories</template>
    <template #subtitle>Organize catalog menu categories and subcategories</template>
    <template #actions>
      <div class="relative w-56 hidden sm:block">
        <input
          type="text"
          placeholder="Search categories..."
          class="w-full pl-3 pr-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>
      <button @click="load" class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh">
        <RefreshCw class="w-3.5 h-3.5" :class="isLoading && 'animate-spin'" />
      </button>
      <button
        @click="notSupported"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-teal-600 text-white hover:bg-teal-700"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Category
      </button>
    </template>

    <div class="flex items-start gap-2 mb-4 px-3.5 py-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11.5px] text-sky-700">
      <Info class="w-4 h-4 mt-0.5 shrink-0" />
      <span>
        Categories below are live from the catalog API. Add / edit / delete are disabled because the backend
        currently only exposes <code class="font-mono">GET /catalog/categories</code> — there's no create,
        rename, or delete route to wire these buttons to.
      </span>
    </div>

    <div class="space-y-3">
      <div v-for="cat in categories" :key="cat.id" class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
            :style="{ background: (cat.color_hex || '#0d9488') + '1a', color: cat.color_hex || '#0d9488' }"
          >
            {{ letterFor(cat.name) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[13.5px] font-bold text-slate-800 truncate">{{ cat.name }}</div>
            <div class="text-[11px] text-slate-400">
              {{ (cat.subcategories || []).length }} subcategories · {{ cat.products_count ?? 0 }} items
            </div>
          </div>
          <button
            @click="notSupported"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <Plus class="w-3.5 h-3.5" />
            Add Subcategory
          </button>
          <button @click="notSupported" class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50" title="Rename (unsupported)">
            <FileText class="w-3.5 h-3.5" />
          </button>
          <button @click="notSupported" class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="Delete (unsupported)">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
          <button @click="toggle(cat.id)" class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
            <ChevronUp v-if="expanded[cat.id]" class="w-3.5 h-3.5" />
            <ChevronDown v-else class="w-3.5 h-3.5" />
          </button>
        </div>

        <div v-if="expanded[cat.id]" class="flex flex-wrap gap-2 mt-3.5 pt-3.5 border-t border-slate-100">
          <span
            v-for="sub in cat.subcategories"
            :key="sub.id"
            class="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[12px] font-medium text-slate-600"
          >
            {{ sub.name }}
            <button @click="notSupported" class="text-slate-300 hover:text-rose-500" title="Remove (unsupported)">×</button>
          </span>
          <span v-if="!(cat.subcategories || []).length" class="text-[11.5px] text-slate-400 py-1.5">No subcategories yet.</span>
          <button
            @click="notSupported"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-[12px] font-medium text-slate-400 hover:border-teal-400 hover:text-teal-600"
          >
            <Plus class="w-3 h-3" /> Add Subcategory
          </button>
        </div>
      </div>

      <div v-if="!categories.length && !isLoading" class="text-center py-12 text-slate-400 text-sm">
        No categories returned by the catalog API.
      </div>
    </div>
  </AppSidebarShell>
</template>
