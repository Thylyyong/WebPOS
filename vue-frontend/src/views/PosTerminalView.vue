<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore } from '../stores/cart.store';
import PosTopBar from '../components/common/PosTopBar.vue';
import ProductGrid from '../components/pos/ProductGrid.vue';
import CartSidebar from '../components/pos/CartSidebar.vue';
import { ShoppingBag } from 'lucide-vue-next';

const cartStore = useCartStore();
const mobileCartOpen = ref(false);
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#F5F7FA] overflow-hidden">
    <!-- Top POS Bar -->
    <PosTopBar />

    <!-- Main POS Layout -->
    <main class="flex-1 flex overflow-hidden relative">
      <!-- Left Side: Catalog & Product Grid (65-70%) -->
      <section class="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col min-w-0">
        <ProductGrid />
      </section>

      <!-- Right Side: Sticky Cart Ticket Sidebar (30-35%) -->
      <div
        class="lg:static fixed inset-y-0 right-0 z-30 transform transition-transform duration-300 lg:transform-none"
        :class="mobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'"
      >
        <CartSidebar />
      </div>

      <!-- Mobile Cart Toggle Floating Button -->
      <button
        v-if="!mobileCartOpen"
        type="button"
        @click="mobileCartOpen = true"
        class="lg:hidden fixed bottom-5 right-5 z-40 h-14 px-5 rounded-2xl glow-btn-primary flex items-center gap-3 shadow-2xl"
      >
        <div class="relative">
          <ShoppingBag class="w-5 h-5" />
          <span
            v-if="cartStore.totalItemsCount > 0"
            class="absolute -top-2 -right-2 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow"
          >
            {{ cartStore.totalItemsCount }}
          </span>
        </div>
        <span class="font-bold text-sm">Cart (${{ cartStore.totalDue.toFixed(2) }})</span>
      </button>

      <!-- Mobile Backdrop -->
      <div
        v-if="mobileCartOpen"
        @click="mobileCartOpen = false"
        class="lg:hidden fixed inset-0 z-20 bg-black/70 backdrop-blur-sm"
      />
    </main>
  </div>
</template>
