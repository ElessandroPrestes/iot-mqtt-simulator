<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <section class="card w-full max-w-sm p-8 space-y-6" aria-labelledby="login-title">
      <div class="space-y-2">
        <p class="metric-label text-accent">acesso protegido</p>
        <h1 id="login-title" class="font-mono text-xl font-semibold text-ink">
          IoT.dashboard
        </h1>
        <p class="text-sm text-ink-muted">
          Entre com a credencial fornecida pelo administrador.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <label class="block space-y-1">
          <span class="metric-label">usuário</span>
          <input
            v-model.trim="username"
            name="username"
            autocomplete="username"
            maxlength="64"
            required
            class="w-full bg-bg border border-border rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
        </label>

        <label class="block space-y-1">
          <span class="metric-label">senha</span>
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            minlength="8"
            maxlength="256"
            required
            class="w-full bg-bg border border-border rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
        </label>

        <p v-if="errorMessage" role="alert" class="text-sm text-critical">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full rounded bg-accent text-bg font-mono font-semibold px-4 py-2 disabled:opacity-50"
        >
          {{ authStore.loading ? 'entrando…' : 'entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

async function submit() {
  errorMessage.value = '';
  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    });
    password.value = '';
    const redirect = typeof route.query.redirect === 'string'
      && route.query.redirect.startsWith('/')
      && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : '/dashboard';
    await router.replace(redirect);
  } catch {
    password.value = '';
    errorMessage.value = 'Não foi possível entrar. Verifique suas credenciais.';
  }
}
</script>
