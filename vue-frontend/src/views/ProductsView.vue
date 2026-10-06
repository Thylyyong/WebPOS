<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import { catalogApi } from '../api/catalog.api';
import { useUiStore } from '../stores/ui.store';
import { useAuthStore } from '../stores/auth.store';
import type { Category, Product } from '../types/pos.types';
import { categoryTracksStock, productTracksStock } from '../utils/stock';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Package,
  ImagePlus,
  AlertTriangle,
  Upload,
  CheckCircle2,
} from 'lucide-vue-next';

const uiStore = useUiStore();
const authStore = useAuthStore();
const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const isLoading = ref(false);
const search = ref('');
const activeCategory = ref<string>('all');

async function load() {
  isLoading.value = true;
  try {
    const [catRes, prodRes] = await Promise.all([
      catalogApi.getCategories(),
      catalogApi.getProducts(),
    ]);
    if (catRes.data.success) categories.value = catRes.data.categories;
    if (prodRes.data.success) products.value = prodRes.data.products;
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to load catalog', 'error');
  } finally {
    isLoading.value = false;
  }
}
onMounted(load);

const filtered = computed(() => {
  let list = products.value;
  if (activeCategory.value !== 'all') {
    list = list.filter((p) => p.category_id === activeCategory.value);
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
    );
  }
  return list;
});

function categoryPath(p: Product) {
  const cat = categories.value.find((c) => c.id === p.category_id);
  const sub = cat?.subcategories?.find((s) => s.id === p.subcategory_id);
  return [cat?.name, sub?.name].filter(Boolean).join(' › ');
}

function getProductImage(p: { image_url?: string | null; image_path?: string | null }): string {
  if (p.image_url) return p.image_url;
  if (!p.image_path) return '';
  if (
    p.image_path.startsWith('http://') ||
    p.image_path.startsWith('https://') ||
    p.image_path.startsWith('data:')
  ) {
    return p.image_path;
  }
  const backendBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/api\/?$/, '') || '';
  const cleanPath = p.image_path.startsWith('/') ? p.image_path : '/' + p.image_path;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
}

/* ---------------- Product Modal (Add & Full Edit) ---------------- */
const isProductModalOpen = ref(false);
const isEditing = ref(false);
const editingProductId = ref<string | null>(null);
const isSaving = ref(false);

const imageInput = ref<HTMLInputElement | null>(null);
const selectedImage = ref<File | null>(null);
const imagePreviewUrl = ref('');
const existingImageUrl = ref('');
const removeCurrentImage = ref(false);

const form = ref({
  name: '',
  category_id: '',
  subcategory_id: '',
  price: 0,
  cost: 0,
  sku: '',
  barcode: '',
  stock_quantity: 100,
  tax_rate: 10,
  is_available: true,
  description: '',
});

// Coffee & Drink categories have no stock amount; all other categories keep it.
const formTracksStock = computed(() => categoryTracksStock(form.value.category_id, categories.value));

const formSubcategories = computed(() => {
  if (!form.value.category_id) return [];
  const cat = categories.value.find((c) => c.id === form.value.category_id);
  return cat?.subcategories || [];
});

function clearImageState() {
  if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
  imagePreviewUrl.value = '';
  existingImageUrl.value = '';
  selectedImage.value = null;
  removeCurrentImage.value = false;
  if (imageInput.value) imageInput.value.value = '';
}

onBeforeUnmount(clearImageState);

function openAdd() {
  isEditing.value = false;
  editingProductId.value = null;
  clearImageState();
  form.value = {
    name: '',
    category_id: categories.value[0]?.id || '',
    subcategory_id: '',
    price: 0,
    cost: 0,
    sku: '',
    barcode: '',
    stock_quantity: 100,
    tax_rate: 10,
    is_available: true,
    description: '',
  };
  isProductModalOpen.value = true;
}

function openEdit(p: Product) {
  isEditing.value = true;
  editingProductId.value = p.id;
  clearImageState();
  form.value = {
    name: p.name,
    category_id: p.category_id,
    subcategory_id: p.subcategory_id || '',
    price: Number(p.price) || 0,
    cost: Number(p.cost) || 0,
    sku: p.sku || '',
    barcode: p.barcode || '',
    stock_quantity: Number(p.stock_quantity) || 0,
    tax_rate: Number(p.tax_rate) || 0,
    is_available: p.is_available ?? true,
    description: p.description || '',
  };
  existingImageUrl.value = getProductImage(p);
  isProductModalOpen.value = true;
}

function closeProductModal() {
  isProductModalOpen.value = false;
  clearImageState();
}

function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    uiStore.showToast('Please select a valid image file', 'warning');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    uiStore.showToast('Image size must be under 5MB', 'warning');
    input.value = '';
    return;
  }

  if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
  selectedImage.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
  removeCurrentImage.value = false;
}

function handleRemoveImage() {
  if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
  imagePreviewUrl.value = '';
  existingImageUrl.value = '';
  selectedImage.value = null;
  removeCurrentImage.value = true;
  if (imageInput.value) imageInput.value.value = '';
}

async function submitProduct() {
  if (!form.value.name.trim()) {
    uiStore.showToast('Product name is required', 'warning');
    return;
  }
  if (!form.value.category_id) {
    uiStore.showToast('Category is required', 'warning');
    return;
  }
  if (form.value.price < 0) {
    uiStore.showToast('Price cannot be negative', 'warning');
    return;
  }

  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append('name', form.value.name.trim());
    formData.append('category_id', form.value.category_id);
    if (form.value.subcategory_id) {
      formData.append('subcategory_id', form.value.subcategory_id);
    } else {
      formData.append('subcategory_id', '');
    }
    formData.append('price', String(form.value.price));
    formData.append('cost', String(form.value.cost || 0));
    if (form.value.sku) formData.append('sku', form.value.sku.trim());
    if (form.value.barcode) formData.append('barcode', form.value.barcode.trim());
    if (formTracksStock.value) {
      formData.append('stock_quantity', String(form.value.stock_quantity ?? 0));
    }
    formData.append('tax_rate', String(form.value.tax_rate ?? 0));
    formData.append('is_available', form.value.is_available ? '1' : '0');
    if (form.value.description) formData.append('description', form.value.description.trim());

    if (selectedImage.value) {
      formData.append('image', selectedImage.value);
    } else if (removeCurrentImage.value) {
      formData.append('remove_image', '1');
    }

    if (isEditing.value && editingProductId.value) {
      const res = await catalogApi.updateProduct(editingProductId.value, formData);
      if (res.data.success) {
        uiStore.showToast(res.data.message || 'Product updated successfully', 'success');
        closeProductModal();
        await load();
      }
    } else {
      const res = await catalogApi.createProduct(formData);
      if (res.data.success) {
        uiStore.showToast(res.data.message || 'Product created successfully', 'success');
        closeProductModal();
        await load();
      }
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to save product', 'error');
  } finally {
    isSaving.value = false;
  }
}

/* ---------------- Delete Product ---------------- */
const productToDelete = ref<Product | null>(null);
const isDeleting = ref(false);

function confirmDelete(p: Product) {
  productToDelete.value = p;
}

async function handleDeleteProduct() {
  if (!productToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await catalogApi.deleteProduct(productToDelete.value.id);
    if (res.data.success) {
      uiStore.showToast(res.data.message || 'Product deleted successfully', 'success');
      productToDelete.value = null;
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to delete product', 'error');
  } finally {
    isDeleting.value = false;
  }
}

/* ---------------- Quick Stock adjustment ---------------- */
const stockEditProduct = ref<Product | null>(null);
const stockValue = ref(0);
const isSavingStock = ref(false);

function openStockEdit(p: Product) {
  stockEditProduct.value = p;
  stockValue.value = p.stock_quantity;
}

async function saveStock() {
  if (!stockEditProduct.value) return;
  isSavingStock.value = true;
  try {
    const res = await catalogApi.updateStock(stockEditProduct.value.id, Number(stockValue.value));
    if (res.data.success) {
      uiStore.showToast('Stock updated successfully', 'success');
      stockEditProduct.value = null;
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to update stock', 'error');
  } finally {
    isSavingStock.value = false;
  }
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Product &amp; SKU Catalog</template>
    <template #subtitle>{{ authStore.isBoss ? 'Manage menu items, prices, barcodes and stock' : 'Browse menu items, prices and stock availability' }}</template>
    <template #actions>
      <div class="relative w-64 hidden sm:block">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="text"
          placeholder="Search items, SKU, barcode..."
          class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
        />
      </div>
      <button
        @click="load"
        class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 bg-white transition-colors"
        title="Refresh catalog"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="isLoading && 'animate-spin'" />
      </button>
      <button
        v-if="authStore.isBoss"
        @click="openAdd"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Product
      </button>
    </template>

    <!-- Category Filters -->
    <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
      <button
        @click="activeCategory = 'all'"
        class="px-3 py-1.5 rounded-lg text-[12px] font-semibold border shrink-0 transition-colors"
        :class="
          activeCategory === 'all'
            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        "
      >
        All Items
      </button>
      <button
        v-for="c in categories"
        :key="c.id"
        @click="activeCategory = c.id"
        class="px-3 py-1.5 rounded-lg text-[12px] font-semibold border shrink-0 transition-colors"
        :class="
          activeCategory === c.id
            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        "
      >
        {{ c.name }}
      </button>
    </div>

    <!-- Product Rows -->
    <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
      <div
        v-for="p in filtered"
        :key="p.id"
        class="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors"
      >
        <!-- Product Thumbnail -->
        <div
          class="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative"
        >
          <img
            v-if="getProductImage(p)"
            :src="getProductImage(p)"
            :alt="p.name"
            class="w-full h-full object-cover"
            loading="lazy"
            @error="($event.target as HTMLElement).style.display = 'none'"
          />
          <Package v-else class="w-5 h-5 text-slate-300" />
        </div>

        <!-- Name & Details -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-bold text-slate-800 truncate">{{ p.name }}</span>
            <span
              v-if="!p.is_available"
              class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider"
            >
              Unavailable
            </span>
          </div>
          <div class="text-[11px] text-slate-400 truncate mt-0.5">
            SKU: {{ p.sku || '—' }} · {{ categoryPath(p) }}
            <span v-if="p.barcode"> · Barcode: {{ p.barcode }}</span>
          </div>
        </div>

        <!-- Pricing -->
        <div class="text-right shrink-0">
          <div class="text-[13.5px] font-bold text-slate-800">${{ Number(p.price).toFixed(2) }}</div>
          <div v-if="authStore.isBoss" class="text-[10.5px] text-slate-400">Cost: ${{ Number(p.cost).toFixed(2) }}</div>
        </div>

        <!-- Stock Badge (clickable for quick stock adjust) -->
        <button
          v-if="productTracksStock(p, categories)"
          @click="authStore.isBoss && openStockEdit(p)"
          :disabled="!authStore.isBoss"
          class="px-2 py-1 rounded-md text-[10.5px] font-bold shrink-0 transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100"
          :class="p.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
          :title="authStore.isBoss ? 'Click to quick-adjust stock' : undefined"
        >
          {{ p.stock_quantity > 0 ? `${p.stock_quantity} IN STOCK` : 'OUT OF STOCK' }}
        </button>

        <!-- Actions (Owner/Admin only) -->
        <div v-if="authStore.isBoss" class="flex items-center gap-1.5 shrink-0">
          <button
            @click="openEdit(p)"
            class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50/50 hover:border-teal-300 transition-colors"
            title="Edit product details &amp; image"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>
          <button
            @click="confirmDelete(p)"
            class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-300 transition-colors"
            title="Delete product"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div v-if="!filtered.length && !isLoading" class="text-center py-16 text-slate-400 text-sm">
        <Package class="w-8 h-8 mx-auto text-slate-300 mb-2" />
        No products found in catalog.
      </div>
    </div>

    <!-- Product Modal: Add & Edit (Full CRUD + Image Upload) -->
    <div
      v-if="isProductModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="closeProductModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-lg p-5 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 class="text-[16px] font-bold text-slate-800">
              {{ isEditing ? 'Edit Product' : 'Add New Product' }}
            </h3>
            <p class="text-[11.5px] text-slate-400 mt-0.5">
              {{ isEditing ? 'Update menu item info, price, image and stock' : 'Create a new item in your store catalog' }}
            </p>
          </div>
          <button
            @click="closeProductModal"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Image Upload / Preview Block -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Product Image
            </label>
            <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div class="flex items-center gap-3.5">
                <div
                  class="w-20 h-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                >
                  <img
                    v-if="imagePreviewUrl"
                    :src="imagePreviewUrl"
                    alt="Preview"
                    class="w-full h-full object-cover"
                  />
                  <img
                    v-else-if="existingImageUrl && !removeCurrentImage"
                    :src="existingImageUrl"
                    alt="Current image"
                    class="w-full h-full object-cover"
                    @error="($event.target as HTMLElement).style.display = 'none'"
                  />
                  <ImagePlus v-else class="w-6 h-6 text-slate-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[12.5px] font-semibold text-slate-700">
                    {{ selectedImage?.name || (existingImageUrl && !removeCurrentImage ? 'Current Image' : 'No image selected') }}
                  </p>
                  <p class="text-[11px] text-slate-400 mt-0.5">
                    JPEG, PNG, WEBP or SVG (Max 5MB).
                  </p>
                  <input
                    ref="imageInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageSelected"
                  />
                  <div class="flex flex-wrap gap-2 mt-2.5">
                    <button
                      type="button"
                      @click="imageInput?.click()"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11.5px] font-semibold hover:bg-teal-700 shadow-sm transition-colors"
                    >
                      <Upload class="w-3.5 h-3.5" />
                      {{ (imagePreviewUrl || (existingImageUrl && !removeCurrentImage)) ? 'Change Photo' : 'Upload Photo' }}
                    </button>
                    <button
                      v-if="imagePreviewUrl || (existingImageUrl && !removeCurrentImage)"
                      type="button"
                      @click="handleRemoveImage"
                      class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11.5px] font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Basic Info -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Item Name *
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Iced Vanilla Latte"
              class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <!-- Category & Subcategory -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Category *
              </label>
              <select
                v-model="form.category_id"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
              >
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Subcategory
              </label>
              <select
                v-model="form.subcategory_id"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
              >
                <option value="">None</option>
                <option v-for="s in formSubcategories" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <!-- Price & Cost -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Selling Price ($) *
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-semibold">$</span>
                <input
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Cost Price (COGS) ($)
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-semibold">$</span>
                <input
                  v-model.number="form.cost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>
          </div>

          <!-- SKU & Barcode -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                SKU Code
              </label>
              <input
                v-model="form.sku"
                type="text"
                placeholder="e.g. COF-001"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Barcode
              </label>
              <input
                v-model="form.barcode"
                type="text"
                placeholder="e.g. 885123456789"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          <!-- Stock & Tax Rate -->
          <div class="grid grid-cols-2 gap-3">
            <div v-if="formTracksStock">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Stock Quantity
              </label>
              <input
                v-model.number="form.stock_quantity"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tax Rate (%)
              </label>
              <input
                v-model.number="form.tax_rate"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          <!-- Availability Toggle -->
          <div class="flex items-center justify-between pt-1">
            <span class="text-[12.5px] font-medium text-slate-700">Available on POS Menu</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="form.is_available" type="checkbox" class="sr-only peer" />
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>

        <div class="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="closeProductModal"
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitProduct"
            :disabled="isSaving"
            class="px-5 py-2 rounded-lg bg-teal-600 text-white font-semibold text-[13px] hover:bg-teal-700 disabled:opacity-60 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RefreshCw v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stock Modal -->
    <div
      v-if="stockEditProduct"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="stockEditProduct = null"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[15px] font-bold text-slate-800">Quick Adjust Stock</h3>
          <button
            @click="stockEditProduct = null"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <p class="text-[12.5px] font-semibold text-teal-700 mb-1">{{ stockEditProduct.name }}</p>
        <p class="text-[11.5px] text-slate-400 mb-3">
          Update the current in-store inventory level for this product.
        </p>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            New Quantity
          </label>
          <input
            v-model.number="stockValue"
            type="number"
            min="0"
            class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            @click="stockEditProduct = null"
            class="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            @click="saveStock"
            :disabled="isSavingStock"
            class="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold text-[12.5px] hover:bg-teal-700 disabled:opacity-60 shadow-sm"
          >
            {{ isSavingStock ? 'Saving...' : 'Update Stock' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="productToDelete"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="productToDelete = null"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div class="flex items-center gap-3 mb-3 text-rose-600">
          <div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 class="text-[15px] font-bold text-slate-800">Delete Product</h3>
            <p class="text-[11.5px] text-slate-400">Confirmation required</p>
          </div>
        </div>
        <p class="text-[13px] text-slate-600 mb-4">
          Are you sure you want to delete
          <span class="font-bold text-slate-800">"{{ productToDelete.name }}"</span>?
          If it has past orders, it will be safely deactivated from the catalog.
        </p>
        <div class="flex items-center justify-end gap-2">
          <button
            @click="productToDelete = null"
            class="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            @click="handleDeleteProduct"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-[12.5px] hover:bg-rose-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>
  </AppSidebarShell>
</template>
