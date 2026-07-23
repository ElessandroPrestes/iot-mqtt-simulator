import { ref, onMounted, onUnmounted, watch } from 'vue';
import { io } from 'socket.io-client';
import { useSensorsStore } from '@/stores/sensors';
import { useAlertsStore } from '@/stores/alerts';
import { useConnectionStore } from '@/stores/connection';
import { useAuthStore } from '@/stores/auth';

export function useSocket() {
  const socket = ref(null);
  const sensorsStore = useSensorsStore();
  const alertsStore  = useAlertsStore();
  const connStore    = useConnectionStore();
  const authStore    = useAuthStore();
  let stopTokenWatch;

  onMounted(() => {
    socket.value = io(import.meta.env.VITE_WS_URL, {
      auth: { token: authStore.accessToken },
      transports: ['websocket'],
      reconnectionDelay: 2000,
    });

    socket.value.on('connect',       () => connStore.setStatus('connected', socket.value.id));
    socket.value.on('disconnect',    () => connStore.setStatus('disconnected'));
    socket.value.on('connect_error', () => connStore.setStatus('error'));

    socket.value.on('reading:new', (reading) => sensorsStore.updateReading(reading));
    socket.value.on('alert:new',   (alert)   => alertsStore.addAlert(alert));

    stopTokenWatch = watch(
      () => authStore.accessToken,
      (token) => {
        if (!socket.value) return;
        socket.value.auth = { token };
        if (token) {
          socket.value.disconnect().connect();
        } else {
          socket.value.disconnect();
        }
      }
    );
  });

  onUnmounted(() => {
    stopTokenWatch?.();
    socket.value?.disconnect();
  });

  return { socket };
}
