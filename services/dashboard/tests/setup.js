import { config } from '@vue/test-utils';
import { createPinia } from 'pinia';

// Pinia global para todos os testes
config.global.plugins = [createPinia()];

// Stub de classes Tailwind — Vitest usa jsdom que não processa CSS
// Componentes são testados por comportamento, não por estilo
