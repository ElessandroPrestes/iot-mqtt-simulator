import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useConnectionStore = defineStore('connection', () => {
  const status   = ref('disconnected'); // 'connected' | 'disconnected' | 'error'
  const socketId = ref(null);
  const connectedAt = ref(null);

  const isConnected = computed(() => status.value === 'connected');
  const isError     = computed(() => status.value === 'error');

  function setStatus(newStatus, id = null) {
    status.value = newStatus;
    socketId.value = id;
    if (newStatus === 'connected') connectedAt.value = new Date();
  }

  return { status, socketId, connectedAt, isConnected, isError, setStatus };
});
