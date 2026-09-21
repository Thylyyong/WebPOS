<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTablesStore } from '../stores/tables.store';
import { useCartStore } from '../stores/cart.store';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import AppHeader from '../components/common/AppHeader.vue';
import TableCard from '../components/tables/TableCard.vue';
import TableAssignModal from '../components/tables/TableAssignModal.vue';
import TableTransferModal from '../components/tables/TableTransferModal.vue';
import { RefreshCw, MapPin } from 'lucide-vue-next';
import type { DiningTable } from '../types/pos.types';

const router = useRouter();
const tablesStore = useTablesStore();
const cartStore = useCartStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const showAssignModal = ref(false);
const showTransferModal = ref(false);
const activeTable = ref<DiningTable | null>(null);

function refreshTables() {
  const branchId = authStore.activeBranch?.id || 'store_main';
  tablesStore.fetchTables(branchId);
}

onMounted(() => {
  refreshTables();
});

function handleAssign(table: DiningTable) {
  activeTable.value = table;
  showAssignModal.value = true;
}

function handleTransfer(table: DiningTable) {
  activeTable.value = table;
  showTransferModal.value = true;
}

async function handleRelease(table: DiningTable) {
  if (confirm(`Mark ${table.table_number} clean and available?`)) {
    try {
      await tablesStore.releaseTable(table.id);
      uiStore.showToast(`${table.table_number} marked clean & available`, 'success');
      refreshTables();
    } catch (err: any) {
      uiStore.showToast(err.message || 'Failed to release table', 'error');
    }
  }
}

function handleOrder(table: DiningTable) {
  cartStore.setTable(table);
  router.push('/pos');
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#090D16] overflow-hidden select-none">
    <AppHeader />

    <!-- Tables Management Body -->
    <main class="flex-1 p-4 sm:p-6 flex flex-col gap-4 overflow-hidden max-w-7xl mx-auto w-full">
      <!-- Top Floor Plan Action & Zone Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <!-- Zone Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto">
          <button
            v-for="zone in tablesStore.zones"
            :key="zone"
            type="button"
            @click="tablesStore.activeZone = zone"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border"
            :class="tablesStore.activeZone === zone
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'"
          >
            {{ zone }}
          </button>
        </div>

        <!-- Occupancy Stats & Refresh -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-xs font-semibold">
            <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{{ tablesStore.availableCount }} Available</span>
            </span>

            <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/20">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{{ tablesStore.occupiedCount }} Occupied</span>
            </span>
          </div>

          <button
            type="button"
            @click="refreshTables"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Refresh tables status"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': tablesStore.isLoading }" />
          </button>
        </div>
      </div>

      <!-- Tables Grid -->
      <div class="flex-1 overflow-y-auto pr-1">
        <div v-if="tablesStore.isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="n in 8" :key="n" class="h-44 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
        </div>

        <div
          v-else-if="tablesStore.filteredTables.length === 0"
          class="h-64 flex flex-col items-center justify-center text-center text-slate-400"
        >
          <MapPin class="w-12 h-12 text-slate-600 mb-2" />
          <h4 class="text-sm font-bold text-slate-300">No Tables Found</h4>
          <p class="text-xs text-slate-500">No tables configured for this zone.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <TableCard
            v-for="table in tablesStore.filteredTables"
            :key="table.id"
            :table="table"
            @assign="handleAssign"
            @transfer="handleTransfer"
            @release="handleRelease"
            @order="handleOrder"
          />
        </div>
      </div>
    </main>

    <!-- Modals -->
    <TableAssignModal
      :show="showAssignModal"
      :table="activeTable"
      @close="showAssignModal = false"
      @assigned="refreshTables"
    />

    <TableTransferModal
      :show="showTransferModal"
      :source-table="activeTable"
      @close="showTransferModal = false"
      @transferred="refreshTables"
    />
  </div>
</template>
