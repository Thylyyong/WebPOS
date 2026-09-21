<script setup lang="ts">
import type { DiningTable } from '../../types/pos.types';
import { Users, UserPlus, ArrowRightLeft, Sparkles, ShoppingBag } from 'lucide-vue-next';

const props = defineProps<{
  table: DiningTable;
}>();

const emit = defineEmits<{
  (e: 'assign', table: DiningTable): void;
  (e: 'transfer', table: DiningTable): void;
  (e: 'release', table: DiningTable): void;
  (e: 'order', table: DiningTable): void;
}>();
</script>

<template>
  <div
    class="relative rounded-2xl p-4 border flex flex-col justify-between transition-all duration-200 select-none shadow-lg"
    :class="{
      'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.08)]': table.status === 'AVAILABLE',
      'bg-slate-900/95 border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.08)]': table.status === 'OCCUPIED',
      'bg-slate-900/95 border-cyan-500/40 hover:border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.08)]': table.status === 'BILLED',
    }"
  >
    <!-- Card Header -->
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h4 class="text-base font-extrabold text-white tracking-tight">{{ table.table_number }}</h4>
          <span
            class="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border"
            :class="{
              'bg-emerald-950/80 text-emerald-300 border-emerald-500/30': table.status === 'AVAILABLE',
              'bg-amber-950/80 text-amber-300 border-amber-500/30': table.status === 'OCCUPIED',
              'bg-cyan-950/80 text-cyan-300 border-cyan-500/30': table.status === 'BILLED',
            }"
          >
            {{ table.status }}
          </span>
        </div>
        <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span>{{ table.zone }}</span>
          <span>•</span>
          <span class="flex items-center gap-1">
            <Users class="w-3 h-3 text-slate-500" />
            <span>{{ table.capacity }} Seats</span>
          </span>
        </div>
      </div>

      <!-- Total Running Bill if Occupied -->
      <div v-if="table.status !== 'AVAILABLE'" class="text-right">
        <span class="text-[10px] text-slate-500 uppercase font-semibold">Current Bill</span>
        <div class="text-base font-black text-white font-mono leading-tight">
          ${{ (table.order_total || 0).toFixed(2) }}
        </div>
      </div>
    </div>

    <!-- Center Party Details if Occupied -->
    <div class="my-3 min-h-[32px] flex items-center">
      <div v-if="table.customer_name" class="text-xs font-semibold text-slate-200 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800 w-full truncate">
        Guest: {{ table.customer_name }}
      </div>
      <div v-else class="text-xs text-slate-500 italic">
        Ready for guests
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
      <!-- When Available: Open / Assign -->
      <template v-if="table.status === 'AVAILABLE'">
        <button
          type="button"
          @click="emit('assign', table)"
          class="flex-1 h-9 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>Open Table</span>
        </button>

        <button
          type="button"
          @click="emit('order', table)"
          class="h-9 px-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1 transition"
          title="Direct Order to this table"
        >
          <ShoppingBag class="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </template>

      <!-- When Occupied / Billed -->
      <template v-else>
        <button
          type="button"
          @click="emit('order', table)"
          class="flex-1 h-9 rounded-xl text-xs font-bold text-white glow-btn-primary flex items-center justify-center gap-1.5 transition shadow"
        >
          <ShoppingBag class="w-3.5 h-3.5" />
          <span>Add Items / Pay</span>
        </button>

        <button
          type="button"
          @click="emit('transfer', table)"
          class="h-9 px-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition"
          title="Transfer Party to Another Table"
        >
          <ArrowRightLeft class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="emit('release', table)"
          class="h-9 px-2.5 rounded-xl text-xs font-bold text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 flex items-center justify-center transition"
          title="Release / Mark Table Clean & Available"
        >
          <Sparkles class="w-3.5 h-3.5" />
        </button>
      </template>
    </div>
  </div>
</template>
