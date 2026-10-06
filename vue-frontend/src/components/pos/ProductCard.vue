<script setup lang="ts">
import { computed } from 'vue';
import type { Product } from '../../types/pos.types';
import { useCatalogStore } from '../../stores/catalog.store';
import { productTracksStock } from '../../utils/stock';
import { Plus, ImageIcon } from 'lucide-vue-next';

const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits<{
  (e: 'add', product: Product): void;
}>();

const catalogStore = useCatalogStore();
// Coffee & Drink products have no stock amount, so no low/out-of-stock badge.
const showStock = computed(() => productTracksStock(props.product, catalogStore.categories));

const imageUrl = computed(() => {
  const p = props.product;
  if (p.image_url) return p.image_url;
  if (!p.image_path) return null;
  if (
    p.image_path.startsWith('http://') ||
    p.image_path.startsWith('https://') ||
    p.image_path.startsWith('data:')
  ) {
    return p.image_path;
  }
  return p.image_path.startsWith('/') ? p.image_path : `/${p.image_path}`;
});
</script>

<template>
  <div
    @click="emit('add', product)"
    class="group relative bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-3 flex flex-col cursor-pointer select-none transition-all duration-200 hover:shadow-md active:scale-95"
  >
    <!-- Image placeholder or uploaded product image -->
    <div class="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 overflow-hidden">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="($event.target as HTMLElement).style.display = 'none'"
      />
      <ImageIcon v-else class="w-7 h-7 text-slate-300" />
    </div>

    <h4 class="text-[13px] font-bold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug min-h-[2.4em]">
      {{ product.name }}
    </h4>

    <!-- Card Bottom Info -->
    <div class="mt-2 flex items-center justify-between">
      <div class="text-[15px] font-extrabold text-teal-600 tracking-tight">
        ${{ product.price.toFixed(2) }}
      </div>

      <div class="w-8 h-8 rounded-full bg-teal-600 group-hover:bg-teal-700 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm">
        <Plus class="w-4 h-4" />
      </div>
    </div>

    <div
      v-if="showStock && product.stock_quantity <= 10"
      class="absolute top-2 right-2 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md"
      :class="product.stock_quantity > 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-rose-50 text-rose-600 border border-rose-200'"
    >
      <span v-if="product.stock_quantity > 0">Low: {{ product.stock_quantity }}</span>
      <span v-else>Out of Stock</span>
    </div>
  </div>
</template>
