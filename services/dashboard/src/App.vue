<template>
  <div class="min-h-screen bg-bg text-ink font-sans">
    <RouterView />
    <ToastNotification />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import ToastNotification from '@/components/ui/ToastNotification.vue';
import { apiClient } from '@/api/client';

onMounted(async () => {
  if (!localStorage.getItem('token')) {
    try {
      const res = await apiClient.post('/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        // Recarregar a página para que os stores façam fetch de novo com token
        window.location.reload();
      }
    } catch (err) {
      console.error('Falha no auto-login:', err);
    }
  }
});
</script>
