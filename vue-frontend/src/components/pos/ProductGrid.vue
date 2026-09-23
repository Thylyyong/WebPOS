<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCatalogStore } from '../../stores/catalog.store';
import { useCartStore } from '../../stores/cart.store';
import { useUiStore } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import CategoryTabs from './CategoryTabs.vue';
import ProductCard from './ProductCard.vue';
import ProductModal from './ProductModal.vue';
import { Search, ScanBarcode, X, PackageOpen, Plus } from 'lucide-vue-next';
import type { Product } from '../../types/pos.types';

const catalogStore = useCatalogStore();
const cartStore = useCartStore();
const uiStore = useUiStore();
const authStore = useAuthStore();

const barcodeInput = ref('');
const isScanning = ref(false);

// Modal state
const showModal = ref(false);
const editingProduct = ref<Product | null>(null);

function handleAddToCart(product: Product) {
  cartStore.addToCart(product);
  uiStore.showToast(`Added ${product.name} to cart`, 'success');
}

function handleOpenAddProduct() {
  editingProduct.value = null;
  showModal.value = true;
}

function handleEditProduct(product: Product) {
  editingProduct.value = product;
  showModal.value = true;
}

async function handleBarcodeSubmit() {
  if (!barcodeInput.value.trim()) return;
  isScanning.value = true;
  try {
    const product = await catalogStore.lookupBarcode(barcodeInput.value.trim());
    if (product) {
      handleAddToCart(product);
      barcodeInput.value = '';
    } else {
      uiStore.showToast(`No item found with barcode: ${barcodeInput.value}`, 'warning');
    }
  } catch (err: any) {
    uiStore.showToast('Barcode lookup failed', 'error');
  } finally {
    isScanning.value = false;
  }
}

onMounted(() => {
  catalogStore.fetchCatalog();
});
</script>

<template>
  <div class="flex flex-col h-full gap-3 overflow-hidden select-none">
    <!-- Top Action Bar: Search, Barcode Scanner, & Add Product Button -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="catalogStore.searchQuery"
          type="text"
          placeholder="Search products by name, SKU..."
          class="w-full h-11 pl-10 pr-9 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition"
        />
        <button
          v-if="catalogStore.searchQuery"
          @click="catalogStore.searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Barcode Lookup Form -->
      <form @submit.prevent="handleBarcodeSubmit" class="relative sm:w-60">
        <ScanBarcode class="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="barcodeInput"
          type="text"
          placeholder="Scan barcode..."
          class="w-full h-11 pl-10 pr-12 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition"
        />
        <button
          type="submit"
          :disabled="isScanning || !barcodeInput"
          class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition"
        >
          Scan
        </button>
      </form>

      <!-- Boss/Admin Add Product Action Button -->
      <button
        v-if="authStore.isBoss"
        type="button"
        @click="handleOpenAddProduct"
        class="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>Add Product</span>
      </button>
    </div>

    <!-- Category Pills Tabs -->
    <CategoryTabs />

    <!-- Product Grid Content -->
    <div class="flex-1 overflow-y-auto pr-1">
      <!-- Loading State -->
      <div v-if="catalogStore.isLoading" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <div v-for="n in 8" :key="n" class="h-36 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="catalogStore.filteredProducts.length === 0"
        class="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400"
      >
        <PackageOpen class="w-12 h-12 text-slate-600 mb-3" />
        <h4 class="text-base font-semibold text-slate-300">No Products Found</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-xs">Try adjusting your search query or selecting another category.</p>
        <button
          v-if="authStore.isBoss"
          type="button"
          @click="handleOpenAddProduct"
          class="mt-4 px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4" />
          <span>Add First Product to Category</span>
        </button>
      </div>

      <!-- Product Cards Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        <ProductCard
          v-for="product in catalogStore.filteredProducts"
          :key="product.id"
          :product="product"
          @add="handleAddToCart"
          @edit="handleEditProduct"
        />
      </div>
    </div>

    <!-- Product Create/Edit Modal -->
    <ProductModal
      :show="showModal"
      :product="editingProduct"
      @close="showModal = false"
    />
  </div>
</template>
