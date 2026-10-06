<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { UserPlus, KeyRound, RefreshCw } from 'lucide-vue-next';
import AppModal from '../common/AppModal.vue';
import { roleApi } from '../../api/role.api';
import { useUiStore } from '../../stores/ui.store';
import type { StaffAccount, RoleDefinition } from '../../types/pos.types';

const uiStore = useUiStore();

const staff = ref<StaffAccount[]>([]);
const roles = ref<RoleDefinition[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

// Add staff modal
const showAdd = ref(false);
const form = ref({ name: '', username: '', password: '', role: 'CASHIER' });

// Change password modal
const passwordTarget = ref<StaffAccount | null>(null);
const newPassword = ref('');

// Staff sign in with name/username + password. The backend stores it as the account's
// pin_code (4-8 characters), so that is the allowed length here too.
const isValidPassword = (v: string) => v.length >= 4 && v.length <= 8;

const roleOptions = computed(() => {
  if (roles.value.length) return roles.value.map((r) => ({ code: r.code, name: r.name }));
  return [{ code: 'CASHIER', name: 'Cashier' }];
});

function errorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  const firstValidation = data?.errors ? (Object.values(data.errors)[0] as string[])?.[0] : null;
  return firstValidation || data?.message || err?.message || fallback;
}

async function loadStaff() {
  isLoading.value = true;
  try {
    const res = await roleApi.getStaff();
    if (res.data.success) staff.value = res.data.staff;
  } catch (err: any) {
    uiStore.showToast(errorMessage(err, 'Failed to load staff'), 'error');
  } finally {
    isLoading.value = false;
  }
}

async function loadRoles() {
  try {
    const res = await roleApi.getRoles();
    if (res.data.success) roles.value = res.data.roles;
  } catch {
    /* falls back to the Cashier role */
  }
}

function openAdd() {
  form.value = { name: '', username: '', password: '', role: 'CASHIER' };
  showAdd.value = true;
}

async function submitAdd() {
  const f = form.value;
  if (!f.name.trim() || !f.username.trim()) {
    uiStore.showToast('Enter a staff name and username', 'warning');
    return;
  }
  if (!isValidPassword(f.password)) {
    uiStore.showToast('Password must be 4 to 8 characters', 'warning');
    return;
  }
  isSaving.value = true;
  try {
    await roleApi.createStaff({
      name: f.name.trim(),
      username: f.username.trim(),
      pin_code: f.password,
      role: f.role,
    });
    uiStore.showToast(`Staff account for ${f.name.trim()} created`, 'success');
    showAdd.value = false;
    await loadStaff();
  } catch (err: any) {
    uiStore.showToast(errorMessage(err, 'Failed to create staff'), 'error');
  } finally {
    isSaving.value = false;
  }
}

function openChangePassword(member: StaffAccount) {
  passwordTarget.value = member;
  newPassword.value = '';
}

async function submitPassword() {
  if (!passwordTarget.value) return;
  if (!isValidPassword(newPassword.value)) {
    uiStore.showToast('Password must be 4 to 8 characters', 'warning');
    return;
  }
  isSaving.value = true;
  try {
    await roleApi.updateStaff(passwordTarget.value.id, { pin_code: newPassword.value });
    uiStore.showToast(`Password changed for ${passwordTarget.value.name}`, 'success');
    passwordTarget.value = null;
  } catch (err: any) {
    uiStore.showToast(errorMessage(err, 'Failed to change password'), 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadStaff();
  loadRoles();
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="isLoading" class="flex items-center gap-2 text-xs text-slate-400 py-2">
      <RefreshCw class="w-3.5 h-3.5 animate-spin" />
      <span>Loading staff...</span>
    </div>

    <p v-else-if="!staff.length" class="text-xs text-slate-400 py-2">No staff accounts yet.</p>

    <ul v-else class="flex flex-col divide-y divide-slate-100">
      <li v-for="member in staff" :key="member.id" class="flex items-center justify-between gap-3 py-2.5">
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-semibold text-slate-800 truncate">{{ member.name }}</span>
          <span class="text-[11px] text-slate-400 truncate">
            @{{ member.username }} · {{ member.role_name || member.role }}
            <template v-if="!member.is_active"> · inactive</template>
          </span>
        </div>
        <button
          type="button"
          @click="openChangePassword(member)"
          class="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <KeyRound class="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>
      </li>
    </ul>

    <div>
      <button
        type="button"
        @click="openAdd"
        class="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold transition flex items-center gap-1.5"
      >
        <UserPlus class="w-3.5 h-3.5" />
        <span>Add Staff</span>
      </button>
    </div>

    <!-- Add Staff -->
    <AppModal :show="showAdd" light title="Add Staff" max-width="sm" @close="showAdd = false">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Staff Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. Dara"
            class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Username</label>
          <input
            v-model="form.username"
            type="text"
            autocapitalize="none"
            placeholder="e.g. dara"
            class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Password (4-8 characters)</label>
          <input
            v-model="form.password"
            type="password"
            maxlength="8"
            autocomplete="new-password"
            placeholder="Password"
            class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-slate-600">Role</label>
          <select
            v-model="form.role"
            class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
          >
            <option v-for="r in roleOptions" :key="r.code" :value="r.code">{{ r.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showAdd = false" :disabled="isSaving" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
          Cancel
        </button>
        <button type="button" @click="submitAdd" :disabled="isSaving" class="px-5 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-50">
          {{ isSaving ? 'Saving...' : 'Create Staff' }}
        </button>
      </template>
    </AppModal>

    <!-- Change Password -->
    <AppModal
      :show="!!passwordTarget"
      light
      :title="passwordTarget ? `Change Password — ${passwordTarget.name}` : 'Change Password'"
      max-width="sm"
      @close="passwordTarget = null"
    >
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-slate-600">New Password (4-8 characters)</label>
        <input
          v-model="newPassword"
          type="password"
          maxlength="8"
          autocomplete="new-password"
          placeholder="Password"
          @keyup.enter="submitPassword"
          class="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
        />
      </div>
      <template #footer>
        <button type="button" @click="passwordTarget = null" :disabled="isSaving" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
          Cancel
        </button>
        <button type="button" @click="submitPassword" :disabled="isSaving" class="px-5 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-50">
          {{ isSaving ? 'Saving...' : 'Save Password' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>
