import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';

import LoginView from '../views/LoginView.vue';
import PosTerminalView from '../views/PosTerminalView.vue';
import TablesView from '../views/TablesView.vue';
import RegisterView from '../views/RegisterView.vue';
import AccountingView from '../views/AccountingView.vue';
import SettingsView from '../views/SettingsView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true, title: 'Sign In' }
  },
  {
    path: '/pos',
    name: 'pos',
    component: PosTerminalView,
    meta: { requiresAuth: true, title: 'POS Terminal' }
  },
  {
    path: '/tables',
    name: 'tables',
    component: TablesView,
    meta: { requiresAuth: true, title: 'Floor Plan' }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresAuth: true, title: 'Cash Register' }
  },
  {
    path: '/accounting',
    name: 'accounting',
    component: AccountingView,
    meta: { requiresAuth: true, requiresBoss: true, title: 'P&L Financials' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true, requiresBoss: true, title: 'Store Settings' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const uiStore = useUiStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return next({ name: 'pos' });
  }

  if (to.meta.requiresBoss && !authStore.isBoss) {
    uiStore.showToast('Access restricted to Boss role.', 'warning');
    return next({ name: 'pos' });
  }

  next();
});

export default router;
