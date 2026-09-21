<script setup lang="ts">
import type { Product } from '../../types/pos.types';
import { Plus } from 'lucide-vue-next';

const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits<{
  (e: 'add', product: Product): void;
}>();
</script>

<template>
  <div
    @click="emit('add', product)"
    class="group relative bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.15)] active:scale-95"
  >
    <!-- Card Top Header -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
          {{ product.name }}
        </h4>
        <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
          <span v-if="product.sku" class="font-mono">{{ product.sku }}</span>
          <span v-if="product.sku && product.barcode">•</span>
          <span v-if="product.barcode" class="font-mono text-slate-500">{{ product.barcode }}</span>
        </div>
      </div>

      <!-- Quick Add Button Pill -->
      <div class="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors shrink-0 shadow-sm">
        <Plus class="w-4 h-4" />
      </div>
    </div>

    <!-- Card Bottom Info -->
    <div class="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between">
      <!-- Price -->
      <div class="text-base font-extrabold text-emerald-400 tracking-tight font-mono">
        ${{ product.price.toFixed(2) }}
      </div>

      <!-- Stock Status Badge -->
      <div
        class="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
        :class="{
          'bg-emerald-950/50 text-emerald-300 border-emerald-500/20': product.stock_quantity > 10,
          'bg-amber-950/50 text-amber-300 border-amber-500/20': product.stock_quantity <= 10 && product.stock_quantity > 0,
          'bg-rose-950/50 text-rose-300 border-rose-500/20': product.stock_quantity <= 0
        }"
      >
        <span v-if="product.stock_quantity > 0">Stock: {{ product.stock_quantity }}</span>
        <span v-else>Out of Stock</span>
      </div>
    </div>
  </div>
</template>
