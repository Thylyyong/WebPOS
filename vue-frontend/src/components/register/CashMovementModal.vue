<script setup lang="ts">
import { ref } from 'vue';
import { useRegisterStore } from '../../stores/register.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'recorded'): void;
}>();

const registerStore = useRegisterStore();
const uiStore = useUiStore();

const movementType = ref<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
const amount = ref<number>(50.00);
const reason = ref<string>('Change fund replenishment');
const supervisorPin = ref<string>('9999');
const isSubmitting = ref(false);

async function handleRecord() {
  if (!registerStore.activeSession?.id || amount.value <= 0 || !supervisorPin.value) return;
  isSubmitting.value = true;
  try {
    await registerStore.recordCashMovement({
      session_id: registerStore.activeSession.id,
      type: movementType.value,
      amount: amount.value,
      reason: reason.value.trim() || 'Store cash adjustment',
      supervisor_pin: supervisorPin.value
    });
    uiStore.showToast(`Recorded ${movementType.value === 'CASH_IN' ? 'Cash In' : 'Cash Out'} of $${amount.value.toFixed(2)}`, 'success');
    emit('recorded');
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Cash movement failed', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Petty Cash Movement"
    max-width="md"
  >
    <div class="flex flex-col gap-4 select-none">
      <!-- Movement Type Selector -->
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          @click="movementType = 'CASH_IN'; reason = 'Change fund replenishment'"
          class="h-12 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition"
          :class="movementType === 'CASH_IN'
            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
        >
          <ArrowDownLeft class="w-4 h-4 text-emerald-400" />
          <span>Cash In (Float Deposit)</span>
        </button>

        <button
          type="button"
          @click="movementType = 'CASH_OUT'; reason = 'Petty store supplies'"
          class="h-12 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition"
          :class="movementType === 'CASH_OUT'
            ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-md'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
        >
          <ArrowUpRight class="w-4 h-4 text-rose-400" />
          <span>Cash Out (Payout)</span>
        </button>
      </div>

      <!-- Amount Input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Amount ($)</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
          <input
            v-model.number="amount"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full h-11 pl-8 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <!-- Reason Input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Reason / Description</label>
        <input
          v-model="reason"
          type="text"
          placeholder="e.g. Change fund replenishment, emergency milk restock"
          class="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <!-- Supervisor Authorization PIN -->
      <div class="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
        <div class="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <ShieldCheck class="w-4 h-4 text-amber-400" />
          <span>Supervisor PIN Authorization</span>
        </div>
        <p class="text-[11px] text-slate-400">Enter Boss/Manager 4-digit PIN (default 9999):</p>
        <input
          v-model="supervisorPin"
          type="password"
          maxlength="4"
          placeholder="••••"
          class="w-full h-10 px-3.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:border-amber-500"
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
        @click="handleRecord"
        :disabled="isSubmitting || amount <= 0 || !supervisorPin"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary disabled:opacity-40"
      >
        <span>Confirm Movement</span>
      </button>
    </template>
  </AppModal>
</template>
