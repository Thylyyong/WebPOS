<script setup lang="ts">
import { ref } from 'vue';
import { useAccountingStore } from '../../stores/accounting.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { PlusCircle } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'logged'): void;
}>();

const accountingStore = useAccountingStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const category = ref('Supplies');
const title = ref('');
const amount = ref<number>(25.00);
const notes = ref('Paid cash from register');
const isSubmitting = ref(false);

const categories = ['Supplies', 'Ingredients', 'Utilities', 'Maintenance', 'Marketing', 'Other'];

async function handleSubmit() {
  if (!title.value.trim() || amount.value <= 0) return;
  isSubmitting.value = true;
  try {
    const branchId = authStore.activeBranch?.id || 'store_main';
    await accountingStore.logExpense({
      branch_id: branchId,
      category: category.value,
      title: title.value.trim(),
      amount: amount.value,
      notes: notes.value.trim()
    });
    uiStore.showToast(`Logged expense: ${title.value}`, 'success');
    title.value = '';
    emit('logged');
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to record expense', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Record Store Operating Expense"
    max-width="md"
  >
    <div class="flex flex-col gap-4 select-none">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Category</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            @click="category = cat"
            class="h-9 rounded-xl text-xs font-semibold border transition"
            :class="category === cat
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Expense Title / Item</label>
        <input
          v-model="title"
          type="text"
          placeholder="e.g. Ice Bags & Coffee Cups Restock"
          class="h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

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

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Notes (Optional)</label>
        <input
          v-model="notes"
          type="text"
          placeholder="e.g. Paid cash from register"
          class="h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
        @click="handleSubmit"
        :disabled="isSubmitting || !title || amount <= 0"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2 disabled:opacity-40"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Save Expense</span>
      </button>
    </template>
  </AppModal>
</template>
