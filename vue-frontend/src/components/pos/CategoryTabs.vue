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
        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'"
    >
      <LayoutGrid class="w-4 h-4" />
      <span>All</span>
      <span
        class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
        :class="catalogStore.selectedCategoryId === null ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'"
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
        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'"
    >
      <component :is="getCategoryIcon(cat.name)" class="w-4 h-4" />
      <span>{{ cat.name }}</span>
      <span
        v-if="cat.products_count !== undefined"
        class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
        :class="catalogStore.selectedCategoryId === cat.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'"
      >
        {{ cat.products_count }}
      </span>
    </button>
  </div>
</template>
