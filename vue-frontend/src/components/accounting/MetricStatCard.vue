<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  title: string;
  value: string;
  subValue?: string;
  isPositive?: boolean;
  icon?: Component;
  accentColor?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo';
}>();
</script>

<template>
  <div
    class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between select-none shadow-md transition hover:-translate-y-0.5"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-400">{{ title }}</span>
      <div
        v-if="icon"
        class="w-8 h-8 rounded-xl flex items-center justify-center text-xs"
        :class="{
          'bg-emerald-500/10 text-emerald-400': accentColor === 'emerald' || !accentColor,
          'bg-amber-500/10 text-amber-400': accentColor === 'amber',
          'bg-rose-500/10 text-rose-400': accentColor === 'rose',
          'bg-cyan-500/10 text-cyan-400': accentColor === 'cyan',
          'bg-indigo-500/10 text-indigo-400': accentColor === 'indigo',
        }"
      >
        <component :is="icon" class="w-4 h-4" />
      </div>
    </div>

    <div class="mt-3">
      <div class="text-2xl font-black text-white font-mono tracking-tight">{{ value }}</div>
      <div
        v-if="subValue"
        class="text-xs font-semibold mt-0.5"
        :class="isPositive !== undefined 
          ? (isPositive ? 'text-emerald-400' : 'text-rose-400') 
          : 'text-slate-400'"
      >
        {{ subValue }}
      </div>
    </div>
  </div>
</template>
