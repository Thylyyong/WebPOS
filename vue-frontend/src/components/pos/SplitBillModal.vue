<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCartStore } from '../../stores/cart.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { Users, Check } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const cartStore = useCartStore();
const uiStore = useUiStore();

const splitWays = ref(2);

const splitAmount = computed(() => {
  if (splitWays.value <= 0) return 0;
  return Math.round((cartStore.totalDue / splitWays.value) * 100) / 100;
});

function confirmSplit() {
  uiStore.showToast(`Bill configured for ${splitWays.value} guests at $${splitAmount.value.toFixed(2)} each.`, 'info');
  emit('close');
}
</script>

<template>
  <AppModal
    :show="show"
    light
    @close="emit('close')"
    title="Split Bill Between Guests"
    max-width="md"
  >
    <div class="flex flex-col gap-4 select-none">
      <div class="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-center">
        <span class="text-xs text-teal-600/80 uppercase font-bold">Total Order Value</span>
        <div class="text-3xl font-black text-teal-700 font-mono mt-1">
          ${{ cartStore.totalDue.toFixed(2) }}
        </div>
      </div>

      <!-- Split selector -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-slate-500">Number of Ways to Split</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="n in [2, 3, 4, 5]"
            :key="n"
            type="button"
            @click="splitWays = n"
            class="h-12 rounded-xl font-bold text-sm border flex items-center justify-center gap-1.5 transition"
            :class="splitWays === n
              ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'"
          >
            <Users class="w-3.5 h-3.5" />
            <span>{{ n }} Ways</span>
          </button>
        </div>
      </div>

      <!-- Calculated breakdown -->
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500">Each Guest Pays:</span>
          <span class="text-xl font-bold text-teal-600 font-mono">${{ splitAmount.toFixed(2) }}</span>
        </div>
        <div class="text-[11px] text-slate-400">
          Guests can pay individually using separate payment tenders (Cash, Card, or QR).
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition"
      >
        Cancel
      </button>

      <button
        type="button"
        @click="confirmSplit"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2"
      >
        <Check class="w-4 h-4" />
        <span>Confirm Split Plan</span>
      </button>
    </template>
  </AppModal>
</template>
