import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { configureSessionAdapter } from './api/client';
import { useAuthStore } from './stores/auth';
import './styles/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
const authStore = useAuthStore(pinia);
configureSessionAdapter({
  getAccessToken: () => authStore.accessToken,
  refresh: () => authStore.refresh(),
  clear: () => {
    authStore.clear();
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' });
    }
  },
});
app.use(router);
app.mount('#app');
