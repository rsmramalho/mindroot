// service/item-service.ts — Atom Engine Schema v2
// Pure data access. No business logic. Hooks never call Supabase directly.

import { supabase } from './supabase';
import type {
  AtomItem,
  AtomEvent,
  ItemConnection,
  CreateItemPayload,
  UpdateItemPayload,
  CreateConnectionPayload,
  AtomType,
  AtomModule,
  AtomState,
  AtomStatus,
} from '@/types/item';

// ─── Items ───────────────────────────────────────────────

export interface ListItemsFilters {
  type?: AtomType;
  module?: AtomModule;
  state?: AtomState;
  status?: AtomStatus;
  genesis_stage?: number;
  project_id?: string;
}

export const itemService = {
  async create(payload: CreateItemPayload): Promise<AtomItem> {
    const { data, error } = await supabase
      .from('items')
      .insert({
        title: payload.title,
        user_id: payload.user_id,
        type: payload.type ?? null,
        module: payload.module ?? null,
        tags: payload.tags ?? [],
        status: payload.status ?? 'inbox',
        state: payload.state ?? 'inbox',
        genesis_stage: payload.genesis_stage ?? 1,
        project_id: payload.project_id ?? null,
        naming_convention: payload.naming_convention ?? null,
        notes: payload.notes ?? null,
        body: payload.body ?? {},
        source: payload.source ?? 'mindroot',
        created_by: payload.created_by ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AtomItem;
  },

  async getById(id: string): Promise<AtomItem> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AtomItem;
  },

  async update(id: string, payload: UpdateItemPayload): Promise<AtomItem> {
    const { data, error } = await supabase
      .from('items')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AtomItem;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
  },

  async list(userId: string, filters?: ListItemsFilters): Promise<AtomItem[]> {
    let query = supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.module) query = query.eq('module', filters.module);
    if (filters?.state) query = query.eq('state', filters.state);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.genesis_stage) query = query.eq('genesis_stage', filters.genesis_stage);
    if (filters?.project_id) query = query.eq('project_id', filters.project_id);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as AtomItem[];
  },
};

// ─── Connections ─────────────────────────────────────────

export const connectionService = {
  async create(payload: CreateConnectionPayload & { user_id: string }): Promise<ItemConnection> {
    const { data, error } = await supabase
      .from('item_connections')
      .insert({
        user_id: payload.user_id,
        source_id: payload.source_id,
        target_id: payload.target_id,
        relation: payload.relation,
        note: payload.note ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ItemConnection;
  },

  async delete(sourceId: string, targetId: string, relation: string): Promise<void> {
    const { error } = await supabase
      .from('item_connections')
      .delete()
      .eq('source_id', sourceId)
      .eq('target_id', targetId)
      .eq('relation', relation);

    if (error) throw error;
  },

  async getForItem(itemId: string): Promise<ItemConnection[]> {
    const { data, error } = await supabase
      .from('item_connections')
      .select('*')
      .or(`source_id.eq.${itemId},target_id.eq.${itemId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as ItemConnection[];
  },
};

// ─── Events ──────────────────────────────────────────────

export const eventService = {
  async create(
    userId: string,
    sourceId: string,
    eventType: string,
    payload?: Record<string, unknown>,
    targetId?: string,
  ): Promise<AtomEvent> {
    const { data, error } = await supabase
      .from('atom_events')
      .insert({
        user_id: userId,
        source_id: sourceId,
        target_id: targetId ?? null,
        event_type: eventType,
        payload: payload ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as AtomEvent;
  },
};
