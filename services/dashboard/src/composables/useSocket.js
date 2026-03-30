import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useSensorsStore } from '@/stores/sensors';
import { useAlertsStore } from '@/stores/alerts';
import { useConnectionStore } from '@/stores/connection';

export function useSocket() {
  const socket = ref(null);
  const sensorsStore = useSensorsStore();
  const alertsStore  = useAlertsStore();
  const connStore    = useConnectionStore();

  onMounted(() => {
    socket.value = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket'],
      reconnectionDelay: 2000,
    });

    socket.value.on('connect',       () => connStore.setStatus('connected', socket.value.id));
    socket.value.on('disconnect',    () => connStore.setStatus('disconnected'));
    socket.value.on('connect_error', () => connStore.setStatus('error'));

    socket.value.on('reading:new', (reading) => sensorsStore.updateReading(reading));
    socket.value.on('alert:new',   (alert)   => alertsStore.addAlert(alert));
  });

  onUnmounted(() => socket.value?.disconnect());

  return { socket };
}
