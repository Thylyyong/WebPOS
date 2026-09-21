<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRegisterStore } from '../../stores/register.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { Landmark, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'closed', sessionId: string): void;
}>();

const registerStore = useRegisterStore();
const uiStore = useUiStore();

const countedCash = ref<number>(registerStore.activeSession?.expected_cash || 0);
const closingNotes = ref<string>('Drawer balanced cleanly');
const isSubmitting = ref(false);

const expectedCash = computed(() => {
  return registerStore.activeSession?.expected_cash || 0;
});

const cashDifference = computed(() => {
  return Math.round((countedCash.value - expectedCash.value) * 100) / 100;
});

async function handleCloseShift() {
  if (!registerStore.activeSession?.id) return;
  isSubmitting.value = true;
  try {
    const sessionId = registerStore.activeSession.id;
    await registerStore.closeRegister({
      session_id: sessionId,
      closing_cash_counted: countedCash.value,
      closing_notes: closingNotes.value
    });
    uiStore.showToast('Shift closed and drawer reconciled', 'success');
    emit('closed', sessionId);
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to close shift register', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Close Register & Reconcile Shift"
    max-width="md"
  >
    <div class="flex flex-col gap-4 select-none">
      <!-- Session Overview -->
      <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Active Cashier:</span>
          <span class="font-bold text-white">{{ registerStore.activeSession?.cashier_name || 'Staff' }}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Opening Float:</span>
          <span class="font-mono text-slate-200">${{ (registerStore.activeSession?.opening_cash || 0).toFixed(2) }}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Cash Sales Total:</span>
          <span class="font-mono text-emerald-400 font-bold">+${{ (registerStore.activeSession?.cash_sales || 0).toFixed(2) }}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Cash Movements (In / Out):</span>
          <span class="font-mono text-slate-300">
            +${{ (registerStore.activeSession?.cash_in || 0).toFixed(2) }} / -${{ (registerStore.activeSession?.cash_out || 0).toFixed(2) }}
          </span>
        </div>
        <div class="h-px bg-slate-800 my-1"></div>
        <div class="flex items-center justify-between text-sm font-bold text-white">
          <span>System Expected Cash:</span>
          <span class="text-lg font-black font-mono text-cyan-400">
            ${{ expectedCash.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Counted Cash Input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Actual Physical Cash Counted in Drawer ($)</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
          <input
            v-model.number="countedCash"
            type="number"
            step="0.01"
            class="w-full h-12 pl-8 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <!-- Variance Indicator -->
      <div
        class="p-3.5 rounded-xl border flex items-center justify-between"
        :class="{
          'bg-emerald-950/40 border-emerald-500/30 text-emerald-300': cashDifference === 0,
          'bg-rose-950/40 border-rose-500/30 text-rose-300': cashDifference < 0,
          'bg-amber-950/40 border-amber-500/30 text-amber-300': cashDifference > 0
        }"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="cashDifference === 0" class="w-5 h-5 text-emerald-400" />
          <AlertTriangle v-else class="w-5 h-5" :class="cashDifference < 0 ? 'text-rose-400' : 'text-amber-400'" />
          <span class="text-xs font-bold">
            {{ cashDifference === 0 ? 'Drawer Balanced Perfectly' : (cashDifference > 0 ? 'Cash Over' : 'Cash Short') }}
          </span>
        </div>
        <span class="text-base font-black font-mono">
          {{ cashDifference >= 0 ? '+' : '' }}${{ cashDifference.toFixed(2) }}
        </span>
      </div>

      <!-- Notes -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Closing Notes</label>
        <input
          v-model="closingNotes"
          type="text"
          class="w-full h-10 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        :disabled="isSubmitting"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
      >
        Cancel
      </button>

      <button
        type="button"
        @click="handleCloseShift"
        :disabled="isSubmitting"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow flex items-center gap-2"
      >
        <Landmark class="w-4 h-4" />
        <span>Close Register & Lock</span>
      </button>
    </template>
  </AppModal>
</template>
