<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <div 
      v-for="toast in notificationStore.toasts" 
      :key="toast.id"
      class="p-4 rounded shadow-lg text-white max-w-sm"
      :class="toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'"
    >
      <div class="font-bold flex justify-between">
        <span>{{ toast.message }}</span>
        <button @click="notificationStore.remove(toast.id)" class="text-white hover:text-gray-200 ml-4">&times;</button>
      </div>
      <ul v-if="toast.details && toast.details.length" class="text-sm mt-2 list-disc pl-4">
        <li v-for="(detail, i) in toast.details" :key="i">{{ detail }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification';
const notificationStore = useNotificationStore();
</script>
