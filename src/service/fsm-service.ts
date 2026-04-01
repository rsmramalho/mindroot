// service/fsm-service.ts — FSM Runtime
// Bridges pure FSM engine logic with Supabase persistence + RPCs.
// Uses existing itemService for mutations and engine/fsm for gate checks.

import { supabase } from './supabase';
import { itemService } from './item-service';
import { canAdvance, advance, getItemState } from '@/engine/fsm';
import { getFloorStage, getTypeSchema } from '@/config/types';
import type { AtomType } from '@/config/types';
import type { AtomItem, AtomModule, UpdateItemPayload } from '@/types/item';

export interface GateResult {
  passed: boolean;
  reason?: string;
}

export const fsmService = {

  checkGate(item: AtomItem, targetStage: number): GateResult {
    const result = canAdvance(item, targetStage);
    return { passed: result.allowed, reason: result.reason };
  },

  async advance(itemId: string): Promise<AtomItem> {
    const item = await itemService.getById(itemId);
    if (item.status === 'archived') throw new Error('Item arquivado');
    if (item.state === 'committed') throw new Error('Item ja commitado');

    const nextStage = item.genesis_stage + 1;
    if (nextStage > 7) throw new Error('Ja no estagio maximo');

    const result = advance(item, nextStage);
    if (!result) {
      const gate = canAdvance(item, nextStage);
      throw new Error(`Gate falhou: ${gate.reason ?? 'desconhecido'}`);
    }

    return itemService.update(itemId, {
      state: result.state,
      genesis_stage: result.genesis_stage,
    });
  },

  async classify(itemId: string, type: AtomItem['type'], module: AtomModule): Promise<AtomItem> {
    const item = await itemService.getById(itemId);
    if (item.genesis_stage !== 1) throw new Error('Item nao esta no inbox');

    return itemService.update(itemId, {
      type,
      module,
      state: 'classified',
      genesis_stage: 2,
    } as UpdateItemPayload);
  },

  async structure(itemId: string, body: Record<string, unknown>, notes?: string): Promise<AtomItem> {
    const item = await itemService.getById(itemId);
    if (item.genesis_stage !== 2) throw new Error('Item nao esta no estagio 2');

    const updates: UpdateItemPayload = {
      body: { ...item.body, ...body },
      state: 'structured',
      genesis_stage: 3,
    };
    if (notes !== undefined) updates.notes = notes;

    // Auto-generate naming convention from type schema
    if (item.type) {
      const schema = getTypeSchema(item.type as AtomType);
      if (schema?.naming) {
        updates.naming_convention = schema.naming.replace(
          '[description]',
          item.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
        );
      }
    }

    return itemService.update(itemId, updates);
  },

  async validate(itemId: string): Promise<AtomItem> {
    const item = await itemService.getById(itemId);
    if (item.genesis_stage !== 3) throw new Error('Item nao esta no estagio 3');

    return itemService.update(itemId, {
      state: 'validated',
      genesis_stage: 4,
    });
  },

  // ─── Supabase RPCs ─────────────────────────────────────

  async morph(itemId: string, newType: AtomItem['type']): Promise<string> {
    const { data, error } = await supabase.rpc('morph_item', {
      p_item_id: itemId,
      p_new_type: newType,
    });
    if (error) throw error;
    return data;
  },

  async decay(itemId: string): Promise<string> {
    const { data, error } = await supabase.rpc('decay_item', {
      p_item_id: itemId,
    });
    if (error) throw error;
    return data;
  },

  async commit(itemId: string): Promise<string> {
    const { data, error } = await supabase.rpc('commit_item', {
      p_item_id: itemId,
    });
    if (error) throw error;
    return data;
  },

  isBelowFloor(item: AtomItem): boolean {
    if (!item.type) return false;
    return item.genesis_stage < getFloorStage(item.type as AtomType);
  },
};
