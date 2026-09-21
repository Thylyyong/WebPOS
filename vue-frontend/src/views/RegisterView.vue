<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRegisterStore } from '../stores/register.store';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import AppHeader from '../components/common/AppHeader.vue';
import OpenShiftModal from '../components/register/OpenShiftModal.vue';
import CashMovementModal from '../components/register/CashMovementModal.vue';
import CloseShiftModal from '../components/register/CloseShiftModal.vue';
import ZReportPreview from '../components/register/ZReportPreview.vue';
import { 
  Landmark, 
  ArrowDownLeft, 
  Lock, 
  FileText, 
  RefreshCw 
} from 'lucide-vue-next';
import type { ZReportData } from '../types/pos.types';

const registerStore = useRegisterStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const showOpenModal = ref(false);
const showMovementModal = ref(false);
const showCloseModal = ref(false);
const showZReportModal = ref(false);
const currentZReportData = ref<ZReportData | null>(null);

function refreshSession() {
  const branchId = authStore.activeBranch?.id || 'store_main';
  registerStore.fetchCurrentSession(branchId);
}

onMounted(() => {
  refreshSession();
});

async function handleClosed(sessionId: string) {
  try {
    const report = await registerStore.fetchZReport(sessionId);
    currentZReportData.value = report;
    showZReportModal.value = true;
  } catch (_) {}
  refreshSession();
}

async function viewLastZReport() {
  if (registerStore.activeSession?.id) {
    try {
      const report = await registerStore.fetchZReport(registerStore.activeSession.id);
      currentZReportData.value = report;
      showZReportModal.value = true;
    } catch (_) {
      uiStore.showToast('Z-Report will be finalized when the register is closed', 'info');
    }
  }
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#090D16] overflow-hidden select-none">
    <AppHeader />

    <main class="flex-1 p-4 sm:p-6 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col gap-6">
      <!-- Title & Status Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-white flex items-center gap-2.5">
            <Landmark class="w-6 h-6 text-emerald-400" />
            <span>Shift Register & Cash Drawer</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Manage daily drawer floats, petty cash movements, and audit Z-Reports.</p>
        </div>

        <button
          @click="refreshSession"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition self-start"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': registerStore.isLoading }" />
          <span>Refresh Status</span>
        </button>
      </div>

      <!-- State 1: Register is OPEN -->
      <div v-if="registerStore.hasActiveSession && registerStore.activeSession" class="flex flex-col gap-6">
        <!-- Main Drawer Status Card -->
        <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
          <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Drawer Status</span>
                <div class="text-lg font-extrabold text-emerald-400">SHIFT OPEN & ACTIVE</div>
              </div>
            </div>

            <div class="text-xs text-slate-400 text-right">
              <div>Cashier: <strong class="text-white">{{ registerStore.activeSession.cashier_name }}</strong></div>
              <div class="text-[11px] text-slate-500 mt-0.5">
                Opened: {{ new Date(registerStore.activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
          </div>

          <!-- Financial Float Breakdown Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span class="text-xs text-slate-400">Opening Float</span>
              <div class="text-xl font-bold text-white font-mono mt-1">
                ${{ (registerStore.activeSession.opening_cash || 0).toFixed(2) }}
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span class="text-xs text-slate-400">Cash Sales</span>
              <div class="text-xl font-bold text-emerald-400 font-mono mt-1">
                +${{ (registerStore.activeSession.cash_sales || 0).toFixed(2) }}
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span class="text-xs text-slate-400">Cash Movements</span>
              <div class="text-xl font-bold text-cyan-400 font-mono mt-1">
                +${{ (registerStore.activeSession.cash_in || 0).toFixed(2) }} / -${{ (registerStore.activeSession.cash_out || 0).toFixed(2) }}
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <span class="text-xs font-semibold text-emerald-300">Expected in Drawer</span>
              <div class="text-2xl font-black text-emerald-400 font-mono mt-1">
                ${{ (registerStore.activeSession.expected_cash || 0).toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- Action Buttons Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="showMovementModal = true"
                class="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
              >
                <ArrowDownLeft class="w-4 h-4 text-emerald-400" />
                <span>Petty Cash In / Out</span>
              </button>

              <button
                type="button"
                @click="viewLastZReport"
                class="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
              >
                <FileText class="w-4 h-4 text-cyan-400" />
                <span>Shift Summary</span>
              </button>
            </div>

            <button
              type="button"
              @click="showCloseModal = true"
              class="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
            >
              <Lock class="w-4 h-4" />
              <span>Close Shift & Reconcile</span>
            </button>
          </div>
        </div>
      </div>

      <!-- State 2: Register is CLOSED -->
      <div v-else class="p-12 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Lock class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-lg font-black text-white">Cash Register is Closed</h3>
          <p class="text-xs text-slate-400 max-w-sm mt-1">
            Open a shift session by inputting the counted cash drawer float before ringing up sales on the POS terminal.
          </p>
        </div>

        <button
          type="button"
          @click="showOpenModal = true"
          class="mt-2 h-12 px-6 rounded-2xl glow-btn-primary flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
        >
          <Landmark class="w-4 h-4" />
          <span>Open Shift Register</span>
        </button>
      </div>
    </main>

    <!-- Shift Register Modals -->
    <OpenShiftModal
      :show="showOpenModal"
      @close="showOpenModal = false"
      @opened="refreshSession"
    />

    <CashMovementModal
      :show="showMovementModal"
      @close="showMovementModal = false"
      @recorded="refreshSession"
    />

    <CloseShiftModal
      :show="showCloseModal"
      @close="showCloseModal = false"
      @closed="handleClosed"
    />

    <ZReportPreview
      :show="showZReportModal"
      :data="currentZReportData"
      @close="showZReportModal = false"
    />
  </div>
</template>
