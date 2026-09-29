<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { fetchAllOrders, isSameDay, isWithinDays, isSameMonth } from '../composables/useOrdersFeed';
import type { OrderListItem } from '../api/orders.api';
import { FileSpreadsheet, RefreshCw, Package, Receipt, DollarSign, ShoppingCart } from 'lucide-vue-next';

const authStore = useAuthStore();
const uiStore = useUiStore();

type RangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';
const range = ref<RangeKey>('month');
const customFrom = ref('');
const customTo = ref('');

const activeTab = ref<'overview' | 'transactions'>('overview');

const isLoading = ref(false);
const allOrders = ref<OrderListItem[]>([]);
const wasTruncated = ref(false);

const ranges: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' }
];

async function load() {
  isLoading.value = true;
  try {
    // status=all so cancelled/parked tickets don't silently vanish from
    // totals — we filter to COMPLETED ourselves for revenue math below.
    const { orders, truncated } = await fetchAllOrders({
      branch_id: authStore.activeBranch?.id,
      status: 'all'
    });
    allOrders.value = orders;
    wasTruncated.value = truncated;
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to load analytics data', 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);

const rangeFiltered = computed<OrderListItem[]>(() => {
  const completed = allOrders.value.filter(o => o.status === 'COMPLETED');
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  switch (range.value) {
    case 'today':
      return completed.filter(o => isSameDay(o.created_at, now));
    case 'yesterday':
      return completed.filter(o => isSameDay(o.created_at, yesterday));
    case 'week':
      return completed.filter(o => isWithinDays(o.created_at, 7));
    case 'month':
      return completed.filter(o => isSameMonth(o.created_at, now));
    case 'all':
      return completed;
    case 'custom': {
      if (!customFrom.value || !customTo.value) return completed;
      const from = new Date(customFrom.value).getTime();
      const to = new Date(customTo.value).getTime() + 24 * 60 * 60 * 1000 - 1;
      return completed.filter(o => {
        const t = new Date(o.created_at).getTime();
        return t >= from && t <= to;
      });
    }
    default:
      return completed;
  }
});

const totalRevenue = computed(() => rangeFiltered.value.reduce((s, o) => s + Number(o.total_amount), 0));
const completedOrders = computed(() => rangeFiltered.value.length);
const avgBill = computed(() => (completedOrders.value ? totalRevenue.value / completedOrders.value : 0));
const itemsSold = computed(() =>
  rangeFiltered.value.reduce((s, o) => s + (o.items || []).reduce((si, it) => si + Number(it.quantity), 0), 0)
);

const paymentSplit = computed(() => {
  const buckets: Record<string, number> = {};
  for (const o of rangeFiltered.value) {
    const method = (o.payment_method || 'OTHER').toUpperCase();
    const bucket = method.includes('CASH') ? 'Cash' : method.includes('CARD') ? 'Card' : method.includes('QR') ? 'QR' : 'Other';
    buckets[bucket] = (buckets[bucket] || 0) + Number(o.total_amount);
  }
  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(buckets)
    .map(([label, amount]) => ({ label, amount, pct: Math.round((amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount);
});

const paymentGradient = computed(() => {
  const colors = ['#0d9488', '#38bdf8', '#f59e0b', '#94a3b8'];
  let acc = 0;
  const stops = paymentSplit.value.map((p, i) => {
    const start = acc;
    acc += p.pct;
    return `${colors[i % colors.length]} ${start}% ${acc}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
});

const topItems = computed(() => {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of rangeFiltered.value) {
    for (const it of o.items || []) {
      const key = it.product_name;
      const cur = map.get(key) || { name: key, qty: 0, revenue: 0 };
      cur.qty += Number(it.quantity);
      cur.revenue += Number(it.total_price);
      map.set(key, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 6);
});

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function exportCsv() {
  const rows = [
    ['Receipt No', 'Date', 'Customer', 'Table', 'Payment Method', 'Subtotal', 'Tax', 'Total'],
    ...rangeFiltered.value.map(o => [
      o.receipt_no,
      new Date(o.created_at).toLocaleString(),
      o.customer_name || '',
      o.table_number || '',
      o.payment_method,
      Number(o.subtotal).toFixed(2),
      Number(o.tax_amount || 0).toFixed(2),
      Number(o.total_amount).toFixed(2)
    ])
  ];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-analytics-${range.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast('Exported as CSV (backend has no .xlsx export endpoint)', 'info');
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Sales &amp; Performance</template>
    <template #subtitle>Analytics computed from your real order history</template>
    <template #actions>
      <div class="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          v-for="r in ranges"
          :key="r.key"
          @click="range = r.key"
          class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition"
          :class="range === r.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          {{ r.label }}
        </button>
      </div>
      <button
        @click="exportCsv"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        <FileSpreadsheet class="w-3.5 h-3.5" />
        Export (.csv)
      </button>
      <button @click="load" class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh">
        <RefreshCw class="w-3.5 h-3.5" :class="isLoading && 'animate-spin'" />
      </button>
    </template>

    <div v-if="range === 'custom'" class="flex items-center gap-2 mb-4 text-xs">
      <input v-model="customFrom" type="date" class="px-2 py-1.5 rounded-lg border border-slate-200" />
      <span class="text-slate-400">to</span>
      <input v-model="customTo" type="date" class="px-2 py-1.5 rounded-lg border border-slate-200" />
    </div>

    <p v-if="wasTruncated" class="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
      Showing the most recent orders returned by the API (the backend paginates 20 at a time with no date filter) —
      figures may not reflect the entire order history for very large datasets.
    </p>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-5 border-b border-slate-200">
      <button
        @click="activeTab = 'overview'"
        class="px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px"
        :class="activeTab === 'overview' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Analytics Overview
      </button>
      <button
        @click="activeTab = 'transactions'"
        class="px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px"
        :class="activeTab === 'transactions' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Transactions Data ({{ completedOrders }})
      </button>
    </div>

    <div v-if="activeTab === 'overview'">
      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11.5px] text-slate-400 font-medium">Total Revenue</span>
            <DollarSign class="w-4 h-4 text-teal-500" />
          </div>
          <div class="text-2xl font-extrabold text-slate-900">{{ money(totalRevenue) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11.5px] text-slate-400 font-medium">Completed Orders</span>
            <Receipt class="w-4 h-4 text-teal-500" />
          </div>
          <div class="text-2xl font-extrabold text-slate-900">{{ completedOrders }}</div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11.5px] text-slate-400 font-medium">Avg Bill</span>
            <ShoppingCart class="w-4 h-4 text-teal-500" />
          </div>
          <div class="text-2xl font-extrabold text-slate-900">{{ money(avgBill) }}</div>
          <div class="text-[10.5px] text-slate-400">Per completed order</div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11.5px] text-slate-400 font-medium">Items Sold</span>
            <Package class="w-4 h-4 text-teal-500" />
          </div>
          <div class="text-2xl font-extrabold text-slate-900">{{ itemsSold }}</div>
          <div class="text-[10.5px] text-slate-400">Menu units</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Top selling items -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">Top Selling Menu Items</h3>
          <div v-if="!topItems.length" class="text-xs text-slate-400 py-6 text-center">No sales in this period yet.</div>
          <div v-for="it in topItems" :key="it.name" class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div>
              <div class="text-[12.5px] font-semibold text-slate-700">{{ it.name }}</div>
              <div class="text-[10.5px] text-slate-400">{{ it.qty }} units sold</div>
            </div>
            <div class="text-[12.5px] font-bold text-slate-700">{{ money(it.revenue) }}</div>
          </div>
        </div>

        <!-- Payment methods donut -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <h3 class="text-[13px] font-bold text-slate-800 mb-3">Payment Methods</h3>
          <div v-if="!paymentSplit.length" class="text-xs text-slate-400 py-6 text-center">No sales in this period yet.</div>
          <div v-else class="flex items-center gap-5">
            <div
              class="w-32 h-32 rounded-full shrink-0"
              :style="{ background: paymentGradient }"
            >
              <div class="w-[68px] h-[68px] rounded-full bg-white m-auto relative top-8"></div>
            </div>
            <ul class="space-y-1.5">
              <li v-for="(p, i) in paymentSplit" :key="p.label" class="flex items-center gap-2 text-[12px]">
                <span
                  class="w-2.5 h-2.5 rounded-full"
                  :style="{ background: ['#0d9488', '#38bdf8', '#f59e0b', '#94a3b8'][i % 4] }"
                ></span>
                <span class="text-slate-600">{{ p.label }}</span>
                <span class="font-semibold text-slate-800">({{ money(p.amount) }})</span>
                <span class="text-slate-400">{{ p.pct }}%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-[12.5px]">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-2.5 font-semibold">Receipt</th>
            <th class="px-4 py-2.5 font-semibold">Date</th>
            <th class="px-4 py-2.5 font-semibold">Customer / Table</th>
            <th class="px-4 py-2.5 font-semibold">Payment</th>
            <th class="px-4 py-2.5 font-semibold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in rangeFiltered" :key="o.id" class="border-t border-slate-50">
            <td class="px-4 py-2.5 font-mono text-slate-500">{{ o.receipt_no }}</td>
            <td class="px-4 py-2.5 text-slate-500">{{ new Date(o.created_at).toLocaleString() }}</td>
            <td class="px-4 py-2.5 text-slate-700">{{ o.customer_name || 'Walk-In' }} <span v-if="o.table_number" class="text-slate-400">· {{ o.table_number }}</span></td>
            <td class="px-4 py-2.5 text-slate-500">{{ o.payment_method }}</td>
            <td class="px-4 py-2.5 text-right font-semibold text-slate-800">{{ money(Number(o.total_amount)) }}</td>
          </tr>
          <tr v-if="!rangeFiltered.length">
            <td colspan="5" class="px-4 py-8 text-center text-slate-400">No transactions in this period.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppSidebarShell>
</template>
