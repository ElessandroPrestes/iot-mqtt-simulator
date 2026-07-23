<template>
  <div class="min-h-screen bg-bg text-ink font-sans">
    <RouterView />
    <ToastNotification />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import ToastNotification from '@/components/ui/ToastNotification.vue';
</script>
