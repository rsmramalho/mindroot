// service/ai-service.ts — Triage classification via Edge Function
// Genesis v5 compliant: 23 types, 8 modules, confidence scoring

import { supabase } from './supabase';
import type { AtomType } from '@/config/types';
import type { ParsedInput } from '@/types/engine';
import type { AtomModule, Priority, Emotion, RitualSlot } from '@/types/item';

// Backward compat: old interface used by AtomInput and AiPreview
export interface AIParsedResult {
  title: string;
  type: AtomType;
  module: AtomModule | null;
  priority: Priority | null;
  emotion_before: Emotion | null;
  is_chore: boolean;
  due_date: string | null;
  due_time: string | null;
  ritual_period: RitualSlot | null;
  tags: string[];
}

export interface TriageResult {
  title: string;
  type: AtomType;
  module: string;
  confidence: number;
  reasoning: string;
  tags: string[];
  due_date: string | null;
  emotion: string | null;
}

export interface TriageBand {
  action: 'auto' | 'suggest' | 'manual';
  threshold: number;
}

const ACTIONABLE_TYPES: string[] = ['task', 'project', 'spec', 'habit'];
const ACTIONABLE_THRESHOLD = 95;
const PASSIVE_THRESHOLD = 90;

export const aiService = {

  async classify(input: string, context?: string): Promise<TriageResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('triage-classify', {
        body: { input, context },
      });
      if (error) throw error;
      if (!data || !data.title) return null;
      return {
        title: data.title || input,
        type: data.type as AtomType,
        module: data.module || 'bridge',
        confidence: data.confidence ?? 0,
        reasoning: data.reasoning || '',
        tags: data.tags || [],
        due_date: data.due_date || null,
        emotion: data.emotion || null,
      };
    } catch {
      return null;
    }
  },

  async classifyBatch(inputs: { id: string; title: string }[]): Promise<Map<string, TriageResult>> {
    const results = new Map<string, TriageResult>();
    const chunks = [];
    for (let i = 0; i < inputs.length; i += 5) {
      chunks.push(inputs.slice(i, i + 5));
    }
    for (const chunk of chunks) {
      const promises = chunk.map(async (item) => {
        const result = await this.classify(item.title);
        if (result) results.set(item.id, result);
      });
      await Promise.all(promises);
    }
    return results;
  },

  getBand(result: TriageResult): TriageBand {
    const isActionable = ACTIONABLE_TYPES.includes(result.type);
    const threshold = isActionable ? ACTIONABLE_THRESHOLD : PASSIVE_THRESHOLD;
    if (result.confidence >= threshold) {
      return { action: 'auto', threshold };
    } else if (result.confidence >= 60) {
      return { action: 'suggest', threshold };
    } else {
      return { action: 'manual', threshold: 60 };
    }
  },

  isActionableType(type: string): boolean {
    return ACTIONABLE_TYPES.includes(type);
  },

  // Backward compat: used by AtomInput for real-time AI preview
  async parseInput(input: string): Promise<AIParsedResult | null> {
    const result = await this.classify(input);
    if (!result) return null;
    return {
      title: result.title,
      type: result.type,
      module: (result.module as AtomModule) || null,
      priority: null,
      emotion_before: (result.emotion as Emotion) || null,
      is_chore: false,
      due_date: result.due_date,
      due_time: null,
      ritual_period: null,
      tags: result.tags,
    };
  },

  // Backward compat: used by AtomInput to merge AI + local parsing
  mergeWithLocal(ai: AIParsedResult, local: ParsedInput): ParsedInput {
    return {
      ...local,
      title: ai.title || local.title,
      type: ai.type || local.type,
      module: ai.module || local.module,
      priority: ai.priority || local.priority,
      emotion_before: ai.emotion_before || local.emotion_before,
      is_chore: ai.is_chore || local.is_chore,
      ritual_period: ai.ritual_period || local.ritual_period,
      due_date: local.due_date || ai.due_date,
      due_time: local.due_time || ai.due_time,
      tags: [...new Set([...local.tags, ...ai.tags])],
    };
  },
};
