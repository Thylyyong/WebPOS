<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAccountingStore } from '../stores/accounting.store';
import { useAuthStore } from '../stores/auth.store';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import MetricStatCard from '../components/accounting/MetricStatCard.vue';
import FranchiseSettlement from '../components/accounting/FranchiseSettlement.vue';
import ExpenseLoggerModal from '../components/accounting/ExpenseLoggerModal.vue';
import { 
  DollarSign, 
  Receipt, 
  PiggyBank, 
  Percent, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-vue-next';

const accountingStore = useAccountingStore();
const authStore = useAuthStore();

const showExpenseModal = ref(false);

function refreshFinancials() {
  const branchId = authStore.activeBranch?.id || 'store_main';
  accountingStore.fetchFinancials(branchId);
}

onMounted(() => {
  refreshFinancials();
});
</script>

<template>
  <AppSidebarShell>
    <template #title>P&amp;L Financials</template>
    <template #subtitle>Revenue, expenses, and profit for this branch</template>
    <template #actions>
      <button
        type="button"
        @click="showExpenseModal = true"
        class="h-8 px-3 rounded-lg bg-teal-600 text-white flex items-center gap-1.5 text-xs font-semibold hover:bg-teal-700"
      >
        <PlusCircle class="w-3.5 h-3.5" />
        <span>Record Expense</span>
      </button>
      <button
        type="button"
        @click="refreshFinancials"
        class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
        aria-label="Refresh financial data"
        title="Refresh financial data"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountingStore.isLoading }" />
      </button>
    </template>

    <div class="max-w-6xl mx-auto w-full flex flex-col gap-5 sm:gap-6">

      <!-- Financial KPI Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
        <MetricStatCard
          title="Gross Sales"
          :value="`$${(accountingStore.profitLoss?.gross_sales || 0).toFixed(2)}`"
          sub-value="Total register sales"
          :icon="DollarSign"
          accent-color="emerald"
        />

        <MetricStatCard
          title="COGS (Product Cost)"
          :value="`$${(accountingStore.profitLoss?.cogs || 0).toFixed(2)}`"
          sub-value="Ingredients & goods"
          :icon="Receipt"
          accent-color="rose"
        />

        <MetricStatCard
          title="Gross Profit"
          :value="`$${(accountingStore.profitLoss?.gross_profit || 0).toFixed(2)}`"
          :sub-value="`${(accountingStore.profitLoss?.gross_margin_percent || 0).toFixed(1)}% margin`"
          :is-positive="true"
          :icon="PiggyBank"
          accent-color="cyan"
        />

        <MetricStatCard
          title="Store Expenses"
          :value="`$${(accountingStore.profitLoss?.total_expenses || 0).toFixed(2)}`"
          sub-value="Operating overhead"
          :icon="Receipt"
          accent-color="amber"
        />

        <MetricStatCard
          title="Net Profit"
          :value="`$${(accountingStore.profitLoss?.net_profit || 0).toFixed(2)}`"
          :sub-value="`${(accountingStore.profitLoss?.net_margin_percent || 0).toFixed(1)}% net`"
          :is-positive="(accountingStore.profitLoss?.net_profit || 0) >= 0"
          :icon="Percent"
          :accent-color="(accountingStore.profitLoss?.net_profit || 0) >= 0 ? 'emerald' : 'rose'"
        />
      </div>

      <!-- Hybrid Franchise Settlement Calculator -->
      <FranchiseSettlement />

      <!-- Expenses Table Ledger -->
      <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white">Recent Operating Expenses</h4>
          <span class="text-xs text-slate-500">{{ accountingStore.expenses.length }} entries</span>
        </div>

        <div v-if="accountingStore.expenses.length === 0" class="py-8 text-center text-xs text-slate-500">
          No expenses recorded yet for this branch. Click "Record Expense" above to add one.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th class="pb-2">Date</th>
                <th class="pb-2">Category</th>
                <th class="pb-2">Title / Description</th>
                <th class="pb-2">Notes</th>
                <th class="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-for="expense in accountingStore.expenses" :key="expense.id" class="hover:bg-slate-800/30">
                <td class="py-3 text-slate-400 font-mono">
                  {{ new Date(expense.created_at).toLocaleDateString() }}
                </td>
                <td class="py-3">
                  <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700 text-[10px]">
                    {{ expense.category }}
                  </span>
                </td>
                <td class="py-3 text-white font-bold">{{ expense.title }}</td>
                <td class="py-3 text-slate-400">{{ expense.notes || '-' }}</td>
                <td class="py-3 text-right font-mono font-bold text-rose-400">
                  -${{ expense.amount.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Record Expense Modal -->
    <ExpenseLoggerModal
      :show="showExpenseModal"
      @close="showExpenseModal = false"
      @logged="refreshFinancials"
    />
  </AppSidebarShell>
</template>
