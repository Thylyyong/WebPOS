<script setup lang="ts">
import { useCatalogStore } from '../../stores/catalog.store';
import { Coffee, Utensils, Cake, LayoutGrid } from 'lucide-vue-next';

const catalogStore = useCatalogStore();

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('coffee') || n.includes('drink')) return Coffee;
  if (n.includes('food') || n.includes('burger')) return Utensils;
  if (n.includes('bakery') || n.includes('dessert')) return Cake;
  return LayoutGrid;
}
</script>

<template>
  <div class="flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
    <!-- All Items Tab -->
    <button
      type="button"
      @click="catalogStore.selectCategory(null)"
      class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all border shrink-0"
      :class="catalogStore.selectedCategoryId === null
        ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'"
    >
      <LayoutGrid class="w-4 h-4" />
      <span>All Products</span>
      <span
        class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
        :class="catalogStore.selectedCategoryId === null ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'"
      >
        {{ catalogStore.products.length }}
      </span>
    </button>

    <!-- Dynamic Category Tabs -->
    <button
      v-for="cat in catalogStore.categories"
      :key="cat.id"
      type="button"
      @click="catalogStore.selectCategory(cat.id)"
      class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all border shrink-0"
      :class="catalogStore.selectedCategoryId === cat.id
        ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'"
    >
      <component :is="getCategoryIcon(cat.name)" class="w-4 h-4" />
      <span>{{ cat.name }}</span>
      <span
        v-if="cat.products_count !== undefined"
        class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
        :class="catalogStore.selectedCategoryId === cat.id ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'"
      >
        {{ cat.products_count }}
      </span>
    </button>
  </div>
</template>
