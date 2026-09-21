<script setup lang="ts">
import { ref } from 'vue';
import { useAccountingStore } from '../../stores/accounting.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import { Landmark, CheckCircle } from 'lucide-vue-next';

const accountingStore = useAccountingStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const periodStart = ref('2026-09-01');
const periodEnd = ref('2026-09-30');
const isSubmitting = ref(false);

async function handleTriggerSettlement() {
  isSubmitting.value = true;
  try {
    const branchId = authStore.activeBranch?.id || 'store_main';
    await accountingStore.settleFranchise({
      branch_id: branchId,
      period_start: periodStart.value,
      period_end: periodEnd.value
    });
    uiStore.showToast('Franchise royalty settlement processed', 'success');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Settlement trigger failed', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4 select-none">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <Landmark class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-white">Hybrid Franchise Settlement</h4>
          <span class="text-xs text-slate-400">Formula: $500 Base Rent + 3% Gross Sales Royalty</span>
        </div>
      </div>

      <div class="text-right">
        <span class="text-xs text-slate-400">Total Settlement Due</span>
        <div class="text-2xl font-black text-emerald-400 font-mono">
          ${{ (accountingStore.settlement?.total_settlement_due || 500.00).toFixed(2) }}
        </div>
      </div>
    </div>

    <!-- Settlement Breakdown Pills -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
      <div>
        <span class="text-slate-400">Monthly Base Rent:</span>
        <div class="text-base font-bold text-white font-mono mt-0.5">$500.00</div>
      </div>

      <div>
        <span class="text-slate-400">Period Gross Sales:</span>
        <div class="text-base font-bold text-slate-200 font-mono mt-0.5">
          ${{ (accountingStore.settlement?.gross_sales || accountingStore.profitLoss?.gross_sales || 0).toFixed(2) }}
        </div>
      </div>

      <div>
        <span class="text-slate-400">Royalty (3%):</span>
        <div class="text-base font-bold text-cyan-400 font-mono mt-0.5">
          ${{ (accountingStore.settlement?.royalty_amount || 0).toFixed(2) }}
        </div>
      </div>
    </div>

    <!-- Period Inputs & Settle Button -->
    <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div class="flex items-center gap-2 text-xs">
        <span class="text-slate-400">Period:</span>
        <input
          v-model="periodStart"
          type="date"
          class="h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
        />
        <span class="text-slate-500">to</span>
        <input
          v-model="periodEnd"
          type="date"
          class="h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button
        type="button"
        @click="handleTriggerSettlement"
        :disabled="isSubmitting"
        class="h-9 px-4 rounded-xl text-xs font-bold text-white glow-btn-primary flex items-center gap-2 transition disabled:opacity-40"
      >
        <CheckCircle class="w-3.5 h-3.5" />
        <span>{{ isSubmitting ? 'Calculating...' : 'Run Settlement' }}</span>
      </button>
    </div>
  </div>
</template>
