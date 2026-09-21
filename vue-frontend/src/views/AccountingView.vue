<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAccountingStore } from '../stores/accounting.store';
import { useAuthStore } from '../stores/auth.store';
import AppHeader from '../components/common/AppHeader.vue';
import MetricStatCard from '../components/accounting/MetricStatCard.vue';
import FranchiseSettlement from '../components/accounting/FranchiseSettlement.vue';
import ExpenseLoggerModal from '../components/accounting/ExpenseLoggerModal.vue';
import { 
  TrendingUp, 
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
  <div class="h-screen w-screen flex flex-col bg-[#090D16] overflow-hidden select-none">
    <AppHeader />

    <main class="flex-1 p-4 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col gap-6">
      <!-- Title & Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-black text-white flex items-center gap-2.5">
              <TrendingUp class="w-6 h-6 text-emerald-400" />
              <span>Store Financials & P&L Analytics</span>
            </h2>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Boss Only
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Real-time revenue, COGS, operating expenses, and franchise royalties.</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="showExpenseModal = true"
            class="h-10 px-4 rounded-xl glow-btn-primary flex items-center gap-2 text-xs font-bold"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          <button
            type="button"
            @click="refreshFinancials"
            class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': accountingStore.isLoading }" />
          </button>
        </div>
      </div>

      <!-- Financial KPI Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
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
      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white">Recent Operating Expenses</h4>
          <span class="text-xs text-slate-500">{{ accountingStore.expenses.length }} entries</span>
        </div>

        <div v-if="accountingStore.expenses.length === 0" class="py-8 text-center text-xs text-slate-500">
          No expenses recorded yet for this branch. Click "Record Expense" above to add one.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
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
    </main>

    <!-- Record Expense Modal -->
    <ExpenseLoggerModal
      :show="showExpenseModal"
      @close="showExpenseModal = false"
      @logged="refreshFinancials"
    />
  </div>
</template>
