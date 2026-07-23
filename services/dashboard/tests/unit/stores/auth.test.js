import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/client', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const session = {
  accessToken: 'access-token-in-memory',
  user: { id: 'viewer-1', username: 'viewer', role: 'viewer' },
};

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the access token only in Pinia memory', async () => {
    const setLocal = vi.spyOn(Storage.prototype, 'setItem');
    apiClient.post.mockResolvedValueOnce({ data: session });
    const store = useAuthStore();

    await store.login({ username: 'viewer', password: 'valid-password' });

    expect(store.accessToken).toBe(session.accessToken);
    expect(store.user).toEqual(session.user);
    expect(setLocal).not.toHaveBeenCalled();
  });

  it('restores a session from the HttpOnly refresh cookie', async () => {
    apiClient.post.mockResolvedValueOnce({ data: session });
    const store = useAuthStore();

    await store.initialize();

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/refresh',
      null,
      {
        skipAuthRefresh: true,
        suppressNotification: true,
      }
    );
    expect(store.isAuthenticated).toBe(true);
    expect(store.initialized).toBe(true);
  });

  it('fails closed when refresh is rejected', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('unauthorized'));
    const store = useAuthStore();

    await store.initialize();

    expect(store.isAuthenticated).toBe(false);
    expect(store.initialized).toBe(true);
  });

  it('clears the in-memory session even if logout fails', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('network'));
    const store = useAuthStore();
    store.applySession(session);

    await expect(store.logout()).rejects.toThrow('network');

    expect(store.accessToken).toBeNull();
    expect(store.user).toBeNull();
  });
});
