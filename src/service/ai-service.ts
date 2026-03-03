// service/ai-service.ts — AI-powered input parsing via Edge Function
// Falls back to local parsing engine if edge function unavailable

import { supabase } from './supabase';
import type { ParsedInput } from '@/types/engine';
import type { ItemType, ItemModule, ItemPriority, Emotion, RitualPeriod } from '@/types/item';

export interface AIParsedResult {
  title: string;
  type: ItemType;
  module: ItemModule | null;
  priority: ItemPriority | null;
  emotion_before: Emotion | null;
  is_chore: boolean;
  due_date: string | null;
  due_time: string | null;
  ritual_period: RitualPeriod | null;
  tags: string[];
}

export const aiService = {
  async parseInput(input: string): Promise<AIParsedResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('parse-input', {
        body: { input },
      });

      if (error) throw error;
      if (!data || !data.title) return null;

      return {
        title: data.title || input,
        type: data.type || 'task',
        module: data.module || null,
        priority: data.priority || null,
        emotion_before: data.emotion_before || null,
        is_chore: data.is_chore || false,
        due_date: data.due_date || null,
        due_time: data.due_time || null,
        ritual_period: data.ritual_period || null,
        tags: data.tags || [],
      };
    } catch {
      // Edge function not available — return null to fall back to local parsing
      return null;
    }
  },

  // Merge AI result with local parsing for best of both worlds
  mergeWithLocal(ai: AIParsedResult, local: ParsedInput): ParsedInput {
    return {
      ...local,
      // AI wins for semantic fields (better at understanding intent)
      title: ai.title || local.title,
      type: ai.type || local.type,
      module: ai.module || local.module,
      priority: ai.priority || local.priority,
      emotion_before: ai.emotion_before || local.emotion_before,
      is_chore: ai.is_chore || local.is_chore,
      ritual_period: ai.ritual_period || local.ritual_period,
      // Local wins for exact token matches (more reliable)
      due_date: local.due_date || ai.due_date,
      due_time: local.due_time || ai.due_time,
      // Merge tags
      tags: [...new Set([...local.tags, ...ai.tags])],
    };
  },
};
