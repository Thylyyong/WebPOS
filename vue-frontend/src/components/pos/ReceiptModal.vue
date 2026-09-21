<script setup lang="ts">
import { useUiStore } from '../../stores/ui.store';
import AppModal from '../common/AppModal.vue';
import { Printer } from 'lucide-vue-next';

const uiStore = useUiStore();

function printReceipt() {
  window.print();
}
</script>

<template>
  <AppModal
    :show="uiStore.isReceiptOpen"
    @close="uiStore.closeReceipt()"
    title="Customer Thermal Receipt"
    max-width="md"
  >
    <div v-if="uiStore.activeReceiptOrder" class="flex flex-col items-center select-none">
      <!-- Thermal Paper Simulation Card -->
      <div
        id="thermal-receipt-print-area"
        class="w-full bg-white text-black p-6 rounded-xl shadow-inner font-mono text-xs flex flex-col gap-3 border border-slate-300"
      >
        <!-- Header -->
        <div class="text-center pb-3 border-b border-dashed border-gray-400">
          <h2 class="text-base font-black tracking-wider uppercase">OMNIPOS BISTRO</h2>
          <p class="text-[11px] text-gray-600">124 Grand Avenue, Suite 400</p>
          <p class="text-[11px] text-gray-600">Tel: +1 (555) 019-2834</p>
          <p class="mt-2 text-[10px] text-gray-500 font-sans">
            Receipt: <span class="font-mono font-bold">{{ uiStore.activeReceiptOrder.receipt_no }}</span>
          </p>
          <p class="text-[10px] text-gray-500 font-sans">
            {{ new Date(uiStore.activeReceiptOrder.created_at || Date.now()).toLocaleString() }}
          </p>
        </div>

        <!-- Order Meta -->
        <div class="flex justify-between text-[11px] text-gray-700 py-1 border-b border-dashed border-gray-300">
          <span>Table: {{ uiStore.activeReceiptOrder.table_number || 'Walk-In' }}</span>
          <span>Guest: {{ uiStore.activeReceiptOrder.customer_name || 'Guest' }}</span>
        </div>

        <!-- Items Table -->
        <div class="flex flex-col gap-1.5 py-2 border-b border-dashed border-gray-400">
          <div
            v-for="(item, i) in uiStore.activeReceiptOrder.items"
            :key="i"
            class="flex items-start justify-between"
          >
            <div class="flex-1 pr-2">
              <span class="font-bold">{{ item.quantity }}x</span> {{ item.product_name }}
            </div>
            <div class="font-bold">
              ${{ item.total_price.toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Calculations -->
        <div class="flex flex-col gap-1 py-1 text-[11px]">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>${{ uiStore.activeReceiptOrder.subtotal.toFixed(2) }}</span>
          </div>

          <div v-if="uiStore.activeReceiptOrder.discount_amount > 0" class="flex justify-between text-gray-700">
            <span>Discount</span>
            <span>-${{ uiStore.activeReceiptOrder.discount_amount.toFixed(2) }}</span>
          </div>

          <div class="flex justify-between">
            <span>Tax (10%)</span>
            <span>${{ uiStore.activeReceiptOrder.tax_amount.toFixed(2) }}</span>
          </div>

          <div class="flex justify-between text-sm font-black pt-2 border-t border-dashed border-gray-400">
            <span>TOTAL</span>
            <span>${{ uiStore.activeReceiptOrder.total_amount.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="pt-2 border-t border-dashed border-gray-400 text-[11px] flex flex-col gap-1">
          <div class="flex justify-between">
            <span>Payment Method</span>
            <span class="font-bold">{{ uiStore.activeReceiptOrder.payment_method }}</span>
          </div>

          <div v-if="uiStore.activeReceiptOrder.cash_tendered" class="flex justify-between">
            <span>Cash Tendered</span>
            <span>${{ uiStore.activeReceiptOrder.cash_tendered.toFixed(2) }}</span>
          </div>

          <div v-if="uiStore.activeReceiptOrder.change_amount !== undefined" class="flex justify-between font-bold">
            <span>Change Due</span>
            <span>${{ uiStore.activeReceiptOrder.change_amount.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-600">
          <p>Thank you for dining with us!</p>
          <p>Please keep this receipt for your records.</p>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="uiStore.closeReceipt()"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
      >
        Close
      </button>

      <button
        type="button"
        @click="printReceipt"
        class="px-5 py-2 rounded-xl text-sm font-bold text-white glow-btn-primary flex items-center gap-2"
      >
        <Printer class="w-4 h-4" />
        <span>Print Receipt</span>
      </button>
    </template>
  </AppModal>
</template>
