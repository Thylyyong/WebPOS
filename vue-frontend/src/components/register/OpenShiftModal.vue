<script setup lang="ts">
import { ref } from 'vue';
import { useRegisterStore } from '../../stores/register.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { Landmark, ArrowRight } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'opened'): void;
}>();

const registerStore = useRegisterStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const openingCash = ref<number>(300.00);
const openingNotes = ref<string>('Morning float verified');
const isSubmitting = ref(false);

async function handleOpen() {
  if (openingCash.value < 0) return;
  isSubmitting.value = true;
  try {
    const branchId = authStore.activeBranch?.id || 'store_main';
    await registerStore.openRegister({
      branch_id: branchId,
      opening_cash: openingCash.value,
      opening_notes: openingNotes.value
    });
    uiStore.showToast('Shift register opened successfully', 'success');
    emit('opened');
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to open register', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Open Shift / Cash Drawer Float"
    max-width="md"
  >
    <div class="flex flex-col gap-4 select-none">
      <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
          <Landmark class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-white">Start New Shift</h4>
          <p class="text-xs text-slate-400">Enter initial cash drawer float counted before opening store.</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Opening Cash Float ($)</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
          <input
            v-model.number="openingCash"
            type="number"
            step="0.01"
            class="w-full h-11 pl-8 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-300">Shift Notes (Optional)</label>
        <input
          v-model="openingNotes"
          type="text"
          placeholder="e.g. Morning float verified"
          class="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
        @click="handleOpen"
        :disabled="isSubmitting || openingCash < 0"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2"
      >
        <span>Open Register</span>
        <ArrowRight class="w-4 h-4" />
      </button>
    </template>
  </AppModal>
</template>
