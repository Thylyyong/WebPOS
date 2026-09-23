<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { settingsApi } from '../api/settings.api';
import { roleApi } from '../api/role.api';
import { useCatalogStore } from '../stores/catalog.store';
import { useUiStore } from '../stores/ui.store';
import AppHeader from '../components/common/AppHeader.vue';
import ProductModal from '../components/pos/ProductModal.vue';
import { 
  Settings, 
  Save, 
  Store, 
  Receipt, 
  Sliders, 
  Users, 
  ShieldCheck, 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  KeyRound, 
  Search, 
  Image as ImageIcon 
} from 'lucide-vue-next';
import type { StoreSettings, RoleDefinition, StaffAccount, Product } from '../types/pos.types';

const uiStore = useUiStore();
const catalogStore = useCatalogStore();

// Tab state
type ActiveTab = 'store' | 'roles' | 'products';
const activeTab = ref<ActiveTab>('store');

// Store Settings Form
const settings = ref<StoreSettings>({
  store_name: 'OmniPOS Bistro',
  store_address: '124 Grand Avenue, Suite 400',
  store_phone: '+1 (555) 019-2834',
  store_email: 'contact@omnipos-bistro.com',
  currency_symbol: '$',
  default_tax_rate: '10',
  receipt_header: 'Welcome to OmniPOS Bistro!',
  receipt_footer: 'Thank you for dining with us! Please come again.'
});
const isSaving = ref(false);

// Roles & Staff State
const rolesList = ref<RoleDefinition[]>([]);
const staffList = ref<StaffAccount[]>([]);
const isLoadingRoles = ref(false);

// Role Creation Modal
const showCreateRoleModal = ref(false);
const roleForm = reactive({
  name: '',
  code: '',
  description: '',
  permissions: ['pos', 'tables'] as string[]
});
const isCreatingRole = ref(false);

// Staff Creation Modal
const showCreateStaffModal = ref(false);
const editingStaff = ref<StaffAccount | null>(null);
const staffForm = reactive({
  name: '',
  username: '',
  pin_code: '',
  role: 'CASHIER',
  branch_id: 'store_main'
});
const isSavingStaff = ref(false);

// Product Catalog Management State
const productSearch = ref('');
const productCategoryFilter = ref('all');
const showProductModal = ref(false);
const selectedProduct = ref<Product | null>(null);

const filteredProducts = computed(() => {
  let list = catalogStore.products;
  if (productCategoryFilter.value !== 'all') {
    list = list.filter(p => p.category_id === productCategoryFilter.value);
  }
  if (productSearch.value.trim()) {
    const q = productSearch.value.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }
  return list;
});

onMounted(async () => {
  loadStoreSettings();
  loadRolesAndStaff();
  catalogStore.fetchCatalog();
});

async function loadStoreSettings() {
  try {
    const res = await settingsApi.getSettings();
    if (res.data.success && res.data.settings) {
      settings.value = { ...settings.value, ...res.data.settings };
    }
  } catch (_) {}
}

async function loadRolesAndStaff() {
  isLoadingRoles.value = true;
  try {
    const [rolesRes, staffRes] = await Promise.all([
      roleApi.getRoles(),
      roleApi.getStaff()
    ]);
    if (rolesRes.data.success) {
      rolesList.value = rolesRes.data.roles;
    }
    if (staffRes.data.success) {
      staffList.value = staffRes.data.staff;
    }
  } catch (err: any) {
    uiStore.showToast('Failed to load roles and staff data', 'error');
  } finally {
    isLoadingRoles.value = false;
  }
}

async function saveSettings() {
  isSaving.value = true;
  try {
    await settingsApi.updateSettings(settings.value);
    uiStore.showToast('Store settings saved successfully', 'success');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to save settings', 'error');
  } finally {
    isSaving.value = false;
  }
}

// Role handlers
function openCreateRoleModal() {
  roleForm.name = '';
  roleForm.code = '';
  roleForm.description = '';
  roleForm.permissions = ['pos', 'tables'];
  showCreateRoleModal.value = true;
}

function togglePermission(perm: string) {
  const idx = roleForm.permissions.indexOf(perm);
  if (idx > -1) {
    roleForm.permissions.splice(idx, 1);
  } else {
    roleForm.permissions.push(perm);
  }
}

async function handleCreateRole() {
  if (!roleForm.name.trim() || !roleForm.code.trim()) {
    uiStore.showToast('Role Name and Code are required', 'warning');
    return;
  }
  isCreatingRole.value = true;
  try {
    const res = await roleApi.createRole({
      name: roleForm.name.trim(),
      code: roleForm.code.trim(),
      description: roleForm.description.trim(),
      permissions: roleForm.permissions
    });
    uiStore.showToast(`Role "${res.data.role?.name}" created successfully!`, 'success');
    showCreateRoleModal.value = false;
    await loadRolesAndStaff();
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.message || err.message || 'Failed to create role', 'error');
  } finally {
    isCreatingRole.value = false;
  }
}

async function handleDeleteRole(role: RoleDefinition) {
  if (role.is_system) {
    uiStore.showToast('System roles cannot be deleted', 'warning');
    return;
  }
  if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
  try {
    await roleApi.deleteRole(role.id);
    uiStore.showToast(`Role "${role.name}" removed`, 'success');
    await loadRolesAndStaff();
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.message || err.message || 'Failed to delete role', 'error');
  }
}

// Staff handlers
function openCreateStaffModal() {
  editingStaff.value = null;
  staffForm.name = '';
  staffForm.username = '';
  staffForm.pin_code = '';
  staffForm.role = rolesList.value[0]?.code || 'CASHIER';
  staffForm.branch_id = 'store_main';
  showCreateStaffModal.value = true;
}

function openEditStaffModal(staff: StaffAccount) {
  editingStaff.value = staff;
  staffForm.name = staff.name;
  staffForm.username = staff.username;
  staffForm.pin_code = staff.pin_code;
  staffForm.role = staff.role;
  staffForm.branch_id = staff.branch_id || 'store_main';
  showCreateStaffModal.value = true;
}

async function handleSaveStaff() {
  if (!staffForm.name.trim() || !staffForm.username.trim() || !staffForm.pin_code.trim()) {
    uiStore.showToast('Name, username, and PIN are required', 'warning');
    return;
  }
  isSavingStaff.value = true;
  try {
    if (editingStaff.value) {
      await roleApi.updateStaff(editingStaff.value.id, {
        name: staffForm.name.trim(),
        username: staffForm.username.trim(),
        pin_code: staffForm.pin_code.trim(),
        role: staffForm.role,
        branch_id: staffForm.branch_id
      });
      uiStore.showToast(`Staff member "${staffForm.name}" updated`, 'success');
    } else {
      await roleApi.createStaff({
        name: staffForm.name.trim(),
        username: staffForm.username.trim(),
        pin_code: staffForm.pin_code.trim(),
        role: staffForm.role,
        branch_id: staffForm.branch_id
      });
      uiStore.showToast(`Staff member "${staffForm.name}" created`, 'success');
    }
    showCreateStaffModal.value = false;
    await loadRolesAndStaff();
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.message || err.message || 'Failed to save staff member', 'error');
  } finally {
    isSavingStaff.value = false;
  }
}

async function handleDeleteStaff(staff: StaffAccount) {
  if (!confirm(`Are you sure you want to remove staff member "${staff.name}" (${staff.username})?`)) return;
  try {
    await roleApi.deleteStaff(staff.id);
    uiStore.showToast(`Staff account removed`, 'success');
    await loadRolesAndStaff();
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.message || err.message || 'Failed to remove staff member', 'error');
  }
}

// Product Catalog Handlers
function openAddProduct() {
  selectedProduct.value = null;
  showProductModal.value = true;
}

function openEditProduct(prod: Product) {
  selectedProduct.value = prod;
  showProductModal.value = true;
}

async function handleDeleteProduct(prod: Product) {
  if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) return;
  try {
    await catalogStore.removeProduct(prod.id);
    uiStore.showToast(`Product "${prod.name}" deleted`, 'success');
  } catch (err: any) {
    uiStore.showToast(err.message || 'Failed to delete product', 'error');
  }
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#090D16] overflow-hidden select-none">
    <AppHeader />

    <main class="flex-1 p-4 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col gap-6">
      <!-- Title & Navigation Tabs Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-black text-white flex items-center gap-2.5">
              <Settings class="w-6 h-6 text-emerald-400" />
              <span>Admin & Store Management</span>
            </h2>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Boss / Admin
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Control business settings, provision custom roles & staff, and manage menu catalog.</p>
        </div>

        <!-- Tab Switcher Navigation Pills -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
          <button
            type="button"
            @click="activeTab = 'store'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2"
            :class="activeTab === 'store' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Store class="w-3.5 h-3.5" />
            <span>Store Profile</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'roles'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2"
            :class="activeTab === 'roles' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Users class="w-3.5 h-3.5" />
            <span>Staff & Roles</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'products'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2"
            :class="activeTab === 'products' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <Package class="w-3.5 h-3.5" />
            <span>Product Catalog</span>
          </button>
        </div>
      </div>

      <!-- ================= TAB 1: STORE PROFILE & HARDWARE SETTINGS ================= -->
      <div v-if="activeTab === 'store'" class="flex flex-col gap-6">
        <div class="flex justify-end">
          <button
            type="button"
            @click="saveSettings"
            :disabled="isSaving"
            class="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 text-xs font-bold transition disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            <span>{{ isSaving ? 'Saving...' : 'Save Settings' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Store Information -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
            <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
              <Store class="w-4 h-4 text-emerald-400" />
              <span>Store Identity & Contact</span>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Store Name</label>
              <input
                v-model="settings.store_name"
                type="text"
                class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Store Address</label>
              <input
                v-model="settings.store_address"
                type="text"
                class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Phone Number</label>
              <input
                v-model="settings.store_phone"
                type="text"
                class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                v-model="settings.store_email"
                type="email"
                class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- Tax & Currency Configuration -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
            <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
              <Sliders class="w-4 h-4 text-cyan-400" />
              <span>Taxes & Currency</span>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Currency Symbol</label>
              <input
                v-model="settings.currency_symbol"
                type="text"
                class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-slate-400">Default Sales Tax Rate (%)</label>
              <input
                v-model="settings.default_tax_rate"
                type="number"
                step="0.1"
                class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 mt-2">
              Tax is calculated automatically on order checkout: <strong class="text-slate-300">Subtotal × (Tax Rate / 100)</strong>.
            </div>
          </div>

          <!-- Receipt Customization -->
          <div class="md:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5">
            <div class="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
              <Receipt class="w-4 h-4 text-amber-400" />
              <span>Thermal Receipt Template Format</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-slate-400">Receipt Header Banner</label>
                <textarea
                  v-model="settings.receipt_header"
                  rows="3"
                  class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-slate-400">Receipt Footer Thank You Message</label>
                <textarea
                  v-model="settings.receipt_footer"
                  rows="3"
                  class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: STAFF & ROLE PROVISIONING ================= -->
      <div v-else-if="activeTab === 'roles'" class="flex flex-col gap-6">
        <!-- Roles Section -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck class="w-5 h-5 text-amber-400" />
                <span>Defined Roles & Permissions</span>
              </h3>
              <p class="text-xs text-slate-400">System and custom role definitions with granular capabilities.</p>
            </div>

            <button
              type="button"
              @click="openCreateRoleModal"
              class="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Plus class="w-4 h-4" />
              <span>Create New Role</span>
            </button>
          </div>

          <!-- Roles Grid Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div
              v-for="role in rolesList"
              :key="role.id"
              class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <h4 class="text-sm font-bold text-white">{{ role.name }}</h4>
                  <span
                    class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border"
                    :class="role.is_system ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'"
                  >
                    {{ role.code }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 line-clamp-2 mb-3">
                  {{ role.description || 'No description provided.' }}
                </p>

                <!-- Permissions Tags -->
                <div class="flex flex-wrap gap-1 mb-2">
                  <span
                    v-for="perm in (role.permissions || [])"
                    :key="perm"
                    class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                  >
                    {{ perm }}
                  </span>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>{{ role.users_count || 0 }} staff assigned</span>
                <button
                  v-if="!role.is_system"
                  type="button"
                  @click="handleDeleteRole(role)"
                  class="text-rose-400 hover:text-rose-300 p-1 transition"
                  title="Delete Role"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Staff Accounts Section -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <Users class="w-5 h-5 text-emerald-400" />
                <span>Staff Member Accounts</span>
              </h3>
              <p class="text-xs text-slate-400">Users who can sign into POS terminals using their unique 4-digit PIN.</p>
            </div>

            <button
              type="button"
              @click="openCreateStaffModal"
              class="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Plus class="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <!-- Staff Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th class="p-3">Staff Name</th>
                  <th class="p-3">Username</th>
                  <th class="p-3">Assigned Role</th>
                  <th class="p-3">PIN Code</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="staff in staffList" :key="staff.id" class="hover:bg-slate-800/30 transition">
                  <td class="p-3 font-bold text-white flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-mono font-bold text-xs">
                      {{ staff.name.charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ staff.name }}</span>
                  </td>
                  <td class="p-3 font-mono text-slate-400">@{{ staff.username }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-200">
                      {{ staff.role_name || staff.role }}
                    </span>
                  </td>
                  <td class="p-3 font-mono text-emerald-400 font-bold">
                    {{ staff.pin_code }}
                  </td>
                  <td class="p-3">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold"
                      :class="staff.is_active ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20' : 'bg-rose-950/60 text-rose-300 border border-rose-500/20'"
                    >
                      {{ staff.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        @click="openEditStaffModal(staff)"
                        class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Edit Staff"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        @click="handleDeleteStaff(staff)"
                        class="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition"
                        title="Delete Staff"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================= TAB 3: PRODUCT CATALOG MANAGEMENT ================= -->
      <div v-else-if="activeTab === 'products'" class="flex flex-col gap-4">
        <!-- Catalog Action Bar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div class="flex items-center gap-2.5 flex-1">
            <!-- Search -->
            <div class="relative flex-1 max-w-sm">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="productSearch"
                type="text"
                placeholder="Search products by name, SKU, barcode..."
                class="w-full h-10 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <!-- Category Filter -->
            <select
              v-model="productCategoryFilter"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option v-for="cat in catalogStore.categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Add Product Button -->
          <button
            type="button"
            @click="openAddProduct"
            class="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        <!-- Products Table -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th class="p-3">Picture</th>
                <th class="p-3">Product Name & SKU</th>
                <th class="p-3">Category</th>
                <th class="p-3">Price</th>
                <th class="p-3">Cost (COGS)</th>
                <th class="p-3">Stock</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-for="prod in filteredProducts" :key="prod.id" class="hover:bg-slate-800/30 transition">
                <!-- Picture Thumbnail -->
                <td class="p-3">
                  <div class="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      v-if="prod.image_url || prod.image_path"
                      :src="prod.image_url || prod.image_path!"
                      :alt="prod.name"
                      class="w-full h-full object-cover"
                      @error="($event.target as HTMLElement).style.display = 'none'"
                    />
                    <ImageIcon v-else class="w-5 h-5 text-slate-600" />
                  </div>
                </td>

                <!-- Name & SKU -->
                <td class="p-3">
                  <div class="font-bold text-white text-sm">{{ prod.name }}</div>
                  <div class="text-[11px] font-mono text-slate-400 mt-0.5">
                    {{ prod.sku || 'No SKU' }} <span v-if="prod.barcode">• {{ prod.barcode }}</span>
                  </div>
                </td>

                <!-- Category -->
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {{ prod.category?.name || 'Unassigned' }}
                  </span>
                </td>

                <!-- Price -->
                <td class="p-3 font-mono font-bold text-emerald-400 text-sm">
                  ${{ prod.price.toFixed(2) }}
                </td>

                <!-- Cost -->
                <td class="p-3 font-mono text-slate-400">
                  ${{ (prod.cost || 0).toFixed(2) }}
                </td>

                <!-- Stock Quantity -->
                <td class="p-3">
                  <span
                    class="px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono"
                    :class="prod.stock_quantity > 10 ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/20' : 'bg-rose-950/50 text-rose-300 border-rose-500/20'"
                  >
                    {{ prod.stock_quantity }} in stock
                  </span>
                </td>

                <!-- Status -->
                <td class="p-3">
                  <span
                    class="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                    :class="prod.is_available ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-800 text-slate-400'"
                  >
                    {{ prod.is_available ? 'Active' : 'Hidden' }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="openEditProduct(prod)"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Edit Product"
                    >
                      <Edit2 class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteProduct(prod)"
                      class="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition"
                      title="Delete Product"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Create Role Modal -->
    <div
      v-if="showCreateRoleModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="showCreateRoleModal = false"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-amber-400" />
            <span>Create Custom Role</span>
          </h3>
          <button @click="showCreateRoleModal = false" class="text-slate-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleCreateRole" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Role Display Name *</label>
            <input
              v-model="roleForm.name"
              type="text"
              required
              placeholder="e.g. Master Barista"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Role Code Identifier *</label>
            <input
              v-model="roleForm.code"
              type="text"
              required
              placeholder="e.g. BARISTA"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Description</label>
            <textarea
              v-model="roleForm.description"
              rows="2"
              placeholder="Responsibilities and access scope..."
              class="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Enabled Modules / Permissions</label>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="perm in ['pos', 'tables', 'register', 'accounting', 'manage_products']"
                :key="perm"
                class="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="roleForm.permissions.includes(perm)"
                  @change="togglePermission(perm)"
                  class="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span class="capitalize">{{ perm.replace('_', ' ') }}</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              @click="showCreateRoleModal = false"
              class="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isCreatingRole"
              class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {{ isCreatingRole ? 'Creating...' : 'Create Role' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create/Edit Staff Modal -->
    <div
      v-if="showCreateStaffModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="showCreateStaffModal = false"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Users class="w-4 h-4 text-emerald-400" />
            <span>{{ editingStaff ? 'Edit Staff Member' : 'Add New Staff Member' }}</span>
          </h3>
          <button @click="showCreateStaffModal = false" class="text-slate-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSaveStaff" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Full Name *</label>
            <input
              v-model="staffForm.name"
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Username *</label>
            <input
              v-model="staffForm.username"
              type="text"
              required
              placeholder="e.g. alex"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">4-Digit Security PIN *</label>
            <input
              v-model="staffForm.pin_code"
              type="password"
              maxlength="8"
              required
              placeholder="e.g. 5555"
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-400">Assigned Role *</label>
            <select
              v-model="staffForm.role"
              required
              class="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option v-for="r in rolesList" :key="r.id" :value="r.code">
                {{ r.name }} ({{ r.code }})
              </option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              @click="showCreateStaffModal = false"
              class="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingStaff"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {{ isSavingStaff ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Create Staff') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Product Create/Edit Modal -->
    <ProductModal
      :show="showProductModal"
      :product="selectedProduct"
      @close="showProductModal = false"
    />
  </div>
</template>
