// engine/theme.ts — Theme & personalization logic
// Pure functions: color tokens, CSS variable generation, section ordering

import type { AtomModule } from '@/types/item';

// ─── Types ──────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light';

export type DashboardSection = 'overdue' | 'focus' | 'today' | 'modules' | 'unclassified';

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  overlay: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  moduleColors: Record<AtomModule, string>;
  dashboardOrder: DashboardSection[];
}

// ─── Defaults ───────────────────────────────────────────────

export const DEFAULT_MODULE_COLORS: Record<AtomModule, string> = {
  purpose: '#c4a882',
  work: '#8a9e7a',
  family: '#d4856a',
  body: '#b8c4a8',
  mind: '#a89478',
  bridge: '#8a8a8a',
  finance: '#7a9e8a',
  social: '#9e7a8a',
};

export const DEFAULT_DASHBOARD_ORDER: DashboardSection[] = [
  'overdue',
  'focus',
  'today',
  'modules',
  'unclassified',
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  moduleColors: { ...DEFAULT_MODULE_COLORS },
  dashboardOrder: [...DEFAULT_DASHBOARD_ORDER],
};

// ─── Color Tokens ───────────────────────────────────────────

const DARK_COLORS: ThemeColors = {
  bg: '#111318',
  surface: '#1a1d24',
  border: '#2a2d34',
  textPrimary: '#e8e0d4',
  textSecondary: '#a89478',
  textMuted: '#a8947860',
  overlay: '#111318d0',
};

const LIGHT_COLORS: ThemeColors = {
  bg: '#f5f2ed',
  surface: '#ffffff',
  border: '#e0d8cc',
  textPrimary: '#2a2520',
  textSecondary: '#6b5e4f',
  textMuted: '#6b5e4f80',
  overlay: '#f5f2edd0',
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
}

// ─── CSS Variable Generation ────────────────────────────────

export function generateCssVariables(config: ThemeConfig): Record<string, string> {
  const colors = getThemeColors(config.mode);
  const vars: Record<string, string> = {
    '--mr-bg': colors.bg,
    '--mr-surface': colors.surface,
    '--mr-border': colors.border,
    '--mr-text-primary': colors.textPrimary,
    '--mr-text-secondary': colors.textSecondary,
    '--mr-text-muted': colors.textMuted,
    '--mr-overlay': colors.overlay,
  };

  // Module colors
  for (const [mod, color] of Object.entries(config.moduleColors)) {
    vars[`--mr-mod-${mod}`] = color;
  }

  return vars;
}

// ─── Apply to DOM ───────────────────────────────────────────

export function applyThemeToDom(config: ThemeConfig): void {
  const vars = generateCssVariables(config);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  // Set data attribute for conditional CSS
  root.setAttribute('data-theme', config.mode);
}

// ─── Persistence ────────────────────────────────────────────

const STORAGE_KEY = 'mindroot:theme';

export function loadThemeConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    const saved = JSON.parse(raw) as Partial<ThemeConfig>;
    return {
      mode: saved.mode === 'light' ? 'light' : 'dark',
      moduleColors: { ...DEFAULT_MODULE_COLORS, ...(saved.moduleColors || {}) },
      dashboardOrder: Array.isArray(saved.dashboardOrder) && saved.dashboardOrder.length === 5
        ? saved.dashboardOrder
        : [...DEFAULT_DASHBOARD_ORDER],
    };
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

export function saveThemeConfig(config: ThemeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable
  }
}

// ─── Section Labels ─────────────────────────────────────────

export const SECTION_LABELS: Record<DashboardSection, string> = {
  overdue: 'Atrasados',
  focus: 'Foco',
  today: 'Hoje',
  modules: 'Por modulo',
  unclassified: 'Sem modulo',
};

// ─── Helpers ────────────────────────────────────────────────

export function moveSectionUp(order: DashboardSection[], section: DashboardSection): DashboardSection[] {
  const idx = order.indexOf(section);
  if (idx <= 0) return order;
  const next = [...order];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  return next;
}

export function moveSectionDown(order: DashboardSection[], section: DashboardSection): DashboardSection[] {
  const idx = order.indexOf(section);
  if (idx < 0 || idx >= order.length - 1) return order;
  const next = [...order];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return next;
}

export function isValidModuleColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}
