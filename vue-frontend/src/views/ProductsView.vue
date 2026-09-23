<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import { catalogApi } from '../api/catalog.api';
import { useUiStore } from '../stores/ui.store';
import type { Category, Product } from '../types/pos.types';
import { Plus, Search, Pencil, Trash2, RefreshCw, X, Package } from 'lucide-vue-next';

const uiStore = useUiStore();
const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const isLoading = ref(false);
const search = ref('');
const activeCategory = ref<string>('all');

async function load() {
  isLoading.value = true;
  try {
    const [catRes, prodRes] = await Promise.all([catalogApi.getCategories(), catalogApi.getProducts()]);
    if (catRes.data.success) categories.value = catRes.data.categories;
    if (prodRes.data.success) products.value = prodRes.data.products;
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to load products', 'error');
  } finally {
    isLoading.value = false;
  }
}
onMounted(load);

const filtered = computed(() => {
  let list = products.value;
  if (activeCategory.value !== 'all') list = list.filter(p => p.category_id === activeCategory.value);
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
  }
  return list;
});

function categoryPath(p: Product) {
  const cat = categories.value.find(c => c.id === p.category_id);
  const sub = cat?.subcategories?.find(s => s.id === p.subcategory_id);
  return [cat?.name, sub?.name].filter(Boolean).join(' › ');
}

/* ---------------- Add Product (real, backed by POST /catalog/products) ---------------- */
const showAddModal = ref(false);
const isSaving = ref(false);
const form = ref({
  name: '',
  category_id: '',
  subcategory_id: '',
  price: 0,
  cost: 0,
  sku: '',
  barcode: '',
  stock_quantity: 0,
  tax_rate: 10
});

const formSubcategories = computed(() => categories.value.find(c => c.id === form.value.category_id)?.subcategories || []);

function openAdd() {
  form.value = { name: '', category_id: categories.value[0]?.id || '', subcategory_id: '', price: 0, cost: 0, sku: '', barcode: '', stock_quantity: 0, tax_rate: 10 };
  showAddModal.value = true;
}

async function submitAdd() {
  if (!form.value.name || !form.value.category_id || form.value.price <= 0) {
    uiStore.showToast('Name, category and a price above 0 are required', 'warning');
    return;
  }
  isSaving.value = true;
  try {
    const res = await catalogApi.createProduct({
      name: form.value.name,
      category_id: form.value.category_id,
      subcategory_id: form.value.subcategory_id || null,
      price: Number(form.value.price),
      cost: Number(form.value.cost) || 0,
      sku: form.value.sku || undefined,
      barcode: form.value.barcode || undefined,
      stock_quantity: Number(form.value.stock_quantity) || 0,
      tax_rate: Number(form.value.tax_rate) || 0
    });
    if (res.data.success) {
      uiStore.showToast('Product added to catalog', 'success');
      showAddModal.value = false;
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to add product', 'error');
  } finally {
    isSaving.value = false;
  }
}

/* ---------------- Stock edit (real, backed by PATCH /catalog/products/{id}/stock) ---------------- */
const stockEditProduct = ref<Product | null>(null);
const stockValue = ref(0);

function openStockEdit(p: Product) {
  stockEditProduct.value = p;
  stockValue.value = p.stock_quantity;
}

async function saveStock() {
  if (!stockEditProduct.value) return;
  try {
    const res = await catalogApi.updateStock(stockEditProduct.value.id, Number(stockValue.value));
    if (res.data.success) {
      uiStore.showToast('Stock updated', 'success');
      stockEditProduct.value = null;
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to update stock', 'error');
  }
}

// The backend has no delete-product route — only creation and a stock
// PATCH exist, so full edit / delete stay disabled rather than faked.
function deleteNotSupported() {
  uiStore.showToast('Deleting products needs a backend endpoint that does not exist yet.', 'warning');
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Product &amp; SKU Catalog</template>
    <template #subtitle>Manage menu items, prices, barcodes and stock</template>
    <template #actions>
      <div class="relative w-64 hidden sm:block">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input v-model="search" type="text" placeholder="Search items..." class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
      </div>
      <button @click="load" class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh">
        <RefreshCw class="w-3.5 h-3.5" :class="isLoading && 'animate-spin'" />
      </button>
      <button @click="openAdd" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-teal-600 text-white hover:bg-teal-700">
        <Plus class="w-3.5 h-3.5" />
        Add Product
      </button>
    </template>

    <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
      <button
        @click="activeCategory = 'all'"
        class="px-3 py-1.5 rounded-lg text-[12px] font-semibold border shrink-0"
        :class="activeCategory === 'all' ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
      >All Items</button>
      <button
        v-for="c in categories"
        :key="c.id"
        @click="activeCategory = c.id"
        class="px-3 py-1.5 rounded-lg text-[12px] font-semibold border shrink-0"
        :class="activeCategory === c.id ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
      >{{ c.name }}</button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
      <div v-for="p in filtered" :key="p.id" class="flex items-center gap-4 px-4 py-3">
        <div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
          <Package class="w-4 h-4 text-slate-300" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-bold text-slate-800 truncate">{{ p.name }}</div>
          <div class="text-[11px] text-slate-400 truncate">SKU: {{ p.sku || '—' }} · {{ categoryPath(p) }}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-[13.5px] font-bold text-slate-800">${{ Number(p.price).toFixed(2) }}</div>
          <div class="text-[10.5px] text-slate-400">Cost: ${{ Number(p.cost).toFixed(2) }}</div>
        </div>
        <span
          class="px-2 py-1 rounded-md text-[10.5px] font-bold shrink-0"
          :class="p.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
        >{{ p.stock_quantity > 0 ? 'IN STOCK' : 'OUT OF STOCK' }}</span>
        <button @click="openStockEdit(p)" class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 shrink-0" title="Edit stock">
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button @click="deleteNotSupported" class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 shrink-0" title="Delete (unsupported)">
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
      <div v-if="!filtered.length && !isLoading" class="text-center py-12 text-slate-400 text-sm">No products found.</div>
    </div>

    <!-- Add Product Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" @click.self="showAddModal = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[15px] font-bold text-slate-800">Add Product</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600"><X class="w-4 h-4" /></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-semibold text-slate-500">Name *</label>
            <input v-model="form.name" type="text" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Category *</label>
              <select v-model="form.category_id" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]">
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Subcategory</label>
              <select v-model="form.subcategory_id" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]">
                <option value="">None</option>
                <option v-for="s in formSubcategories" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Price *</label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Cost (COGS)</label>
              <input v-model.number="form.cost" type="number" min="0" step="0.01" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-semibold text-slate-500">SKU</label>
              <input v-model="form.sku" type="text" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Barcode</label>
              <input v-model="form.barcode" type="text" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Stock Qty</label>
              <input v-model.number="form.stock_quantity" type="number" min="0" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500">Tax Rate %</label>
              <input v-model.number="form.tax_rate" type="number" min="0" step="0.1" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
            </div>
          </div>
        </div>
        <button
          @click="submitAdd"
          :disabled="isSaving"
          class="w-full mt-5 py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-[13px] hover:bg-teal-700 disabled:opacity-60"
        >{{ isSaving ? 'Saving...' : 'Add to Catalog' }}</button>
      </div>
    </div>

    <!-- Stock Edit Modal -->
    <div v-if="stockEditProduct" class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" @click.self="stockEditProduct = null">
      <div class="bg-white rounded-2xl w-full max-w-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[15px] font-bold text-slate-800">Update Stock</h3>
          <button @click="stockEditProduct = null" class="text-slate-400 hover:text-slate-600"><X class="w-4 h-4" /></button>
        </div>
        <p class="text-[12px] text-slate-500 mb-3">{{ stockEditProduct.name }}</p>
        <p class="text-[10.5px] text-slate-400 mb-3">
          Only stock quantity can be changed here — the backend does not expose an endpoint to edit a product's
          name, price or other fields after creation.
        </p>
        <input v-model.number="stockValue" type="number" min="0" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px]" />
        <button @click="saveStock" class="w-full mt-4 py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-[13px] hover:bg-teal-700">Save</button>
      </div>
    </div>
  </AppSidebarShell>
</template>
