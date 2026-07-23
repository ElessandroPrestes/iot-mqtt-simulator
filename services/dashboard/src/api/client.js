import axios from 'axios';
import { useNotificationStore } from '@/stores/notification';

let sessionAdapter = {
  clear: () => {},
  getAccessToken: () => null,
  refresh: null,
};
let refreshPromise = null;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export function configureSessionAdapter(adapter) {
  sessionAdapter = { ...sessionAdapter, ...adapter };
}

apiClient.interceptors.request.use((config) => {
  const token = sessionAdapter.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Retorna o envelope da API diretamente ({ success, data, meta })
    return response.data;
  },
  async (error) => {
    const request = error.config;
    const canRefresh = error.response?.status === 401
      && request
      && !request.skipAuthRefresh
      && !request.authRetry
      && typeof sessionAdapter.refresh === 'function';

    if (canRefresh) {
      request.authRetry = true;
      try {
        refreshPromise ||= sessionAdapter.refresh().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return apiClient(request);
      } catch {
        sessionAdapter.clear();
      }
    }

    const errorPayload = error.response?.data?.error;
    const message = errorPayload?.message || error.message || 'Erro de comunicação';
    const details = errorPayload?.details || [];

    if (!request?.suppressNotification) {
      try {
        const notificationStore = useNotificationStore();
        notificationStore.notify(message, 'error', details);
      } catch {
        // A store pode ainda não estar pronta fora do contexto Vue.
      }
    }

    return Promise.reject(error);
  }
);
