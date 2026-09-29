<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { ordersApi, type OrderListItem } from '../api/orders.api';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-vue-next';

const authStore = useAuthStore();
const uiStore = useUiStore();

const orders = ref<OrderListItem[]>([]);
const isLoading = ref(false);
const search = ref('');
const status = ref('all');
const page = ref(1);
const lastPage = ref(1);
const total = ref(0);

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PARKED', label: 'Parked' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

async function load() {
  isLoading.value = true;
  try {
    const res = await ordersApi.getOrders({
      branch_id: authStore.activeBranch?.id,
      status: status.value,
      search: search.value || undefined,
      page: page.value
    });
    if (res.data.success) {
      orders.value = res.data.orders.data;
      lastPage.value = res.data.orders.last_page;
      total.value = res.data.orders.total;
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to load order history', 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
watch(status, () => { page.value = 1; load(); });

let searchTimer: any = null;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { page.value = 1; load(); }, 350);
});

function goPage(p: number) {
  if (p < 1 || p > lastPage.value) return;
  page.value = p;
  load();
}

function money(n: number | string) {
  return `$${Number(n).toFixed(2)}`;
}

function statusBadge(s: string) {
  switch (s) {
    case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'PARKED': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Order History</template>
    <template #subtitle>{{ total }} orders on record</template>
    <template #actions>
      <div class="relative">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="text"
          placeholder="Search receipt, customer, table..."
          class="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>
      <select v-model="status" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12.5px]">
        <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button @click="load" class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh">
        <RefreshCw class="w-3.5 h-3.5" :class="isLoading && 'animate-spin'" />
      </button>
    </template>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-[12.5px]">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-2.5 font-semibold">Receipt</th>
            <th class="px-4 py-2.5 font-semibold">Date</th>
            <th class="px-4 py-2.5 font-semibold">Customer / Table</th>
            <th class="px-4 py-2.5 font-semibold">Items</th>
            <th class="px-4 py-2.5 font-semibold">Payment</th>
            <th class="px-4 py-2.5 font-semibold">Status</th>
            <th class="px-4 py-2.5 font-semibold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id" class="border-t border-slate-50 hover:bg-slate-50/60">
            <td class="px-4 py-2.5 font-mono text-slate-500">{{ o.receipt_no }}</td>
            <td class="px-4 py-2.5 text-slate-500">{{ new Date(o.created_at).toLocaleString() }}</td>
            <td class="px-4 py-2.5 text-slate-700">
              {{ o.customer_name || 'Walk-In' }}
              <span v-if="o.table_number" class="text-slate-400">· {{ o.table_number }}</span>
            </td>
            <td class="px-4 py-2.5 text-slate-500">{{ (o.items || []).length }} item(s)</td>
            <td class="px-4 py-2.5 text-slate-500">{{ o.payment_method }}</td>
            <td class="px-4 py-2.5">
              <span class="px-2 py-0.5 rounded-full text-[10.5px] font-semibold border" :class="statusBadge(o.status)">{{ o.status }}</span>
            </td>
            <td class="px-4 py-2.5 text-right font-semibold text-slate-800">{{ money(o.total_amount) }}</td>
          </tr>
          <tr v-if="!orders.length && !isLoading">
            <td colspan="7" class="px-4 py-10 text-center text-slate-400">No orders found.</td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[12px] text-slate-500">
        <span>Page {{ page }} of {{ lastPage }}</span>
        <div class="flex items-center gap-1.5">
          <button @click="goPage(page - 1)" :disabled="page <= 1" class="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40">
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button @click="goPage(page + 1)" :disabled="page >= lastPage" class="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40">
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </AppSidebarShell>
</template>
