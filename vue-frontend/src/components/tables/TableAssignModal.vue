<script setup lang="ts">
import { ref } from 'vue';
import { useTablesStore } from '../../stores/tables.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import type { DiningTable } from '../../types/pos.types';
import { Users, UserPlus } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
  table: DiningTable | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'assigned'): void;
}>();

const tablesStore = useTablesStore();
const uiStore = useUiStore();

const guestName = ref('');
const isSubmitting = ref(false);

async function handleAssign() {
  if (!props.table) return;
  isSubmitting.value = true;
  try {
    await tablesStore.assignTable(props.table.id, guestName.value.trim() || 'Walk-In Party');
    uiStore.showToast(`${props.table.table_number} assigned successfully`, 'success');
    guestName.value = '';
    emit('assigned');
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to assign table', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    :title="`Open Table: ${table?.table_number || ''}`"
    max-width="sm"
  >
    <div v-if="table" class="flex flex-col gap-4 select-none">
      <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400">Zone</span>
          <div class="font-bold text-sm text-white">{{ table.zone }}</div>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-slate-400">
          <Users class="w-4 h-4 text-emerald-400" />
          <span>Seats {{ table.capacity }} guests</span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Party / Customer Name</label>
        <input
          v-model="guestName"
          type="text"
          placeholder="e.g. Smith Party, VIP Guest"
          class="h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
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
        @click="handleAssign"
        :disabled="isSubmitting"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2"
      >
        <UserPlus class="w-4 h-4" />
        <span>Open Table</span>
      </button>
    </template>
  </AppModal>
</template>
