<script setup lang="ts">
import AppModal from '../common/AppModal.vue';
import type { ZReportData } from '../../types/pos.types';
import { Printer } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
  data: ZReportData | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function printZReport() {
  window.print();
}
</script>

<template>
  <AppModal
    :show="show"
    @close="emit('close')"
    title="Daily Shift Z-Report Audit"
    max-width="md"
  >
    <div v-if="data" class="flex flex-col items-center select-none">
      <!-- Thermal Z-Report Paper -->
      <div
        id="thermal-receipt-print-area"
        class="w-full bg-white text-black p-6 rounded-xl font-mono text-xs flex flex-col gap-3 border border-slate-300"
      >
        <div class="text-center pb-3 border-b border-dashed border-gray-400">
          <h2 class="text-base font-black tracking-widest uppercase">DAILY SHIFT Z-REPORT</h2>
          <p class="text-[11px] text-gray-700">OmniPOS Main Bistro</p>
          <p class="text-[10px] text-gray-500 mt-1 font-sans">
            Session: <span class="font-mono font-bold">{{ data.session_id }}</span>
          </p>
          <p class="text-[10px] text-gray-600 font-sans">
            Cashier: <span class="font-bold">{{ data.cashier_name }}</span>
          </p>
        </div>

        <div class="text-[10px] text-gray-600 flex flex-col gap-0.5 py-1 border-b border-dashed border-gray-300">
          <div>Opened: {{ new Date(data.opened_at).toLocaleString() }}</div>
          <div>Closed: {{ new Date(data.closed_at).toLocaleString() }}</div>
        </div>

        <!-- Sales Breakdown -->
        <div class="flex flex-col gap-1 py-1 border-b border-dashed border-gray-400">
          <div class="font-bold text-[11px] uppercase tracking-wider mb-1">Financial Summary</div>
          <div class="flex justify-between">
            <span>Gross Sales</span>
            <span>${{ (data.gross_sales || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Discounts</span>
            <span>-${{ (data.discounts || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>Net Sales</span>
            <span>${{ (data.net_sales || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax Collected</span>
            <span>${{ (data.tax_total || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment Breakdown -->
        <div class="flex flex-col gap-1 py-1 border-b border-dashed border-gray-400">
          <div class="font-bold text-[11px] uppercase tracking-wider mb-1">Tender Breakdown</div>
          <div class="flex justify-between">
            <span>Cash Tendered</span>
            <span>${{ (data.payment_breakdown?.cash || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Credit / Debit Card</span>
            <span>${{ (data.payment_breakdown?.card || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>QR Digital</span>
            <span>${{ (data.payment_breakdown?.qr || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Drawer Reconciliation -->
        <div class="flex flex-col gap-1 py-1">
          <div class="font-bold text-[11px] uppercase tracking-wider mb-1">Cash Drawer Audit</div>
          <div class="flex justify-between">
            <span>Opening Float</span>
            <span>${{ (data.drawer_reconciliation?.opening_cash || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Cash Sales</span>
            <span>+${{ (data.drawer_reconciliation?.cash_sales || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Cash In</span>
            <span>+${{ (data.drawer_reconciliation?.cash_in || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Cash Out</span>
            <span>-${{ (data.drawer_reconciliation?.cash_out || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold pt-1 border-t border-dashed border-gray-300">
            <span>Expected Cash</span>
            <span>${{ (data.drawer_reconciliation?.expected_cash || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>Actual Counted</span>
            <span>${{ (data.drawer_reconciliation?.counted_cash || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-black text-sm pt-1 border-t border-dashed border-gray-400">
            <span>Variance / Diff</span>
            <span>
              {{ (data.drawer_reconciliation?.difference || 0) >= 0 ? '+' : '' }}${{ (data.drawer_reconciliation?.difference || 0).toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-500">
          --- END OF AUDIT REPORT ---
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
      >
        Close
      </button>

      <button
        type="button"
        @click="printZReport"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2"
      >
        <Printer class="w-4 h-4" />
        <span>Print Z-Report</span>
      </button>
    </template>
  </AppModal>
</template>
