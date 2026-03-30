<template>
  <aside class="w-[var(--sidebar-width)] bg-bg-card border-r border-border flex flex-col h-full">
    <nav class="flex-1 p-3 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        custom
        v-slot="{ isActive, navigate }"
      >
        <button
          :class="['sidebar-item w-full', isActive && 'sidebar-item--active']"
          @click="navigate"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            :class="['ml-auto text-2xs font-mono px-1.5 py-0.5 rounded-full',
                     item.badgeVariant === 'critical' ? 'bg-critical-muted text-critical' : 'bg-warning-muted text-warning']"
          >
            {{ item.badge }}
          </span>
        </button>
      </RouterLink>
    </nav>

    <div class="p-3 border-t border-border">
      <div class="metric-row">
        <span class="metric-label">versão</span>
        <span class="metric-value text-ink-dim">v1.0.0</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAlertsStore } from '@/stores/alerts';

const alertsStore = useAlertsStore();

const navItems = computed(() => [
  { to: '/dashboard', label: 'Dashboard',  icon: 'span', badge: null },
  { to: '/sensors',   label: 'Sensores',   icon: 'span', badge: null },
  {
    to: '/alerts', label: 'Alertas', icon: 'span',
    badge: alertsStore.unresolvedCount || null,
    badgeVariant: alertsStore.criticalAlerts.length > 0 ? 'critical' : 'warning',
  },
  { to: '/history', label: 'Histórico', icon: 'span', badge: null },
]);
</script>
