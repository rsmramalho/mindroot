// store/theme-store.ts — Theme & personalization state
// Persists to localStorage, applies CSS variables on change

import { create } from 'zustand';
import type { AtomModule } from '@/types/item';
import type { ThemeMode, DashboardSection, ThemeConfig } from '@/engine/theme';
import {
  DEFAULT_MODULE_COLORS,
  DEFAULT_DASHBOARD_ORDER,
  loadThemeConfig,
  saveThemeConfig,
  applyThemeToDom,
  moveSectionUp,
  moveSectionDown,
  isValidModuleColor,
} from '@/engine/theme';

interface ThemeState {
  mode: ThemeMode;
  moduleColors: Record<AtomModule, string>;
  dashboardOrder: DashboardSection[];

  // Actions
  toggleTheme: () => void;
  setModuleColor: (module: AtomModule, color: string) => void;
  resetModuleColors: () => void;
  moveDashboardSectionUp: (section: DashboardSection) => void;
  moveDashboardSectionDown: (section: DashboardSection) => void;
  resetDashboardOrder: () => void;
}

function getConfig(state: ThemeState): ThemeConfig {
  return {
    mode: state.mode,
    moduleColors: state.moduleColors,
    dashboardOrder: state.dashboardOrder,
  };
}

function persist(config: ThemeConfig) {
  saveThemeConfig(config);
  applyThemeToDom(config);
}

// Load initial config from localStorage
const initial = loadThemeConfig();

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initial.mode,
  moduleColors: initial.moduleColors,
  dashboardOrder: initial.dashboardOrder,

  toggleTheme: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: next });
    const config = getConfig({ ...get(), mode: next });
    persist(config);
  },

  setModuleColor: (module, color) => {
    if (!isValidModuleColor(color)) return;
    const moduleColors = { ...get().moduleColors, [module]: color };
    set({ moduleColors });
    const config = getConfig({ ...get(), moduleColors });
    persist(config);
  },

  resetModuleColors: () => {
    const moduleColors = { ...DEFAULT_MODULE_COLORS };
    set({ moduleColors });
    const config = getConfig({ ...get(), moduleColors });
    persist(config);
  },

  moveDashboardSectionUp: (section) => {
    const dashboardOrder = moveSectionUp(get().dashboardOrder, section);
    set({ dashboardOrder });
    const config = getConfig({ ...get(), dashboardOrder });
    persist(config);
  },

  moveDashboardSectionDown: (section) => {
    const dashboardOrder = moveSectionDown(get().dashboardOrder, section);
    set({ dashboardOrder });
    const config = getConfig({ ...get(), dashboardOrder });
    persist(config);
  },

  resetDashboardOrder: () => {
    const dashboardOrder = [...DEFAULT_DASHBOARD_ORDER];
    set({ dashboardOrder });
    const config = getConfig({ ...get(), dashboardOrder });
    persist(config);
  },
}));
