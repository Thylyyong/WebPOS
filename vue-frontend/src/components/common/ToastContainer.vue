<script setup lang="ts">
import { useUiStore } from '../../stores/ui.store';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';

const uiStore = useUiStore();
</script>

<template>
  <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
    <TransitionGroup
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10 text-sm font-medium"
        :class="{
          'bg-emerald-950/90 text-emerald-100 border-emerald-500/30': toast.type === 'success',
          'bg-rose-950/90 text-rose-100 border-rose-500/30': toast.type === 'error',
          'bg-amber-950/90 text-amber-100 border-amber-500/30': toast.type === 'warning',
          'bg-slate-900/95 text-slate-100 border-slate-700': toast.type === 'info'
        }"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
        <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-rose-400 shrink-0" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-400 shrink-0" />
        <Info v-else class="w-5 h-5 text-cyan-400 shrink-0" />

        <div class="flex-1 leading-snug">{{ toast.message }}</div>

        <button
          @click="uiStore.removeToast(toast.id)"
          class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
