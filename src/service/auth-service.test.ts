// service/auth-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — define mock inside factory
vi.mock('./supabase', () => {
  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  };
  return { supabase: { auth: mockAuth } };
});

import { authService } from './auth-service';
import { supabase } from './supabase';

const mockAuth = supabase.auth as any;

beforeEach(() => vi.clearAllMocks());

describe('authService.signInWithEmail', () => {
  it('returns data on success', async () => {
    const mockData = { user: { id: 'u1' }, session: { access_token: 'tok' } };
    mockAuth.signInWithPassword.mockResolvedValue({ data: mockData, error: null });

    const result = await authService.signInWithEmail('test@test.com', 'pass');
    expect(result).toEqual(mockData);
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass',
    });
  });

  it('throws on error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid' } });
    await expect(authService.signInWithEmail('a@b.com', 'x')).rejects.toBeDefined();
  });
});

describe('authService.signUp', () => {
  it('returns data on success', async () => {
    const mockData = { user: { id: 'u2' } };
    mockAuth.signUp.mockResolvedValue({ data: mockData, error: null });
    const result = await authService.signUp('new@test.com', 'pass123');
    expect(result).toEqual(mockData);
  });

  it('throws on error', async () => {
    mockAuth.signUp.mockResolvedValue({ data: null, error: { message: 'Exists' } });
    await expect(authService.signUp('a@b.com', 'x')).rejects.toBeDefined();
  });
});

describe('authService.signInWithGoogle', () => {
  it('calls signInWithOAuth with google provider', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://google.com' }, error: null });
    const result = await authService.signInWithGoogle();
    expect(result.url).toBeDefined();
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    );
  });

  it('throws on error', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    mockAuth.signInWithOAuth.mockResolvedValue({ data: null, error: { message: 'Fail' } });
    await expect(authService.signInWithGoogle()).rejects.toBeDefined();
  });
});

describe('authService.signOut', () => {
  it('resolves on success', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    await expect(authService.signOut()).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    mockAuth.signOut.mockResolvedValue({ error: { message: 'Fail' } });
    await expect(authService.signOut()).rejects.toBeDefined();
  });
});

describe('authService.getSession', () => {
  it('returns session when present', async () => {
    const session = { access_token: 'tok', user: { id: 'u1' } };
    mockAuth.getSession.mockResolvedValue({ data: { session } });
    expect(await authService.getSession()).toEqual(session);
  });

  it('returns null when no session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    expect(await authService.getSession()).toBeNull();
  });
});

describe('authService.getUser', () => {
  it('returns user when present', async () => {
    const user = { id: 'u1', email: 'test@test.com' };
    mockAuth.getUser.mockResolvedValue({ data: { user } });
    expect(await authService.getUser()).toEqual(user);
  });

  it('returns null when no user', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null } });
    expect(await authService.getUser()).toBeNull();
  });
});

describe('authService.onAuthStateChange', () => {
  it('passes callback to supabase', () => {
    const cb = vi.fn();
    const mockUnsub = { data: { subscription: { unsubscribe: vi.fn() } } };
    mockAuth.onAuthStateChange.mockReturnValue(mockUnsub);
    const result = authService.onAuthStateChange(cb);
    expect(mockAuth.onAuthStateChange).toHaveBeenCalledWith(cb);
    expect(result).toEqual(mockUnsub);
  });
});
