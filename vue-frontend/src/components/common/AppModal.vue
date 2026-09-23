<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  show: boolean;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  light?: boolean;
}>(), {
  maxWidth: 'md',
  light: false
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.show) {
    emit('close');
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        @click.self="emit('close')"
      >
        <div
          class="border rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          :class="[
            light ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700/80',
            {
              'max-w-sm': maxWidth === 'sm',
              'max-w-md': maxWidth === 'md',
              'max-w-lg': maxWidth === 'lg',
              'max-w-xl': maxWidth === 'xl',
              'max-w-2xl': maxWidth === '2xl',
              'max-w-3xl': maxWidth === '3xl',
            }
          ]"
        >
          <!-- Modal Header -->
          <div
            v-if="title || $slots.header"
            class="px-5 py-4 border-b flex items-center justify-between"
            :class="light ? 'border-slate-100 bg-white' : 'border-slate-800 bg-slate-900/60'"
          >
            <slot name="header">
              <h3 class="text-lg font-bold tracking-wide" :class="light ? 'text-slate-800' : 'text-white'">{{ title }}</h3>
            </slot>
            <button
              @click="emit('close')"
              class="w-8 h-8 rounded-lg flex items-center justify-center transition"
              :class="light ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-5 overflow-y-auto flex-1">
            <slot />
          </div>

          <!-- Modal Footer -->
          <div
            v-if="$slots.footer"
            class="px-5 py-4 border-t flex items-center justify-end gap-3"
            :class="light ? 'border-slate-100 bg-white' : 'border-slate-800 bg-slate-900/40'"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
