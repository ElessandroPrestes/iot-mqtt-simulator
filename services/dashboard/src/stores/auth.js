import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { apiClient } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(null);
  const user = ref(null);
  const initialized = ref(false);
  const loading = ref(false);

  const isAuthenticated = computed(
    () => Boolean(accessToken.value && user.value)
  );

  function applySession(payload) {
    accessToken.value = payload.accessToken;
    user.value = payload.user;
  }

  function clear() {
    accessToken.value = null;
    user.value = null;
  }

  function hasRole(...roles) {
    return roles.includes(user.value?.role);
  }

  async function login(credentials) {
    loading.value = true;
    try {
      const response = await apiClient.post('/auth/login', credentials, {
        skipAuthRefresh: true,
        suppressNotification: true,
      });
      applySession(response.data);
      initialized.value = true;
      return user.value;
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    const response = await apiClient.post('/auth/refresh', null, {
      skipAuthRefresh: true,
      suppressNotification: true,
    });
    applySession(response.data);
    return user.value;
  }

  async function initialize() {
    if (initialized.value) return;
    try {
      await refresh();
    } catch {
      clear();
    } finally {
      initialized.value = true;
    }
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout', null, {
        skipAuthRefresh: true,
        suppressNotification: true,
      });
    } finally {
      clear();
      initialized.value = true;
    }
  }

  return {
    accessToken,
    user,
    initialized,
    loading,
    isAuthenticated,
    applySession,
    clear,
    hasRole,
    initialize,
    login,
    logout,
    refresh,
  };
});
