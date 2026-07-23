import axios from 'axios';
import { useNotificationStore } from '@/stores/notification';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => {
    // Retorna o envelope da API diretamente ({ success, data, meta })
    return response.data;
  },
  (error) => {
    const errorPayload = error.response?.data?.error;
    const message = errorPayload?.message || error.message || 'Erro de comunicação';
    const details = errorPayload?.details || [];
    
    console.error('[API]', message, details);
    
    // Mostra o Toast Notification em caso de erro HTTP
    try {
      const notificationStore = useNotificationStore();
      notificationStore.notify(message, 'error', details);
    } catch (e) {
      // Caso a store não esteja pronta (fora de contexto vue)
    }

    return Promise.reject(error);
  }
);
