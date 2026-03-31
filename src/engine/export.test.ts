// engine/export.test.ts — Export & backup tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockItem, resetIds } from '@/__test__/mock-factory';
import {
  journalToMarkdown,
  itemsToBackupJson,
  isBackupDue,
  markBackupDone,
  triggerAutoBackup,
} from './export';
import type { BackupPayload } from './export';

beforeEach(() => resetIds());

// ─── journalToMarkdown ─────────────────────────────────────

describe('journalToMarkdown', () => {
  it('returns empty string for no journal items', () => {
    const items = [mockItem({ type: 'task' }), mockItem({ type: 'note' })];
    expect(journalToMarkdown(items)).toBe('');
  });

  it('returns empty string for empty array', () => {
    expect(journalToMarkdown([])).toBe('');
  });

  it('includes log entries', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Hoje foi um bom dia',
        created_at: '2026-03-09T10:30:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).toContain('# MindRoot — Diario');
    expect(md).toContain('Hoje foi um bom dia');
    expect(md).toContain('Entrada');
  });

  it('includes reflections with type label', () => {
    const items = [
      mockItem({
        type: 'reflection',
        title: 'Preciso descansar mais',
        created_at: '2026-03-09T14:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).toContain('Reflexao');
    expect(md).toContain('Preciso descansar mais');
  });

  it('includes emotion metadata', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Reflexao da tarde',
        body: { soul: { emotion_before: 'ansioso', emotion_after: 'calmo', energy_level: null, needs_checkin: false, ritual_slot: null } },
        created_at: '2026-03-09T15:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).toContain('antes: ansioso');
    expect(md).toContain('depois: calmo');
  });

  it('includes module and tags', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Nota de trabalho',
        module: 'work',
        tags: ['foco', 'projeto'],
        created_at: '2026-03-09T09:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).toContain('modulo: Trabalho');
    expect(md).toContain('tags: foco, projeto');
  });

  it('includes notes', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Titulo',
        notes: 'Corpo detalhado da entrada',
        created_at: '2026-03-09T11:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).toContain('Corpo detalhado da entrada');
  });

  it('excludes archived items', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Visivel',
        created_at: '2026-03-09T10:00:00.000Z',
      }),
      mockItem({
        type: 'log',
        title: 'Arquivado',
        status: 'archived',
        created_at: '2026-03-09T11:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).toContain('Visivel');
    expect(md).not.toContain('Arquivado');
  });

  it('groups entries by date', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Dia 1',
        created_at: '2026-03-08T10:00:00.000Z',
      }),
      mockItem({
        type: 'log',
        title: 'Dia 2',
        created_at: '2026-03-09T10:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    // Should have two date headers (## sections)
    const h2Count = (md.match(/^## /gm) || []).length;
    expect(h2Count).toBe(2);
  });

  it('sorts entries newest first', () => {
    const items = [
      mockItem({
        type: 'log',
        title: 'Antigo',
        created_at: '2026-03-07T10:00:00.000Z',
      }),
      mockItem({
        type: 'log',
        title: 'Recente',
        created_at: '2026-03-09T10:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    const recentIdx = md.indexOf('Recente');
    const antigoIdx = md.indexOf('Antigo');
    expect(recentIdx).toBeLessThan(antigoIdx);
  });

  it('excludes non-journal types', () => {
    const items = [
      mockItem({ type: 'task', title: 'Tarefa qualquer' }),
      mockItem({ type: 'habit', title: 'Habito' }),
      mockItem({
        type: 'log',
        title: 'Diario real',
        created_at: '2026-03-09T10:00:00.000Z',
      }),
    ];
    const md = journalToMarkdown(items);
    expect(md).not.toContain('Tarefa qualquer');
    expect(md).not.toContain('Habito');
    expect(md).toContain('Diario real');
  });
});

// ─── itemsToBackupJson ──────────────────────────────────────

describe('itemsToBackupJson', () => {
  it('produces valid JSON', () => {
    const items = [mockItem(), mockItem()];
    const json = itemsToBackupJson(items);
    const parsed = JSON.parse(json) as BackupPayload;
    expect(parsed.meta).toBeDefined();
    expect(parsed.items).toBeInstanceOf(Array);
  });

  it('includes meta with version, date, count', () => {
    const items = [mockItem(), mockItem(), mockItem()];
    const parsed = JSON.parse(itemsToBackupJson(items)) as BackupPayload;
    expect(parsed.meta.version).toMatch(/^v1\.0\.0/);
    expect(parsed.meta.exportedAt).toBeDefined();
    expect(parsed.meta.itemCount).toBe(3);
  });

  it('excludes archived items by default', () => {
    const items = [
      mockItem({ status: 'active' }),
      mockItem({ status: 'archived' }),
    ];
    const parsed = JSON.parse(itemsToBackupJson(items)) as BackupPayload;
    expect(parsed.items).toHaveLength(1);
    expect(parsed.meta.itemCount).toBe(1);
  });

  it('includes archived when option set', () => {
    const items = [
      mockItem({ status: 'active' }),
      mockItem({ status: 'archived' }),
    ];
    const parsed = JSON.parse(
      itemsToBackupJson(items, { includeArchived: true })
    ) as BackupPayload;
    expect(parsed.items).toHaveLength(2);
    expect(parsed.meta.itemCount).toBe(2);
  });

  it('preserves all item fields', () => {
    const item = mockItem({
      title: 'Test',
      module: 'work',
      tags: ['a', 'b'],
      body: { soul: { emotion_before: 'focado', emotion_after: null, energy_level: 'medium', needs_checkin: false, ritual_slot: null } },
    });
    const parsed = JSON.parse(itemsToBackupJson([item])) as BackupPayload;
    const exported = parsed.items[0];
    expect(exported.title).toBe('Test');
    expect(exported.module).toBe('work');
    expect(exported.tags).toEqual(['a', 'b']);
    expect((exported.body?.soul as any)?.emotion_before).toBe('focado');
    expect((exported.body?.soul as any)?.energy_level).toBe('medium');
  });

  it('handles empty array', () => {
    const parsed = JSON.parse(itemsToBackupJson([])) as BackupPayload;
    expect(parsed.items).toEqual([]);
    expect(parsed.meta.itemCount).toBe(0);
  });
});

// ─── Auto Backup ────────────────────────────────────────────

describe('auto backup scheduling', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: () => null,
  } as Storage;

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isBackupDue returns true when no previous backup', () => {
    expect(isBackupDue()).toBe(true);
  });

  it('isBackupDue returns false right after marking done', () => {
    markBackupDone();
    expect(isBackupDue()).toBe(false);
  });

  it('isBackupDue returns true after 7 days', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem('mindroot:lastBackup', String(eightDaysAgo));
    expect(isBackupDue()).toBe(true);
  });

  it('triggerAutoBackup returns false when not due', () => {
    markBackupDone();
    const items = [mockItem(), mockItem(), mockItem()];
    expect(triggerAutoBackup(items)).toBe(false);
  });

  it('triggerAutoBackup returns false when too few items', () => {
    const items = [mockItem(), mockItem()];
    expect(triggerAutoBackup(items)).toBe(false);
  });
});
