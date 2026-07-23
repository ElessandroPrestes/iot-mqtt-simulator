import { describe, expect, it, vi } from 'vitest';
import { navigationGuard } from '@/router';

function authState(overrides = {}) {
  return {
    initialized: true,
    isAuthenticated: false,
    user: null,
    initialize: vi.fn(),
    ...overrides,
  };
}

describe('navigationGuard', () => {
  it('restores the session before deciding access', async () => {
    const authStore = authState({ initialized: false });
    authStore.initialize.mockImplementation(() => {
      authStore.initialized = true;
    });

    await navigationGuard(
      { name: 'login', meta: { public: true } },
      authStore
    );

    expect(authStore.initialize).toHaveBeenCalledOnce();
  });

  it('redirects anonymous users to login without granting access', async () => {
    const result = await navigationGuard(
      {
        name: 'dashboard',
        fullPath: '/dashboard',
        meta: { roles: ['viewer', 'operator'] },
      },
      authState()
    );

    expect(result).toEqual({
      name: 'login',
      query: { redirect: '/dashboard' },
    });
  });

  it('redirects authenticated users away from login', async () => {
    const result = await navigationGuard(
      { name: 'login', meta: { public: true } },
      authState({
        isAuthenticated: true,
        user: { role: 'viewer' },
      })
    );

    expect(result).toEqual({ name: 'dashboard' });
  });

  it('fails closed when the role is not allowed', async () => {
    const result = await navigationGuard(
      {
        name: 'operator-only',
        fullPath: '/operator-only',
        meta: { roles: ['operator'] },
      },
      authState({
        isAuthenticated: true,
        user: { role: 'viewer' },
      })
    );

    expect(result).toEqual({ name: 'dashboard' });
  });

  it('allows a valid role', async () => {
    const result = await navigationGuard(
      {
        name: 'dashboard',
        fullPath: '/dashboard',
        meta: { roles: ['viewer', 'operator'] },
      },
      authState({
        isAuthenticated: true,
        user: { role: 'operator' },
      })
    );

    expect(result).toBe(true);
  });
});
