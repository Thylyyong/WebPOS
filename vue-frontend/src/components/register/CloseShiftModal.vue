<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRegisterStore } from '../../stores/register.store';
import { useUiStore } from '../../stores/ui.store';
import { ordersApi } from '../../api/orders.api';
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

// Cashier enters only what they physically counted; the expected amount is system-calculated.
const countedCash = ref<number | null>(null);
const closingNotes = ref<string>('');
const isSubmitting = ref(false);
const isRefreshing = ref(false);
// Held (parked) orders are unpaid: they are not sales and stay open after closing.
const heldCount = ref(0);
const heldTotal = ref(0);

// Re-sync the session each time the modal opens so Expected includes every
// order, payment and cash movement up to this moment.
watch(
  () => props.show,
  async (visible) => {
    if (!visible) return;
    countedCash.value = null;
    heldCount.value = 0;
    heldTotal.value = 0;
    const branchId = registerStore.activeSession?.branch_id;
    if (!branchId) return;
    isRefreshing.value = true;
    try {
      await registerStore.fetchCurrentSession(branchId);
    } catch {
      /* keep last known session data */
    }
    try {
      const res = await ordersApi.getParkedOrders(branchId);
      const held = res.data.success ? res.data.orders || [] : [];
      heldCount.value = held.length;
      heldTotal.value = held.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    } catch {
      /* notice is informational only */
    } finally {
      isRefreshing.value = false;
    }
  },
  { immediate: true }
);

const hasCounted = computed(() => typeof countedCash.value === 'number' && !Number.isNaN(countedCash.value));

const expectedCash = computed(() => {
  return registerStore.activeSession?.expected_cash || 0;
});

const cashDifference = computed(() => {
  if (!hasCounted.value) return 0;
  return Math.round(((countedCash.value as number) - expectedCash.value) * 100) / 100;
});

async function handleCloseShift() {
  if (!registerStore.activeSession?.id || !hasCounted.value) return;
  isSubmitting.value = true;
  try {
    const sessionId = registerStore.activeSession.id;
    await registerStore.closeRegister({
      session_id: sessionId,
      closing_cash_counted: countedCash.value as number,
      closing_notes: closingNotes.value || undefined
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
          <span>Expected Cash (auto-calculated):</span>
          <span class="text-lg font-black font-mono text-cyan-400">
            ${{ expectedCash.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Held orders notice (not counted as sales) -->
      <div
        v-if="heldCount > 0"
        class="p-3 rounded-xl border bg-amber-950/30 border-amber-500/30 text-amber-300 text-xs flex items-start gap-2"
      >
        <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          {{ heldCount }} held order{{ heldCount > 1 ? 's' : '' }} (${{ heldTotal.toFixed(2) }}) {{ heldCount > 1 ? 'are' : 'is' }} unpaid
          and not counted in sales or expected cash. {{ heldCount > 1 ? 'They stay' : 'It stays' }} on hold after closing.
        </span>
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
            min="0"
            placeholder="0.00"
            class="w-full h-12 pl-8 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <!-- Reconciliation: Expected → Actual → Difference -->
      <div
        class="p-3.5 rounded-xl border flex flex-col gap-2.5"
        :class="{
          'bg-slate-900 border-slate-800 text-slate-300': !hasCounted,
          'bg-emerald-950/40 border-emerald-500/30 text-emerald-300': hasCounted && cashDifference === 0,
          'bg-rose-950/40 border-rose-500/30 text-rose-300': hasCounted && cashDifference < 0,
          'bg-amber-950/40 border-amber-500/30 text-amber-300': hasCounted && cashDifference > 0
        }"
      >
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="flex flex-col gap-0.5">
            <span class="text-[10px] uppercase tracking-wide text-slate-400">Expected</span>
            <span class="text-sm font-black font-mono text-cyan-400">${{ expectedCash.toFixed(2) }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[10px] uppercase tracking-wide text-slate-400">Actual</span>
            <span class="text-sm font-black font-mono text-white">
              {{ hasCounted ? '$' + (countedCash as number).toFixed(2) : '—' }}
            </span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[10px] uppercase tracking-wide text-slate-400">Difference</span>
            <span class="text-sm font-black font-mono">
              {{ hasCounted ? (cashDifference >= 0 ? '+' : '-') + '$' + Math.abs(cashDifference).toFixed(2) : '—' }}
            </span>
          </div>
        </div>
        <div v-if="hasCounted" class="flex items-center gap-2 pt-2 border-t border-white/10">
          <CheckCircle2 v-if="cashDifference === 0" class="w-5 h-5 text-emerald-400" />
          <AlertTriangle v-else class="w-5 h-5" :class="cashDifference < 0 ? 'text-rose-400' : 'text-amber-400'" />
          <span class="text-xs font-bold">
            {{ cashDifference === 0 ? 'Drawer Balanced Perfectly' : (cashDifference > 0 ? 'Cash Over' : 'Cash Short') }}
          </span>
        </div>
        <div v-else class="text-xs text-slate-400 pt-2 border-t border-white/10">
          Count the drawer and enter the actual cash to see the difference.
        </div>
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
        :disabled="isSubmitting || isRefreshing || !hasCounted"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Landmark class="w-4 h-4" />
        <span>Close Register & Lock</span>
      </button>
    </template>
  </AppModal>
</template>
