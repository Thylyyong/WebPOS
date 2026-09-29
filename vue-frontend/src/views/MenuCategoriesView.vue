<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppSidebarShell from '../components/common/AppSidebarShell.vue';
import { catalogApi } from '../api/catalog.api';
import { useUiStore } from '../stores/ui.store';
import type { Category, Subcategory } from '../types/pos.types';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  FolderTree,
  AlertTriangle,
  X,
  Search,
  Check,
} from 'lucide-vue-next';

const uiStore = useUiStore();
const categories = ref<Category[]>([]);
const isLoading = ref(false);
const search = ref('');
const expanded = ref<Record<string, boolean>>({});

const colorPalette = [
  '#0D9488', // Teal
  '#059669', // Emerald
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#EA580C', // Orange
  '#D97706', // Amber
  '#475569', // Slate
];

async function load() {
  isLoading.value = true;
  try {
    const res = await catalogApi.getCategories();
    if (res.data.success) {
      categories.value = res.data.categories;
      for (const c of categories.value) {
        if (!(c.id in expanded.value)) expanded.value[c.id] = true;
      }
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to load categories', 'error');
  } finally {
    isLoading.value = false;
  }
}
onMounted(load);

const filteredCategories = computed(() => {
  if (!search.value.trim()) return categories.value;
  const q = search.value.toLowerCase();
  return categories.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.subcategories || []).some((s) => s.name.toLowerCase().includes(q))
  );
});

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id];
}

function letterFor(name: string) {
  return name.trim().charAt(0).toUpperCase() || '•';
}

/* ---------------- Category Modal (Add & Edit) ---------------- */
const showCategoryModal = ref(false);
const isEditingCategory = ref(false);
const editingCategoryId = ref<string | null>(null);
const categoryForm = ref({
  name: '',
  color_hex: '#0D9488',
});
const isSavingCategory = ref(false);

function openAddCategory() {
  isEditingCategory.value = false;
  editingCategoryId.value = null;
  categoryForm.value = {
    name: '',
    color_hex: '#0D9488',
  };
  showCategoryModal.value = true;
}

function openEditCategory(cat: Category) {
  isEditingCategory.value = true;
  editingCategoryId.value = cat.id;
  categoryForm.value = {
    name: cat.name,
    color_hex: cat.color_hex || '#0D9488',
  };
  showCategoryModal.value = true;
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) {
    uiStore.showToast('Category name is required', 'warning');
    return;
  }

  isSavingCategory.value = true;
  try {
    if (isEditingCategory.value && editingCategoryId.value) {
      const res = await catalogApi.updateCategory(editingCategoryId.value, {
        name: categoryForm.value.name.trim(),
        color_hex: categoryForm.value.color_hex,
      });
      if (res.data.success) {
        uiStore.showToast(res.data.message || 'Category updated successfully', 'success');
        showCategoryModal.value = false;
        await load();
      }
    } else {
      const res = await catalogApi.createCategory({
        name: categoryForm.value.name.trim(),
        color_hex: categoryForm.value.color_hex,
      });
      if (res.data.success) {
        uiStore.showToast(res.data.message || 'Category created successfully', 'success');
        showCategoryModal.value = false;
        await load();
      }
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to save category', 'error');
  } finally {
    isSavingCategory.value = false;
  }
}

/* ---------------- Category Delete ---------------- */
const categoryToDelete = ref<Category | null>(null);
const isDeletingCategory = ref(false);

function confirmDeleteCategory(cat: Category) {
  categoryToDelete.value = cat;
}

async function handleDeleteCategory() {
  if (!categoryToDelete.value) return;
  isDeletingCategory.value = true;
  try {
    const res = await catalogApi.deleteCategory(categoryToDelete.value.id);
    if (res.data.success) {
      uiStore.showToast(res.data.message || 'Category deleted successfully', 'success');
      categoryToDelete.value = null;
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to delete category', 'error');
  } finally {
    isDeletingCategory.value = false;
  }
}

/* ---------------- Subcategory Modal (Add) ---------------- */
const targetCategoryForSub = ref<Category | null>(null);
const subcategoryName = ref('');
const isSavingSubcategory = ref(false);

function openAddSubcategory(cat: Category) {
  targetCategoryForSub.value = cat;
  subcategoryName.value = '';
}

async function saveSubcategory() {
  if (!targetCategoryForSub.value) return;
  if (!subcategoryName.value.trim()) {
    uiStore.showToast('Subcategory name is required', 'warning');
    return;
  }

  isSavingSubcategory.value = true;
  try {
    const res = await catalogApi.createSubcategory(targetCategoryForSub.value.id, {
      name: subcategoryName.value.trim(),
    });
    if (res.data.success) {
      uiStore.showToast(res.data.message || 'Subcategory added successfully', 'success');
      expanded.value[targetCategoryForSub.value.id] = true;
      targetCategoryForSub.value = null;
      subcategoryName.value = '';
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to add subcategory', 'error');
  } finally {
    isSavingSubcategory.value = false;
  }
}

/* ---------------- Subcategory Delete ---------------- */
const subcategoryToDelete = ref<{ id: string; name: string } | null>(null);
const isDeletingSubcategory = ref(false);

function confirmDeleteSubcategory(sub: Subcategory) {
  subcategoryToDelete.value = { id: sub.id, name: sub.name };
}

async function handleDeleteSubcategory() {
  if (!subcategoryToDelete.value) return;
  isDeletingSubcategory.value = true;
  try {
    const res = await catalogApi.deleteSubcategory(subcategoryToDelete.value.id);
    if (res.data.success) {
      uiStore.showToast(res.data.message || 'Subcategory removed successfully', 'success');
      subcategoryToDelete.value = null;
      await load();
    }
  } catch (err: any) {
    uiStore.showToast(err?.response?.data?.message || 'Failed to delete subcategory', 'error');
  } finally {
    isDeletingSubcategory.value = false;
  }
}
</script>

<template>
  <AppSidebarShell>
    <template #title>Menu &amp; Categories</template>
    <template #subtitle>Organize catalog menu categories and subcategories</template>
    <template #actions>
      <div class="relative w-64 hidden sm:block">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="text"
          placeholder="Search categories..."
          class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
        />
      </div>
      <button
        @click="load"
        class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 bg-white transition-colors"
        title="Refresh categories"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="isLoading && 'animate-spin'" />
      </button>
      <button
        @click="openAddCategory"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Category
      </button>
    </template>

    <!-- Categories List -->
    <div class="space-y-3">
      <div
        v-for="cat in filteredCategories"
        :key="cat.id"
        class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all"
      >
        <div class="flex items-center gap-3">
          <!-- Category Badge / Initial -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-extrabold shrink-0 shadow-xs"
            :style="{ background: (cat.color_hex || '#0d9488') + '1c', color: cat.color_hex || '#0d9488' }"
          >
            {{ letterFor(cat.name) }}
          </div>

          <!-- Category Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[14px] font-bold text-slate-800 truncate">{{ cat.name }}</span>
              <span
                class="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                :style="{ background: cat.color_hex || '#0d9488' }"
                :title="cat.color_hex || '#0d9488'"
              ></span>
            </div>
            <div class="text-[11.5px] text-slate-400 mt-0.5">
              {{ (cat.subcategories || []).length }} subcategories · {{ cat.products_count ?? 0 }} items
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5">
            <button
              @click="openAddSubcategory(cat)"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
            >
              <Plus class="w-3.5 h-3.5" />
              Add Subcategory
            </button>
            <button
              @click="openEditCategory(cat)"
              class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-colors"
              title="Edit category"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              @click="confirmDeleteCategory(cat)"
              class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
              title="Delete category"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button
              @click="toggle(cat.id)"
              class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
              title="Expand/Collapse"
            >
              <ChevronUp v-if="expanded[cat.id]" class="w-3.5 h-3.5" />
              <ChevronDown v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Subcategories List -->
        <div v-if="expanded[cat.id]" class="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-slate-100">
          <span
            v-for="sub in cat.subcategories"
            :key="sub.id"
            class="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span>{{ sub.name }}</span>
            <button
              @click="confirmDeleteSubcategory(sub)"
              class="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
              title="Delete subcategory"
            >
              <X class="w-3 h-3" />
            </button>
          </span>
          <span v-if="!(cat.subcategories || []).length" class="text-[12px] text-slate-400 py-1">
            No subcategories yet.
          </span>
          <button
            @click="openAddSubcategory(cat)"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-[11.5px] font-medium text-slate-500 hover:border-teal-500 hover:text-teal-600 transition-colors"
          >
            <Plus class="w-3 h-3" /> Add Subcategory
          </button>
        </div>
      </div>

      <div v-if="!filteredCategories.length && !isLoading" class="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
        <FolderTree class="w-8 h-8 mx-auto text-slate-300 mb-2" />
        No categories found.
      </div>
    </div>

    <!-- Category Modal: Add & Edit -->
    <div
      v-if="showCategoryModal"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="showCategoryModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 class="text-[15px] font-bold text-slate-800">
            {{ isEditingCategory ? 'Edit Category' : 'Add Category' }}
          </h3>
          <button
            @click="showCategoryModal = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3.5">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Category Name *
            </label>
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="e.g. Specialty Coffee"
              class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              @keydown.enter="saveCategory"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Theme Color
            </label>
            <div class="flex items-center gap-2 mb-2">
              <button
                v-for="color in colorPalette"
                :key="color"
                type="button"
                @click="categoryForm.color_hex = color"
                class="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                :style="{ background: color }"
              >
                <Check v-if="categoryForm.color_hex.toLowerCase() === color.toLowerCase()" class="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="categoryForm.color_hex"
                type="text"
                placeholder="#0D9488"
                class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <input
                v-model="categoryForm.color_hex"
                type="color"
                class="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
              />
            </div>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            @click="showCategoryModal = false"
            class="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveCategory"
            :disabled="isSavingCategory"
            class="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold text-[12.5px] hover:bg-teal-700 disabled:opacity-60 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RefreshCw v-if="isSavingCategory" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSavingCategory ? 'Saving...' : isEditingCategory ? 'Save Changes' : 'Create Category' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Subcategory Modal: Add -->
    <div
      v-if="targetCategoryForSub"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="targetCategoryForSub = null"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 class="text-[15px] font-bold text-slate-800">Add Subcategory</h3>
            <p class="text-[11.5px] text-slate-400 mt-0.5">
              Adding to: <span class="font-semibold text-teal-700">{{ targetCategoryForSub.name }}</span>
            </p>
          </div>
          <button
            @click="targetCategoryForSub = null"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Subcategory Name *
            </label>
            <input
              v-model="subcategoryName"
              type="text"
              placeholder="e.g. Hot Drinks, Cold Brew"
              class="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              @keydown.enter="saveSubcategory"
            />
          </div>
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            @click="targetCategoryForSub = null"
            class="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            @click="saveSubcategory"
            :disabled="isSavingSubcategory"
            class="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold text-[12.5px] hover:bg-teal-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw v-if="isSavingSubcategory" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSavingSubcategory ? 'Adding...' : 'Add Subcategory' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Category Delete Confirmation -->
    <div
      v-if="categoryToDelete"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="categoryToDelete = null"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div class="flex items-center gap-3 mb-3 text-rose-600">
          <div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 class="text-[15px] font-bold text-slate-800">Delete Category</h3>
            <p class="text-[11.5px] text-slate-400">Confirmation required</p>
          </div>
        </div>
        <p class="text-[13px] text-slate-600 mb-4">
          Are you sure you want to delete category
          <span class="font-bold text-slate-800">"{{ categoryToDelete.name }}"</span>?
          Categories containing existing menu products cannot be deleted.
        </p>
        <div class="flex items-center justify-end gap-2">
          <button
            @click="categoryToDelete = null"
            class="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            @click="handleDeleteCategory"
            :disabled="isDeletingCategory"
            class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-[12.5px] hover:bg-rose-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw v-if="isDeletingCategory" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingCategory ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Subcategory Delete Confirmation -->
    <div
      v-if="subcategoryToDelete"
      class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="subcategoryToDelete = null"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div class="flex items-center gap-3 mb-3 text-rose-600">
          <div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 class="text-[15px] font-bold text-slate-800">Remove Subcategory</h3>
            <p class="text-[11.5px] text-slate-400">Confirmation required</p>
          </div>
        </div>
        <p class="text-[13px] text-slate-600 mb-4">
          Are you sure you want to remove subcategory
          <span class="font-bold text-slate-800">"{{ subcategoryToDelete.name }}"</span>?
        </p>
        <div class="flex items-center justify-end gap-2">
          <button
            @click="subcategoryToDelete = null"
            class="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            @click="handleDeleteSubcategory"
            :disabled="isDeletingSubcategory"
            class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-[12.5px] hover:bg-rose-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw v-if="isDeletingSubcategory" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingSubcategory ? 'Removing...' : 'Yes, Remove' }}</span>
          </button>
        </div>
      </div>
    </div>
  </AppSidebarShell>
</template>
