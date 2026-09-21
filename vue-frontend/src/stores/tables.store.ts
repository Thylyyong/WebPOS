import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tablesApi } from '../api/tables.api';
import type { DiningTable } from '../types/pos.types';

export const useTablesStore = defineStore('tables', () => {
  const tables = ref<DiningTable[]>([]);
  const activeZone = ref<string>('All');
  const isLoading = ref<boolean>(false);

  const zones = computed(() => {
    const set = new Set<string>();
    tables.value.forEach(t => {
      if (t.zone) set.add(t.zone);
    });
    return ['All', ...Array.from(set)];
  });

  const filteredTables = computed(() => {
    if (activeZone.value === 'All') {
      return tables.value;
    }
    return tables.value.filter(t => t.zone === activeZone.value);
  });

  const availableCount = computed(() => {
    return tables.value.filter(t => t.status === 'AVAILABLE').length;
  });

  const occupiedCount = computed(() => {
    return tables.value.filter(t => t.status === 'OCCUPIED' || t.status === 'BILLED').length;
  });

  async function fetchTables(branchId: string) {
    isLoading.value = true;
    try {
      const res = await tablesApi.getTables(branchId);
      if (res.data.success) {
        tables.value = res.data.tables;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function assignTable(id: string, customerName?: string, orderTotal: number = 0) {
    const res = await tablesApi.assignTable(id, customerName, orderTotal);
    if (res.data.success) {
      const idx = tables.value.findIndex(t => t.id === id);
      if (idx > -1) {
        tables.value[idx] = res.data.table;
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to assign table');
  }

  async function transferTable(sourceId: string, targetTableId: string) {
    const res = await tablesApi.transferTable(sourceId, targetTableId);
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to transfer table');
  }

  async function releaseTable(id: string) {
    const res = await tablesApi.releaseTable(id);
    if (res.data.success) {
      const idx = tables.value.findIndex(t => t.id === id);
      if (idx > -1) {
        tables.value[idx].status = 'AVAILABLE';
        tables.value[idx].customer_name = null;
        tables.value[idx].order_total = 0;
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to release table');
  }

  return {
    tables,
    activeZone,
    isLoading,
    zones,
    filteredTables,
    availableCount,
    occupiedCount,
    fetchTables,
    assignTable,
    transferTable,
    releaseTable
  };
});
