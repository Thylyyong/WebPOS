<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useCatalogStore } from '../../stores/catalog.store';
import { useUiStore } from '../../stores/ui.store';
import type { Product } from '../../types/pos.types';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Package, 
  DollarSign, 
  Tag, 
  Layers, 
  Barcode, 
  AlertTriangle 
} from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
  product?: Product | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', product: Product): void;
  (e: 'deleted', productId: string): void;
}>();

const catalogStore = useCatalogStore();
const uiStore = useUiStore();

const isSubmitting = ref(false);
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  name: '',
  category_id: '',
  price: 0,
  cost: 0,
  tax_rate: 10,
  stock_quantity: 100,
  sku: '',
  barcode: '',
  description: '',
  is_available: true,
  image_path: '',
});

const isEdit = computed(() => !!props.product);

watch(() => props.show, (newVal) => {
  if (newVal) {
    initForm();
  }
});

watch(() => props.product, () => {
  if (props.show) {
    initForm();
  }
});

function initForm() {
  selectedFile.value = null;
  showDeleteConfirm.value = false;

  if (props.product) {
    form.name = props.product.name;
    form.category_id = props.product.category_id;
    form.price = props.product.price;
    form.cost = props.product.cost || 0;
    form.tax_rate = props.product.tax_rate ?? 10;
    form.stock_quantity = props.product.stock_quantity ?? 0;
    form.sku = props.product.sku || '';
    form.barcode = props.product.barcode || '';
    form.description = props.product.description || '';
    form.is_available = props.product.is_available !== false;
    form.image_path = props.product.image_path || '';
    previewUrl.value = props.product.image_url || props.product.image_path || null;
  } else {
    // New product defaults
    form.name = '';
    form.category_id = catalogStore.selectedCategoryId && catalogStore.selectedCategoryId !== 'all' 
      ? catalogStore.selectedCategoryId 
      : (catalogStore.categories[0]?.id || '');
    form.price = 0;
    form.cost = 0;
    form.tax_rate = 10;
    form.stock_quantity = 50;
    form.sku = '';
    form.barcode = '';
    form.description = '';
    form.is_available = true;
    form.image_path = '';
    previewUrl.value = null;
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (!file.type.startsWith('image/')) {
      uiStore.showToast('Please select a valid image file', 'error');
      return;
    }
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
}

function removeImage() {
  selectedFile.value = null;
  previewUrl.value = null;
  form.image_path = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function handleSubmit() {
  if (!form.name.trim()) {
    uiStore.showToast('Product name is required', 'warning');
    return;
  }
  if (!form.category_id) {
    uiStore.showToast('Please select a category', 'warning');
    return;
  }
  if (form.price < 0) {
    uiStore.showToast('Price cannot be negative', 'warning');
    return;
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('category_id', form.category_id);
    formData.append('price', String(form.price));
    formData.append('cost', String(form.cost || 0));
    formData.append('tax_rate', String(form.tax_rate || 0));
    formData.append('stock_quantity', String(form.stock_quantity || 0));
    formData.append('sku', form.sku ? form.sku.trim() : '');
    formData.append('barcode', form.barcode ? form.barcode.trim() : '');
    formData.append('description', form.description ? form.description.trim() : '');
    formData.append('is_available', form.is_available ? '1' : '0');

    if (selectedFile.value) {
      formData.append('image', selectedFile.value);
    } else if (form.image_path) {
      formData.append('image_path', form.image_path);
    } else {
      formData.append('image_path', '');
    }

    let savedProduct: Product;
    if (isEdit.value && props.product) {
      savedProduct = await catalogStore.editProduct(props.product.id, formData);
      uiStore.showToast(`Updated "${savedProduct.name}" successfully`, 'success');
    } else {
      savedProduct = await catalogStore.addProduct(formData);
      uiStore.showToast(`Added "${savedProduct.name}" to catalog`, 'success');
    }

    emit('saved', savedProduct);
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to save product', 'error');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!props.product) return;
  isDeleting.value = true;
  try {
    await catalogStore.removeProduct(props.product.id);
    uiStore.showToast(`Product "${props.product.name}" deleted`, 'success');
    emit('deleted', props.product.id);
    emit('close');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to delete product', 'error');
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>{{ isEdit ? 'Edit Product' : 'Add New Product' }}</span>
              <span v-if="isEdit" class="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {{ props.product?.id }}
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              {{ isEdit ? 'Update product details, image & pricing' : 'Create a new item in your store menu' }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable Form) -->
      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-5">
        <!-- Picture Upload Section -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ImageIcon class="w-3.5 h-3.5 text-emerald-400" />
            <span>Product Picture</span>
          </label>

          <div class="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <!-- Thumbnail Preview Box -->
            <div class="relative w-28 h-28 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 group">
              <img
                v-if="previewUrl"
                :src="previewUrl"
                alt="Product Preview"
                class="w-full h-full object-cover"
              />
              <div v-else class="flex flex-col items-center justify-center text-slate-600">
                <ImageIcon class="w-8 h-8 mb-1" />
                <span class="text-[10px] font-semibold">No Image</span>
              </div>

              <!-- Overlay delete button if image exists -->
              <button
                v-if="previewUrl"
                type="button"
                @click="removeImage"
                class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-rose-400 transition"
                title="Remove Image"
              >
                <Trash2 class="w-5 h-5 mb-0.5" />
                <span class="text-[10px] font-bold">Remove</span>
              </button>
            </div>

            <!-- Upload Controls & Guidelines -->
            <div class="flex-1 flex flex-col gap-2 w-full text-center sm:text-left">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileChange"
                class="hidden"
                id="product-image-input"
              />
              <div class="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <label
                  for="product-image-input"
                  class="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
                >
                  <UploadCloud class="w-4 h-4 text-emerald-400" />
                  <span>{{ previewUrl ? 'Change Picture' : 'Upload Picture' }}</span>
                </label>

                <button
                  v-if="previewUrl"
                  type="button"
                  @click="removeImage"
                  class="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/40 transition"
                >
                  Clear Picture
                </button>
              </div>

              <p class="text-[11px] text-slate-500 leading-relaxed">
                PNG, JPG, WEBP up to 5MB. Stored directly on backend server and delivered via high-speed cache.
              </p>
            </div>
          </div>
        </div>

        <!-- Name & Category Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Product Name -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag class="w-3.5 h-3.5 text-emerald-400" />
              <span>Product Name <span class="text-rose-400">*</span></span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Vanilla Cold Brew Latte"
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <!-- Category Select -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-cyan-400" />
              <span>Category <span class="text-rose-400">*</span></span>
            </label>
            <select
              v-model="form.category_id"
              required
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option disabled value="">Select Category</option>
              <option
                v-for="cat in catalogStore.categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Price, Cost & Tax Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Retail Price -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-emerald-400" />
              <span>Selling Price ($) <span class="text-rose-400">*</span></span>
            </label>
            <input
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              required
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <!-- Cost (COGS) -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-amber-400" />
              <span>Cost (COGS $)</span>
            </label>
            <input
              v-model.number="form.cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <!-- Tax Rate -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sales Tax (%)
            </label>
            <input
              v-model.number="form.tax_rate"
              type="number"
              step="0.1"
              min="0"
              placeholder="10"
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <!-- Inventory Stock & Codes -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Stock Quantity -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stock Quantity
            </label>
            <input
              v-model.number="form.stock_quantity"
              type="number"
              min="0"
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <!-- SKU -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400">
              SKU Code
            </label>
            <input
              v-model="form.sku"
              type="text"
              placeholder="e.g. COF-009"
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition uppercase"
            />
          </div>

          <!-- Barcode -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Barcode class="w-3.5 h-3.5 text-purple-400" />
              <span>Barcode (Scan)</span>
            </label>
            <input
              v-model="form.barcode"
              type="text"
              placeholder="e.g. 200009"
              class="h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Description / Kitchen Recipe Notes
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Special ingredients, allergens, or preparation instructions..."
            class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none"
          />
        </div>

        <!-- Availability Switch -->
        <div class="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div>
            <span class="text-xs font-bold text-white block">Active & Available for Ordering</span>
            <span class="text-[11px] text-slate-400">Toggle off to hide from POS terminal menu without deleting</span>
          </div>

          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="form.is_available" class="sr-only peer" />
            <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </form>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        <!-- Delete Button (Only in edit mode) -->
        <div>
          <button
            v-if="isEdit && !showDeleteConfirm"
            type="button"
            @click="showDeleteConfirm = true"
            class="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition border border-transparent hover:border-rose-800/40"
          >
            <Trash2 class="w-4 h-4" />
            <span>Delete Product</span>
          </button>

          <!-- Delete Confirmation Pill -->
          <div v-if="isEdit && showDeleteConfirm" class="flex items-center gap-2 bg-rose-950/60 border border-rose-800 p-1.5 rounded-xl">
            <span class="text-[11px] text-rose-200 font-semibold px-2">Confirm?</span>
            <button
              type="button"
              @click="handleDelete"
              :disabled="isDeleting"
              class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
            >
              {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
            </button>
            <button
              type="button"
              @click="showDeleteConfirm = false"
              class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Cancel & Save Buttons -->
        <div class="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition disabled:opacity-50"
          >
            <Check class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Product') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
