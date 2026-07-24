import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

const router = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => router,
}));

vi.mock('@/api/client', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/api/client';
import LoginView from '@/views/LoginView.vue';

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia o segundo fator TOTP e limpa os segredos do formulário', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        accessToken: 'access-token',
        user: { id: 'operator-1', username: 'operator', role: 'operator' },
      },
    });
    const wrapper = mount(LoginView);

    const username = wrapper.get('input[name="username"]');
    const password = wrapper.get('input[name="password"]');
    const totp = wrapper.get('input[name="totp"]');

    expect(totp.attributes('required')).toBeDefined();
    expect(totp.attributes('inputmode')).toBe('numeric');

    await username.setValue('operator');
    await password.setValue('valid-password');
    await totp.setValue('123456');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/login',
      {
        username: 'operator',
        password: 'valid-password',
        totp: '123456',
      },
      {
        skipAuthRefresh: true,
        suppressNotification: true,
      }
    );
    expect(password.element.value).toBe('');
    expect(totp.element.value).toBe('');
    expect(router.replace).toHaveBeenCalledWith('/dashboard');
  });
});
