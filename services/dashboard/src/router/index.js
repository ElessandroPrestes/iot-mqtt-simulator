import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Entrar', public: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard', roles: ['viewer', 'operator'] },
  },
  {
    path: '/sensors',
    name: 'sensors',
    component: () => import('@/views/SensorsView.vue'),
    meta: { title: 'Sensores', roles: ['viewer', 'operator'] },
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('@/views/AlertsView.vue'),
    meta: { title: 'Alertas', roles: ['viewer', 'operator'] },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
    meta: { title: 'Histórico', roles: ['viewer', 'operator'] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export async function navigationGuard(to, authStore) {
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  if (to.meta.public) {
    return to.name === 'login' && authStore.isAuthenticated
      ? { name: 'dashboard' }
      : true;
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  const allowedRoles = to.meta.roles || [];
  if (allowedRoles.length && !allowedRoles.includes(authStore.user?.role)) {
    return { name: 'dashboard' };
  }

  return true;
}

router.beforeEach(async (to) => {
  return navigationGuard(to, useAuthStore());
});

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} — IoT Dashboard`
    : 'IoT Dashboard';
});

export default router;
