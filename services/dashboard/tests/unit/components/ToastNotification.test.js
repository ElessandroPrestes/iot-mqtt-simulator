import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { useNotificationStore } from '@/stores/notification';
import ToastNotification from '@/components/ui/ToastNotification.vue';
import { nextTick } from 'vue';

describe('ToastNotification.vue', () => {
  it('renders a list of toasts', async () => {
    const wrapper = mount(ToastNotification, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useNotificationStore();
    store.toasts = [
      { id: '1', message: 'Hello', type: 'info', details: [] },
      { id: '2', message: 'Error occurred', type: 'error', details: ['detail 1'] },
    ];
    await nextTick();
    const html = wrapper.html();
    expect(html).toContain('Hello');
    expect(html).toContain('Error occurred');
    expect(html).toContain('detail 1');
  });

  it('applies bg-red-600 for error toasts', async () => {
    const wrapper = mount(ToastNotification, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useNotificationStore();
    store.toasts = [
      { id: '1', message: 'Error', type: 'error', details: [] },
    ];
    await nextTick();
    const toastDiv = wrapper.find('.bg-red-600');
    expect(toastDiv.exists()).toBe(true);
  });

  it('calls remove when close button is clicked', async () => {
    const wrapper = mount(ToastNotification, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });
    const store = useNotificationStore();
    store.toasts = [
      { id: 'toast-1', message: 'Close me', type: 'info', details: [] },
    ];
    await nextTick();
    const closeBtn = wrapper.find('button');
    await closeBtn.trigger('click');
    expect(store.remove).toHaveBeenCalledWith('toast-1');
  });
});
