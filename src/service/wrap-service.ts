// service/wrap-service.ts — Wrap Persistence
// Collects wrap data from Supabase and persists completed wraps.
// Uses existing engine/wrap.ts for pure logic, itemService for CRUD.

import { supabase } from './supabase';
import { itemService } from './item-service';
import { fsmService } from './fsm-service';
import type { AtomItem, Emotion, EnergyLevel } from '@/types/item';

// ─── Wrap Session Shape ───────────────────────────────────

export interface WrapSession {
  created: { item_id: string; type: string; title: string; genesis_stage: number }[];
  modified: { item_id: string; field: string; from: string; to: string }[];
  decided: string[];
  connections: { source_id: string; target_id: string; relation: string }[];
  seeds: { title: string; status: 'approved' | 'rejected'; new_item_id: string | null }[];
  soul: {
    aurora: { emotion: Emotion; energy: EnergyLevel } | null;
    intention: string | null;
    tasks: { item_id: string; emotion_after: Emotion }[];
    crepusculo: { emotion: Emotion; energy: EnergyLevel } | null;
    shift: string | null;
  };
  audit: {
    inbox_count: number;
    below_floor: { id: string; title: string; type: string; stage: number; required: number }[];
    orphans: { id: string; title: string; type: string }[];
    stale_count: number;
  };
  next: string[];
}

// ─── Service ──────────────────────────────────────────────

export const wrapService = {

  async collectWrapData(): Promise<Partial<WrapSession>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: todayItems } = await supabase
      .from('items')
      .select('*')
      .gte('created_at', todayISO)
      .neq('type', 'wrap')
      .order('created_at', { ascending: true });

    // Audit data from views
    const [inbox, belowFloor, orphans, stale] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact' }).eq('state', 'inbox'),
      supabase.from('v_below_floor').select('*'),
      supabase.from('v_orphan_items').select('*'),
      supabase.from('v_inbox_stale').select('id', { count: 'exact' }),
    ]);

    return {
      created: (todayItems ?? []).map((i: AtomItem) => ({
        item_id: i.id,
        type: i.type ?? 'unknown',
        title: i.title,
        genesis_stage: i.genesis_stage,
      })),
      modified: [],
      audit: {
        inbox_count: inbox.count ?? 0,
        below_floor: (belowFloor.data ?? []).map((i: any) => ({
          id: i.id,
          title: i.title,
          type: i.type,
          stage: i.genesis_stage,
          required: i.required_floor,
        })),
        orphans: (orphans.data ?? []).map((i: any) => ({
          id: i.id,
          title: i.title,
          type: i.type,
        })),
        stale_count: stale.count ?? 0,
      },
    };
  },

  async commitWrap(session: WrapSession, userId: string): Promise<AtomItem> {
    const now = new Date();
    const title = `Wrap — ${now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`;

    const wrap = await itemService.create({
      title,
      user_id: userId,
      type: 'wrap',
      module: 'bridge',
      state: 'committed',
      genesis_stage: 7,
      status: 'completed',
      source: 'mindroot',
      tags: ['wrap'],
      body: session as unknown as Record<string, unknown>,
    });

    // Commit items created today at stage 3+
    if (session.created) {
      for (const created of session.created) {
        if (created.genesis_stage >= 3) {
          try {
            await fsmService.commit(created.item_id);
          } catch {
            // Skip items that can't be committed (already committed, archived, etc.)
          }
        }
      }
    }

    return wrap;
  },

  async getLastWrap(): Promise<AtomItem | null> {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('type', 'wrap')
      .eq('state', 'committed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return (data as AtomItem) ?? null;
  },
};
