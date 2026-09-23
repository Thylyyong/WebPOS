<script setup lang="ts">
import { Delete, Check } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  modelValue: string;
  maxLength?: number;
  showSubmit?: boolean;
  submitLabel?: string;
  masked?: boolean;
  disabled?: boolean;
  light?: boolean;
}>(), {
  maxLength: 4,
  showSubmit: true,
  submitLabel: 'SUBMIT',
  masked: true,
  disabled: false,
  light: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit', value: string): void;
}>();

function appendDigit(digit: number) {
  if (props.disabled) return;
  if (props.modelValue.length < props.maxLength) {
    const next = props.modelValue + digit;
    emit('update:modelValue', next);
    if (next.length === props.maxLength && !props.showSubmit) {
      emit('submit', next);
    }
  }
}

function clear() {
  if (props.disabled) return;
  emit('update:modelValue', '');
}

function backspace() {
  if (props.disabled) return;
  emit('update:modelValue', props.modelValue.slice(0, -1));
}

function handleSubmit() {
  if (props.disabled) return;
  if (props.modelValue.length > 0) {
    emit('submit', props.modelValue);
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-4 w-full max-w-xs select-none">
    <!-- Pin Display Dots / Mask -->
    <div
      class="flex items-center justify-center gap-3 py-3 w-full rounded-xl border"
      :class="light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'"
    >
      <div
        v-for="i in maxLength"
        :key="i"
        class="w-4 h-4 rounded-full transition-all duration-200"
        :class="{
          'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-110': (modelValue.length >= i),
          'border-2 border-slate-700 bg-slate-900': (modelValue.length < i) && !light,
          'border-2 border-slate-300 bg-white': (modelValue.length < i) && light
        }"
      />
    </div>

    <!-- Keypad Grid -->
    <div class="grid grid-cols-3 gap-2.5 w-full">
      <button
        v-for="n in 9"
        :key="n"
        type="button"
        @click="appendDigit(n)"
        :disabled="disabled"
        class="h-14 rounded-xl text-xl font-bold active:scale-95 transition flex items-center justify-center shadow-md disabled:opacity-50"
        :class="light
          ? 'text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-teal-50 border border-slate-200'
          : 'text-white bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600/30 border border-slate-700/60'"
      >
        {{ n }}
      </button>

      <!-- Clear Button -->
      <button
        type="button"
        @click="clear"
        :disabled="disabled"
        class="h-14 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition flex items-center justify-center disabled:opacity-50"
        :class="light
          ? 'text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200'
          : 'text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40'"
      >
        CLEAR
      </button>

      <!-- 0 Button -->
      <button
        type="button"
        @click="appendDigit(0)"
        :disabled="disabled"
        class="h-14 rounded-xl text-xl font-bold active:scale-95 transition flex items-center justify-center shadow-md disabled:opacity-50"
        :class="light
          ? 'text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-teal-50 border border-slate-200'
          : 'text-white bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600/30 border border-slate-700/60'"
      >
        0
      </button>

      <!-- Backspace Button -->
      <button
        type="button"
        @click="backspace"
        :disabled="disabled"
        class="h-14 rounded-xl active:scale-95 transition flex items-center justify-center disabled:opacity-50"
        :class="light
          ? 'text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200'
          : 'text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60'"
      >
        <Delete class="w-5 h-5" />
      </button>
    </div>

    <!-- Submit Button (Optional) -->
    <button
      v-if="showSubmit"
      type="button"
      @click="handleSubmit"
      :disabled="disabled || modelValue.length < 4"
      class="w-full h-12 rounded-xl text-sm font-bold tracking-wider text-white glow-btn-primary flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
    >
      <Check class="w-4 h-4" />
      <span>{{ submitLabel }}</span>
    </button>
  </div>
</template>
