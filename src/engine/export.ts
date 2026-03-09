// engine/export.ts — Export & backup logic
// Pure functions: items → markdown, items → JSON, auto-backup scheduling

import type { AtomItem } from '@/types/item';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ──────────────────────────────────────────────────

export interface ExportOptions {
  includeArchived?: boolean;
}

export interface BackupMeta {
  version: string;
  exportedAt: string;
  itemCount: number;
}

export interface BackupPayload {
  meta: BackupMeta;
  items: AtomItem[];
}

// ─── Constants ──────────────────────────────────────────────

const APP_VERSION = 'v1.0.0-alpha.19';
const BACKUP_INTERVAL_KEY = 'mindroot:lastBackup';
const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MODULE_LABELS: Record<string, string> = {
  purpose: 'Proposito',
  work: 'Trabalho',
  family: 'Familia',
  body: 'Corpo',
  mind: 'Mente',
  soul: 'Alma',
};

const EMOTION_LABELS: Record<string, string> = {
  calmo: 'calmo',
  focado: 'focado',
  grato: 'grato',
  animado: 'animado',
  confiante: 'confiante',
  ansioso: 'ansioso',
  cansado: 'cansado',
  frustrado: 'frustrado',
  triste: 'triste',
  perdido: 'perdido',
  neutro: 'neutro',
};

// ─── Journal → Markdown ─────────────────────────────────────

export function journalToMarkdown(items: AtomItem[]): string {
  const journalItems = items
    .filter((i) => (i.type === 'journal' || i.type === 'reflection') && !i.archived)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (journalItems.length === 0) return '';

  const lines: string[] = ['# MindRoot — Diario', ''];

  // Group by date
  const groups = new Map<string, AtomItem[]>();
  for (const item of journalItems) {
    const dateKey = format(parseISO(item.created_at), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(item);
  }

  for (const [dateKey, entries] of groups) {
    const dateLabel = format(parseISO(dateKey), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    lines.push(`## ${dateLabel}`, '');

    for (const entry of entries) {
      const time = format(parseISO(entry.created_at), 'HH:mm');
      const typeLabel = entry.type === 'reflection' ? 'Reflexao' : 'Entrada';
      lines.push(`### ${time} — ${typeLabel}`);
      lines.push('');
      lines.push(entry.title);
      lines.push('');

      if (entry.description) {
        lines.push(entry.description);
        lines.push('');
      }

      // Metadata
      const meta: string[] = [];
      if (entry.emotion_before) meta.push(`antes: ${EMOTION_LABELS[entry.emotion_before] || entry.emotion_before}`);
      if (entry.emotion_after) meta.push(`depois: ${EMOTION_LABELS[entry.emotion_after] || entry.emotion_after}`);
      if (entry.module) meta.push(`modulo: ${MODULE_LABELS[entry.module] || entry.module}`);
      if (entry.tags && entry.tags.length > 0) meta.push(`tags: ${entry.tags.join(', ')}`);

      if (meta.length > 0) {
        lines.push(`> ${meta.join(' | ')}`);
        lines.push('');
      }

      lines.push('---', '');
    }
  }

  return lines.join('\n');
}

// ─── All Data → JSON ────────────────────────────────────────

export function itemsToBackupJson(
  items: AtomItem[],
  options: ExportOptions = {}
): string {
  const filtered = options.includeArchived
    ? items
    : items.filter((i) => !i.archived);

  const payload: BackupPayload = {
    meta: {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      itemCount: filtered.length,
    },
    items: filtered,
  };

  return JSON.stringify(payload, null, 2);
}

// ─── File Download Helper ───────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Export Triggers ────────────────────────────────────────

export function exportJournalMarkdown(items: AtomItem[]): void {
  const md = journalToMarkdown(items);
  if (!md) return;
  const date = format(new Date(), 'yyyy-MM-dd');
  downloadFile(md, `mindroot-diario-${date}.md`, 'text/markdown;charset=utf-8');
}

export function exportAllDataJson(items: AtomItem[], includeArchived = true): void {
  const json = itemsToBackupJson(items, { includeArchived });
  const date = format(new Date(), 'yyyy-MM-dd');
  downloadFile(json, `mindroot-backup-${date}.json`, 'application/json;charset=utf-8');
}

// ─── Auto Backup ────────────────────────────────────────────

export function isBackupDue(): boolean {
  try {
    const last = localStorage.getItem(BACKUP_INTERVAL_KEY);
    if (!last) return true;
    const elapsed = Date.now() - Number(last);
    return elapsed >= BACKUP_INTERVAL_MS;
  } catch {
    return false;
  }
}

export function markBackupDone(): void {
  try {
    localStorage.setItem(BACKUP_INTERVAL_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable
  }
}

export function triggerAutoBackup(items: AtomItem[]): boolean {
  if (!isBackupDue()) return false;
  if (items.length < 3) return false; // not enough data to backup
  exportAllDataJson(items, true);
  markBackupDone();
  return true;
}
