// service/triage-service.ts — Triage Orchestrator
import { itemService } from './item-service';
import { aiService, type TriageResult } from './ai-service';
import { pipelineService } from './pipeline-service';
import type { AtomItem, AtomModule } from '@/types/item';
import type { AtomType } from '@/config/types';

export interface TriagedItem {
  item: AtomItem;
  result: TriageResult;
  band: 'auto' | 'suggest' | 'manual';
  processed: boolean;
}

export const triageService = {

  async triageItem(userId: string, item: AtomItem): Promise<TriagedItem> {
    const result = await aiService.classify(item.title);

    if (!result) {
      return {
        item,
        result: {
          title: item.title, type: 'note' as AtomType, module: 'bridge',
          confidence: 0, reasoning: 'AI indisponível',
          tags: [], due_date: null, emotion: null,
        },
        band: 'manual',
        processed: false,
      };
    }

    const band = aiService.getBand(result);

    if (band.action === 'auto') {
      try {
        await pipelineService.quickClassifyAndStructure(
          item.id, result.type as AtomItem['type'], result.module as AtomModule, {},
        );
        return { item, result, band: 'auto', processed: true };
      } catch {
        return { item, result, band: 'suggest', processed: false };
      }
    }

    return { item, result, band: band.action, processed: false };
  },

  async triageInbox(userId: string): Promise<TriagedItem[]> {
    const inbox = await itemService.list(userId, { state: 'inbox' });
    if (inbox.length === 0) return [];

    const results: TriagedItem[] = [];
    const classifyInputs = inbox.map(i => ({ id: i.id, title: i.title }));
    const aiResults = await aiService.classifyBatch(classifyInputs);

    for (const item of inbox) {
      const result = aiResults.get(item.id);

      if (!result) {
        results.push({
          item,
          result: {
            title: item.title, type: 'note' as AtomType, module: 'bridge',
            confidence: 0, reasoning: 'Classificação falhou',
            tags: [], due_date: null, emotion: null,
          },
          band: 'manual',
          processed: false,
        });
        continue;
      }

      const band = aiService.getBand(result);

      if (band.action === 'auto') {
        try {
          await pipelineService.quickClassifyAndStructure(
            item.id, result.type as AtomItem['type'], result.module as AtomModule, {},
          );
          results.push({ item, result, band: 'auto', processed: true });
        } catch {
          results.push({ item, result, band: 'suggest', processed: false });
        }
      } else {
        results.push({ item, result, band: band.action, processed: false });
      }
    }

    return results;
  },

  async confirmSuggestion(itemId: string, result: TriageResult): Promise<AtomItem> {
    return pipelineService.quickClassifyAndStructure(
      itemId, result.type as AtomItem['type'], result.module as AtomModule, {},
    );
  },

  async overrideSuggestion(itemId: string, type: AtomType, module: string): Promise<AtomItem> {
    return pipelineService.quickClassifyAndStructure(
      itemId, type as AtomItem['type'], module as AtomModule, {},
    );
  },
};
