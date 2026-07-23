import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { useConnectionStore } from '@/stores/connection';
import ConnectionStatus from '@/components/ui/ConnectionStatus.vue';
import { nextTick } from 'vue';

describe('ConnectionStatus.vue', () => {
  it('renders status text correctly', async () => {
    const wrapper = mount(ConnectionStatus, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useConnectionStore();
    store.status = 'connected';
    await nextTick();
    expect(wrapper.text()).toContain('connected');
  });

  it('applies correct dot class for connected status', async () => {
    const wrapper = mount(ConnectionStatus, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useConnectionStore();
    store.status = 'connected';
    await nextTick();
    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--connected');
  });

  it('applies correct dot class for error status', async () => {
    const wrapper = mount(ConnectionStatus, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useConnectionStore();
    store.status = 'error';
    await nextTick();
    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--critical');
  });

  it('applies correct dot class for disconnected status', async () => {
    const wrapper = mount(ConnectionStatus, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useConnectionStore();
    store.status = 'disconnected';
    await nextTick();
    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--error');
  });
});
