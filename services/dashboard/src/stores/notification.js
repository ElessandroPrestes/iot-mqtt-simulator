import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref([]);
  let nextId = 1;

  function notify(message, type = 'error', details = null) {
    const id = nextId++;
    toasts.value.push({ id, message, type, details });
    setTimeout(() => {
      remove(id);
    }, 5000);
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return { toasts, notify, remove };
});
