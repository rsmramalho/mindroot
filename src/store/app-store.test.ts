// store/app-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './app-store';
import { DEFAULT_FILTERS } from '@/types/ui';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    currentPage: 'home',
    user: null,
    filters: DEFAULT_FILTERS,
    currentEmotion: null,
    isInputFocused: false,
  });
});

describe('AppStore — Navigation', () => {
  it('starts on home page', () => {
    expect(useAppStore.getState().currentPage).toBe('home');
  });

  it('navigate changes currentPage', () => {
    useAppStore.getState().navigate('inbox');
    expect(useAppStore.getState().currentPage).toBe('inbox');
  });

  it('navigate to all valid pages', () => {
    const pages = ['home', 'inbox', 'projects', 'ritual', 'journal', 'calendar', 'analytics'] as const;
    for (const page of pages) {
      useAppStore.getState().navigate(page);
      expect(useAppStore.getState().currentPage).toBe(page);
    }
  });
});

describe('AppStore — Auth', () => {
  it('starts with no user', () => {
    expect(useAppStore.getState().user).toBeNull();
  });

  it('setUser stores user object', () => {
    const mockUser = { id: 'u1', email: 'test@test.com' } as any;
    useAppStore.getState().setUser(mockUser);
    expect(useAppStore.getState().user).toEqual(mockUser);
  });

  it('setUser(null) clears user', () => {
    useAppStore.getState().setUser({ id: 'u1' } as any);
    useAppStore.getState().setUser(null);
    expect(useAppStore.getState().user).toBeNull();
  });
});

describe('AppStore — Filters', () => {
  it('starts with DEFAULT_FILTERS', () => {
    expect(useAppStore.getState().filters).toEqual(DEFAULT_FILTERS);
  });

  it('setFilter updates single filter key', () => {
    useAppStore.getState().setFilter('module', 'work');
    expect(useAppStore.getState().filters.module).toBe('work');
    // Other filters unchanged
    expect(useAppStore.getState().filters.priority).toBeNull();
  });

  it('setFilter preserves other keys', () => {
    useAppStore.getState().setFilter('module', 'work');
    useAppStore.getState().setFilter('priority', 'high');
    expect(useAppStore.getState().filters.module).toBe('work');
    expect(useAppStore.getState().filters.priority).toBe('high');
  });

  it('setFilter for search', () => {
    useAppStore.getState().setFilter('search', 'comprar');
    expect(useAppStore.getState().filters.search).toBe('comprar');
  });

  it('setFilter for showCompleted', () => {
    useAppStore.getState().setFilter('showCompleted', true);
    expect(useAppStore.getState().filters.showCompleted).toBe(true);
  });

  it('resetFilters restores defaults', () => {
    useAppStore.getState().setFilter('module', 'work');
    useAppStore.getState().setFilter('search', 'test');
    useAppStore.getState().resetFilters();
    expect(useAppStore.getState().filters).toEqual(DEFAULT_FILTERS);
  });
});

describe('AppStore — Soul', () => {
  it('starts with no emotion', () => {
    expect(useAppStore.getState().currentEmotion).toBeNull();
  });

  it('setCurrentEmotion stores emotion', () => {
    useAppStore.getState().setCurrentEmotion('ansioso');
    expect(useAppStore.getState().currentEmotion).toBe('ansioso');
  });

  it('setCurrentEmotion(null) clears', () => {
    useAppStore.getState().setCurrentEmotion('calmo');
    useAppStore.getState().setCurrentEmotion(null);
    expect(useAppStore.getState().currentEmotion).toBeNull();
  });
});

describe('AppStore — UI', () => {
  it('input not focused by default', () => {
    expect(useAppStore.getState().isInputFocused).toBe(false);
  });

  it('setInputFocused toggles state', () => {
    useAppStore.getState().setInputFocused(true);
    expect(useAppStore.getState().isInputFocused).toBe(true);
    useAppStore.getState().setInputFocused(false);
    expect(useAppStore.getState().isInputFocused).toBe(false);
  });
});
