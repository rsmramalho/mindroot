// service/audit-service.ts — Audit Service
// Queries Supabase views (v_orphan_items, v_below_floor, v_inbox_stale)
// for real audit data. Complement to engine/wrap.ts computeAudit (pure/offline).

import { supabase } from './supabase';

export interface AuditReport {
  inbox_count: number;
  below_floor: { id: string; title: string; type: string; genesis_stage: number; required_floor: number }[];
  orphans: { id: string; title: string; type: string; state: string }[];
  stale: { id: string; title: string; created_at: string; days_in_inbox: number }[];
  total_items: number;
  items_by_stage: Record<number, number>;
  items_by_module: Record<string, number>;
}

export const auditService = {

  async getFullReport(): Promise<AuditReport> {
    const [inbox, belowFloor, orphans, stale, total, allItems] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact' }).eq('state', 'inbox'),
      supabase.from('v_below_floor').select('*'),
      supabase.from('v_orphan_items').select('*'),
      supabase.from('v_inbox_stale').select('*'),
      supabase.from('items').select('id', { count: 'exact' }).neq('state', 'archived'),
      supabase.from('items').select('genesis_stage, module').neq('state', 'archived'),
    ]);

    const byStage: Record<number, number> = {};
    const byModule: Record<string, number> = {};
    (allItems.data ?? []).forEach((i: any) => {
      byStage[i.genesis_stage] = (byStage[i.genesis_stage] ?? 0) + 1;
      if (i.module) byModule[i.module] = (byModule[i.module] ?? 0) + 1;
    });

    return {
      inbox_count: inbox.count ?? 0,
      below_floor: (belowFloor.data ?? []) as AuditReport['below_floor'],
      orphans: (orphans.data ?? []) as AuditReport['orphans'],
      stale: (stale.data ?? []) as AuditReport['stale'],
      total_items: total.count ?? 0,
      items_by_stage: byStage,
      items_by_module: byModule,
    };
  },

  async getLightAudit(): Promise<{ inbox: number; stale: number; orphans: number }> {
    const [inbox, stale, orphans] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact' }).eq('state', 'inbox'),
      supabase.from('v_inbox_stale').select('id', { count: 'exact' }),
      supabase.from('v_orphan_items').select('id', { count: 'exact' }),
    ]);
    return {
      inbox: inbox.count ?? 0,
      stale: stale.count ?? 0,
      orphans: orphans.count ?? 0,
    };
  },
};
