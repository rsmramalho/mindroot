// types/ui.ts — UI state types
import type { ItemModule, ItemPriority, ItemType, RitualPeriod } from './item';

export type AppPage = 'home' | 'inbox' | 'projects' | 'project-detail' | 'ritual' | 'journal' | 'calendar' | 'analytics';

export interface AppFilters {
  module: ItemModule | null;
  priority: ItemPriority | null;
  type: ItemType | null;
  search: string;
  showCompleted: boolean;
  dateRange: { start: string; end: string } | null;
}

export const DEFAULT_FILTERS: AppFilters = {
  module: null,
  priority: null,
  type: null,
  search: '',
  showCompleted: false,
  dateRange: null,
};

export interface RitualPeriodConfig {
  key: RitualPeriod;
  label: string;
  greeting: string;
  hours: { start: number; end: number };
  color: string;
}

export const RITUAL_PERIODS: RitualPeriodConfig[] = [
  {
    key: 'aurora',
    label: 'Aurora',
    greeting: 'Bom dia',
    hours: { start: 5, end: 12 },
    color: '#f0c674',
  },
  {
    key: 'zenite',
    label: 'Zênite',
    greeting: 'Boa tarde',
    hours: { start: 12, end: 18 },
    color: '#e8e0d4',
  },
  {
    key: 'crepusculo',
    label: 'Crepúsculo',
    greeting: 'Boa noite',
    hours: { start: 18, end: 5 },
    color: '#8a6e5a',
  },
];

export function getCurrentPeriod(): RitualPeriodConfig {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return RITUAL_PERIODS[0];
  if (hour >= 12 && hour < 18) return RITUAL_PERIODS[1];
  return RITUAL_PERIODS[2];
}
