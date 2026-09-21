<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTablesStore } from '../../stores/tables.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import type { DiningTable } from '../../types/pos.types';
import { ArrowRightLeft } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
  sourceTable: DiningTable | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'transferred'): void;
}>();

const tablesStore = useTablesStore();
const uiStore = useUiStore();

const selectedTargetId = ref<string>('');
const isSubmitting = ref(false);

const availableTargetTables = computed(() => {
  return tablesStore.tables.filter(
    t => t.id !== props.sourceTable?.id && t.status === 'AVAILABLE'
  );
});

async function handleTransfer() {
  if (!props.sourceTable || !selectedTargetId.value) return;
  isSubmitting.value = true;
  try {
    await tablesStore.transferTable(props.sourceTable.id, selectedTargetId.value);
    uiStore.showToast(`Party moved to new table successfully`, 'success');
    selectedTargetId.value = '';
    emit('transferred');
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to transfer table', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Transfer Table Party"
    max-width="md"
  >
    <div v-if="sourceTable" class="flex flex-col gap-4 select-none">
      <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400">Current Occupied Table</span>
          <div class="font-bold text-sm text-white">{{ sourceTable.table_number }} ({{ sourceTable.customer_name || 'Guest' }})</div>
        </div>
        <div class="font-mono text-sm font-bold text-emerald-400">
          ${{ (sourceTable.order_total || 0).toFixed(2) }}
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Select Destination Table (Available)</label>
        
        <div v-if="availableTargetTables.length === 0" class="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
          No other tables are currently available for transfer.
        </div>

        <div v-else class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          <button
            v-for="target in availableTargetTables"
            :key="target.id"
            type="button"
            @click="selectedTargetId = target.id"
            class="p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1"
            :class="selectedTargetId === target.id
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'"
          >
            <span>{{ target.table_number }}</span>
            <span class="text-[10px] text-slate-500 font-normal">{{ target.zone }}</span>
          </button>
        </div>
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
        @click="handleTransfer"
        :disabled="!selectedTargetId || isSubmitting"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2 disabled:opacity-40"
      >
        <ArrowRightLeft class="w-4 h-4" />
        <span>Confirm Transfer</span>
      </button>
    </template>
  </AppModal>
</template>
