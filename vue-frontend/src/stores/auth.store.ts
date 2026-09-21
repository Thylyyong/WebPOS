import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth.api';
import type { User } from '../types/pos.types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('pos_token'));
  const user = ref<User | null>(
    localStorage.getItem('pos_user') ? JSON.parse(localStorage.getItem('pos_user')!) : null
  );
  const activeBranch = ref<{ id: string; name: string }>(
    localStorage.getItem('pos_branch')
      ? JSON.parse(localStorage.getItem('pos_branch')!)
      : { id: 'store_main', name: 'OmniPOS Main Store' }
  );

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isBoss = computed(() => user.value?.role === 'BOSS' || user.value?.role === 'MAIN_BOSS' || !!user.value?.is_main_boss);
  const isCashier = computed(() => user.value?.role === 'CASHIER' || !!user.value?.is_cashier);

  async function loginWithPin(pin: string, username?: string) {
    const res = await authApi.loginWithPin(pin, username);
    if (res.data.success && res.data.token) {
      token.value = res.data.token;
      user.value = res.data.user;
      localStorage.setItem('pos_token', res.data.token);
      localStorage.setItem('pos_user', JSON.stringify(res.data.user));

      const branchObj = {
        id: res.data.user.branch_id || 'store_main',
        name: res.data.user.branch_name || 'OmniPOS Main Store'
      };
      activeBranch.value = branchObj;
      localStorage.setItem('pos_branch', JSON.stringify(branchObj));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  }

  async function switchBranch(branchId: string, branchName: string) {
    await authApi.switchBranch(branchId);
    activeBranch.value = { id: branchId, name: branchName };
    localStorage.setItem('pos_branch', JSON.stringify(activeBranch.value));
  }

  function logout() {
    authApi.logout().catch(() => {});
    token.value = null;
    user.value = null;
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  }

  return {
    token,
    user,
    activeBranch,
    isAuthenticated,
    isBoss,
    isCashier,
    loginWithPin,
    switchBranch,
    logout
  };
});
