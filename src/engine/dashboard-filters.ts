// engine/dashboard-filters.ts
// Engine de filtros avançados — lógica pura, sem React
// Filtra e agrupa AtomItems para o Dashboard

import type { AtomItem, Priority, OperationsExtension } from '@/types/item';
import { isToday, isPast, isFuture, startOfDay, isThisWeek } from 'date-fns';

// ━━━ Types ━━━

export type GroupBy = 'module' | 'priority' | 'type' | 'date' | 'none';
export type SortBy = 'due_date' | 'priority' | 'created_at' | 'module';
export type SortDir = 'asc' | 'desc';

export interface DashboardFilters {
  module?: string;
  priority?: string;
  type?: string;
  showCompleted?: boolean;
  showArchived?: boolean;
  dateRange?: 'today' | 'week' | 'overdue' | 'future' | 'all';
  search?: string;
  groupBy?: GroupBy;
  sortBy?: SortBy;
  sortDir?: SortDir;
}

export interface GroupedItems {
  key: string;
  label: string;
  items: AtomItem[];
  color?: string;
}

// ━━━ Constants ━━━

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const MODULE_LABELS: Record<string, string> = {
  purpose: 'Propósito',
  work: 'Trabalho',
  family: 'Família',
  body: 'Corpo',
  mind: 'Mente',
  bridge: 'Ponte',
  finance: 'Finanças',
  social: 'Social',
};

const MODULE_COLORS: Record<string, string> = {
  purpose: '#c4a882',
  work: '#8a9e7a',
  family: '#d4856a',
  body: '#b8c4a8',
  mind: '#a89478',
  bridge: '#8a8a8a',
  finance: '#7a9e8a',
  social: '#9e7a8a',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

// ━━━ Helpers ━━━

function getItemPriority(item: AtomItem): Priority | undefined {
  return (item.body?.operations as OperationsExtension | undefined)?.priority ?? undefined;
}

function getItemDueDate(item: AtomItem): string | undefined {
  return (item.body?.operations as OperationsExtension | undefined)?.due_date ?? undefined;
}

// ━━━ Core Filters ━━━

export function filterItems(items: AtomItem[], filters: DashboardFilters): AtomItem[] {
  return items.filter((item) => {
    // Completed
    if (!filters.showCompleted && item.status === 'completed') return false;

    // Archived
    if (!filters.showArchived && item.status === 'archived') return false;

    // Module
    if (filters.module && item.module !== filters.module) return false;

    // Priority
    if (filters.priority && getItemPriority(item) !== filters.priority) return false;

    // Type
    if (filters.type && item.type !== filters.type) return false;

    // Date range
    if (filters.dateRange && filters.dateRange !== 'all') {
      const dueDate = getItemDueDate(item);
      const due = dueDate ? new Date(dueDate) : null;

      switch (filters.dateRange) {
        case 'today':
          if (!due || !isToday(due)) return false;
          break;
        case 'week':
          if (!due || !isThisWeek(due, { weekStartsOn: 1 })) return false;
          break;
        case 'overdue':
          if (!due || !isPast(startOfDay(due)) || isToday(due)) return false;
          break;
        case 'future':
          if (!due || !isFuture(startOfDay(due))) return false;
          break;
      }
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inTags) return false;
    }

    return true;
  });
}

// ━━━ Sorting ━━━

export function sortItems(items: AtomItem[], sortBy: SortBy = 'due_date', dir: SortDir = 'asc'): AtomItem[] {
  const sorted = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'due_date': {
        const dueA = getItemDueDate(a);
        const dueB = getItemDueDate(b);
        const da = dueA ? new Date(dueA).getTime() : Infinity;
        const db = dueB ? new Date(dueB).getTime() : Infinity;
        return da - db;
      }
      case 'priority': {
        const pa = PRIORITY_ORDER[getItemPriority(a) || ''] ?? 99;
        const pb = PRIORITY_ORDER[getItemPriority(b) || ''] ?? 99;
        return pa - pb;
      }
      case 'created_at': {
        const ca = new Date(a.created_at).getTime();
        const cb = new Date(b.created_at).getTime();
        return ca - cb;
      }
      case 'module': {
        return (a.module || 'zzz').localeCompare(b.module || 'zzz');
      }
      default:
        return 0;
    }
  });

  return dir === 'desc' ? sorted.reverse() : sorted;
}

// ━━━ Grouping ━━━

export function groupItems(items: AtomItem[], groupBy: GroupBy = 'none'): GroupedItems[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'Tudo', items }];
  }

  const groups = new Map<string, AtomItem[]>();

  for (const item of items) {
    let key: string;

    switch (groupBy) {
      case 'module':
        key = item.module || '_sem_modulo';
        break;
      case 'priority':
        key = getItemPriority(item) || '_sem_prioridade';
        break;
      case 'type':
        key = item.type || 'task';
        break;
      case 'date': {
        const dueDate = getItemDueDate(item);
        const due = dueDate ? new Date(dueDate) : null;
        if (!due) key = '_sem_data';
        else if (isPast(startOfDay(due)) && !isToday(due)) key = '_atrasado';
        else if (isToday(due)) key = '_hoje';
        else if (isThisWeek(due, { weekStartsOn: 1 })) key = '_semana';
        else key = '_futuro';
        break;
      }
      default:
        key = 'all';
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: getGroupLabel(key, groupBy),
    items,
    color: groupBy === 'module' ? MODULE_COLORS[key] : undefined,
  }));
}

function getGroupLabel(key: string, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'module':
      return MODULE_LABELS[key] || key.replace('_', '');
    case 'priority':
      return PRIORITY_LABELS[key] || 'Sem prioridade';
    case 'type':
      return key.charAt(0).toUpperCase() + key.slice(1);
    case 'date':
      switch (key) {
        case '_atrasado': return 'Atrasado';
        case '_hoje': return 'Hoje';
        case '_semana': return 'Esta semana';
        case '_futuro': return 'Futuro';
        case '_sem_data': return 'Sem data';
        default: return key;
      }
    default:
      return key;
  }
}

// ━━━ Derived Lists ━━━

export function getOverdueItems(items: AtomItem[]): AtomItem[] {
  return items.filter((item) => {
    if (item.status === 'completed' || item.status === 'archived') return false;
    const dueDate = getItemDueDate(item);
    if (!dueDate) return false;
    const due = new Date(dueDate);
    return isPast(startOfDay(due)) && !isToday(due);
  });
}

export function getTodayItems(items: AtomItem[]): AtomItem[] {
  return items.filter((item) => {
    if (item.status === 'completed' || item.status === 'archived') return false;
    const dueDate = getItemDueDate(item);
    if (!dueDate) return false;
    return isToday(new Date(dueDate));
  });
}

export function getFocusItems(items: AtomItem[]): AtomItem[] {
  return items.filter((item) => {
    if (item.status === 'completed' || item.status === 'archived') return false;
    const priority = getItemPriority(item);
    return priority === 'high';
  });
}

export function getInboxItems(items: AtomItem[]): AtomItem[] {
  return items.filter((item) => {
    if (item.status === 'completed' || item.status === 'archived') return false;
    return !item.module;
  });
}

export function getChoreItems(items: AtomItem[]): AtomItem[] {
  return items.filter((item) => {
    if (item.status === 'completed' || item.status === 'archived') return false;
    return item.tags?.includes('chore') || item.tags?.includes('#chore');
  });
}

// ━━━ Exports helpers ━━━

export { MODULE_LABELS, MODULE_COLORS, PRIORITY_LABELS, PRIORITY_ORDER };
