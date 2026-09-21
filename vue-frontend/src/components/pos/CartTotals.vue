<script setup lang="ts">
import { useCartStore } from '../../stores/cart.store';

const cartStore = useCartStore();
</script>

<template>
  <div class="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col gap-2 select-none text-xs">
    <!-- Subtotal -->
    <div class="flex items-center justify-between text-slate-400">
      <span>Subtotal ({{ cartStore.totalItemsCount }} items)</span>
      <span class="font-mono text-slate-200 font-semibold">${{ cartStore.subtotal.toFixed(2) }}</span>
    </div>

    <!-- Discount -->
    <div v-if="cartStore.discountAmount > 0" class="flex items-center justify-between text-emerald-400">
      <span>Discounts Applied</span>
      <span class="font-mono font-semibold">-${{ cartStore.discountAmount.toFixed(2) }}</span>
    </div>

    <!-- Tax -->
    <div class="flex items-center justify-between text-slate-400">
      <span>Sales Tax (10.0%)</span>
      <span class="font-mono text-slate-200 font-semibold">${{ cartStore.taxAmount.toFixed(2) }}</span>
    </div>

    <div class="h-px bg-slate-800 my-1"></div>

    <!-- Grand Total Due -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-bold text-white uppercase tracking-wider">Total Due</span>
      <span class="text-2xl font-black text-emerald-400 font-mono tracking-tight">
        ${{ cartStore.totalDue.toFixed(2) }}
      </span>
    </div>
  </div>
</template>
