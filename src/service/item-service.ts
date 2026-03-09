// service/item-service.ts — CRUD com mapper + offline queue
// Hooks NÃO chamam Supabase direto. Sempre via service.

import { supabase } from './supabase';
import type { AtomItem, CreateItemPayload, UpdateItemPayload } from '@/types/item';
import { enqueue } from '@/engine/offline-queue';
import { useOfflineStore } from '@/store/offline-store';

// ─── Row ↔ Item mapper ─────────────────────────────────────

function mapRowToItem(row: Record<string, unknown>): AtomItem {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    type: (row.type as AtomItem['type']) || 'task',
    module: (row.module as AtomItem['module']) || null,
    priority: (row.priority as AtomItem['priority']) || null,
    tags: (row.tags as string[]) || [],
    parent_id: (row.parent_id as string) || null,
    completed: (row.completed as boolean) || false,
    completed_at: (row.completed_at as string) || null,
    archived: (row.archived as boolean) || false,
    due_date: (row.due_date as string) || null,
    due_time: (row.due_time as string) || null,
    recurrence: (row.recurrence as string) || null,
    ritual_period: (row.ritual_period as AtomItem['ritual_period']) || null,
    emotion_before: (row.emotion_before as AtomItem['emotion_before']) || null,
    emotion_after: (row.emotion_after as AtomItem['emotion_after']) || null,
    needs_checkin: (row.needs_checkin as boolean) || false,
    is_chore: (row.is_chore as boolean) || false,
    energy_cost: (row.energy_cost as number) || null,
    description: (row.description as string) || null,
    context: (row.context as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ─── Offline helpers ────────────────────────────────────────

function isOffline(): boolean {
  return !useOfflineStore.getState().isOnline;
}

function bumpPending() {
  const store = useOfflineStore.getState();
  store.setPendingCount(store.pendingCount + 1);
}

function makeTempItem(payload: CreateItemPayload): AtomItem {
  const now = new Date().toISOString();
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: payload.user_id,
    title: payload.title,
    type: payload.type,
    module: payload.module ?? null,
    priority: payload.priority ?? null,
    tags: payload.tags ?? [],
    parent_id: payload.parent_id ?? null,
    completed: false,
    completed_at: null,
    archived: false,
    due_date: payload.due_date ?? null,
    due_time: payload.due_time ?? null,
    recurrence: payload.recurrence ?? null,
    ritual_period: payload.ritual_period ?? null,
    emotion_before: payload.emotion_before ?? null,
    emotion_after: payload.emotion_after ?? null,
    needs_checkin: payload.needs_checkin ?? false,
    is_chore: payload.is_chore ?? false,
    energy_cost: payload.energy_cost ?? null,
    description: payload.description ?? null,
    context: payload.context ?? null,
    created_at: now,
    updated_at: now,
  };
}

// ─── Service ────────────────────────────────────────────────

export const itemService = {
  async list(userId: string): Promise<AtomItem[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToItem);
  },

  async getById(id: string): Promise<AtomItem> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapRowToItem(data);
  },

  async create(payload: CreateItemPayload): Promise<AtomItem> {
    if (isOffline()) {
      await enqueue('create', null, payload as unknown as Record<string, unknown>);
      bumpPending();
      return makeTempItem(payload);
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        ...payload,
        completed: false,
        archived: false,
        needs_checkin: payload.needs_checkin ?? false,
        is_chore: payload.is_chore ?? false,
        tags: payload.tags ?? [],
      })
      .select()
      .single();

    if (error) throw error;
    return mapRowToItem(data);
  },

  async update(id: string, payload: UpdateItemPayload): Promise<AtomItem> {
    // Integrity guard: reflections can't be completed
    if (payload.completed && payload.type === 'reflection') {
      throw new Error('Reflections cannot be completed');
    }

    if (isOffline()) {
      await enqueue('update', id, payload as unknown as Record<string, unknown>);
      bumpPending();
      // Return optimistic version (caller already has optimistic update via TanStack)
      return { id } as AtomItem;
    }

    const { data, error } = await supabase
      .from('items')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRowToItem(data);
  },

  async delete(id: string): Promise<void> {
    if (isOffline()) {
      await enqueue('delete', id);
      bumpPending();
      return;
    }

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
  },

  async complete(id: string): Promise<AtomItem> {
    if (isOffline()) {
      await enqueue('complete', id);
      bumpPending();
      return { id, completed: true, completed_at: new Date().toISOString() } as AtomItem;
    }

    return this.update(id, {
      completed: true,
      completed_at: new Date().toISOString(),
    });
  },

  async uncomplete(id: string): Promise<AtomItem> {
    if (isOffline()) {
      await enqueue('uncomplete', id);
      bumpPending();
      return { id, completed: false, completed_at: null } as AtomItem;
    }

    return this.update(id, {
      completed: false,
      completed_at: null,
    });
  },
};
