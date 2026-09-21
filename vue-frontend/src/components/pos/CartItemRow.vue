<script setup lang="ts">
import { ref } from 'vue';
import type { CartItem } from '../../types/pos.types';
import { Minus, Plus, Trash2, Tag } from 'lucide-vue-next';

const props = defineProps<{
  item: CartItem;
  index: number;
}>();

const emit = defineEmits<{
  (e: 'update-qty', index: number, qty: number): void;
  (e: 'update-discount', index: number, discount: number): void;
  (e: 'remove', index: number): void;
}>();

const showDiscountInput = ref(false);
const customDiscount = ref(props.item.discount_percent);

function applyDiscount() {
  emit('update-discount', props.index, customDiscount.value);
  showDiscountInput.value = false;
}
</script>

<template>
  <div class="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 transition select-none">
    <!-- Item Header -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h5 class="text-sm font-bold text-white truncate leading-snug">{{ item.product.name }}</h5>
        <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          <span>${{ item.unit_price.toFixed(2) }} / ea</span>
          <span v-if="item.discount_percent > 0" class="text-emerald-400 font-medium">
            (-{{ item.discount_percent }}% off)
          </span>
        </div>
      </div>

      <!-- Line Total -->
      <div class="text-sm font-extrabold text-white font-mono shrink-0">
        ${{ item.total_price.toFixed(2) }}
      </div>
    </div>

    <!-- Stepper & Actions -->
    <div class="flex items-center justify-between gap-2 mt-1">
      <!-- Discount Trigger Button -->
      <div class="relative">
        <button
          type="button"
          @click="showDiscountInput = !showDiscountInput"
          class="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border"
          :class="item.discount_percent > 0 
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
            : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'"
        >
          <Tag class="w-3 h-3" />
          <span>{{ item.discount_percent > 0 ? `${item.discount_percent}%` : 'Discount' }}</span>
        </button>

        <!-- Inline Discount Popover -->
        <div
          v-if="showDiscountInput"
          class="absolute left-0 bottom-full mb-1 z-30 bg-slate-950 border border-slate-700 rounded-xl p-2.5 shadow-2xl flex items-center gap-2"
        >
          <input
            v-model.number="customDiscount"
            type="number"
            min="0"
            max="100"
            class="w-16 h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-emerald-500"
          />
          <span class="text-xs text-slate-400">%</span>
          <button
            type="button"
            @click="applyDiscount"
            class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Quantity Stepper & Remove -->
      <div class="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          @click="emit('update-qty', index, item.quantity - 1)"
          class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition"
        >
          <Minus class="w-3.5 h-3.5" />
        </button>

        <span class="w-7 text-center font-bold text-sm text-white font-mono">
          {{ item.quantity }}
        </span>

        <button
          type="button"
          @click="emit('update-qty', index, item.quantity + 1)"
          class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="emit('remove', index)"
          class="w-7 h-7 ml-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 text-rose-400 flex items-center justify-center transition"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
