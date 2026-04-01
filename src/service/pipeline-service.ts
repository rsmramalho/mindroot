// service/pipeline-service.ts — Pipeline Orchestrator
// Full lifecycle: capture → classify → structure → validate → connect → commit
// Builds on itemService, connectionService, fsmService.

import { itemService, connectionService } from './item-service';
import { fsmService } from './fsm-service';
import { getFloorStage } from '@/config/types';
import type { AtomType } from '@/config/types';
import type { AtomItem, AtomModule, AtomRelation } from '@/types/item';

export const pipelineService = {

  async capture(title: string, userId: string): Promise<AtomItem> {
    return itemService.create({
      title,
      user_id: userId,
      state: 'inbox',
      genesis_stage: 1,
      status: 'inbox',
      source: 'mindroot',
      tags: [],
      body: {},
    });
  },

  async classify(itemId: string, type: AtomItem['type'], module: AtomModule): Promise<AtomItem> {
    return fsmService.classify(itemId, type, module);
  },

  async structure(itemId: string, body: Record<string, unknown>, notes?: string): Promise<AtomItem> {
    return fsmService.structure(itemId, body, notes);
  },

  async validate(itemId: string): Promise<AtomItem> {
    return fsmService.validate(itemId);
  },

  async connect(
    itemId: string,
    targetId: string,
    relation: AtomRelation,
    userId: string,
    note?: string,
  ): Promise<AtomItem> {
    await connectionService.create({
      source_id: itemId,
      target_id: targetId,
      relation,
      note,
      user_id: userId,
    });

    // Advance source to connected (5) if at validated (4)
    const item = await itemService.getById(itemId);
    if (item.genesis_stage === 4) {
      return itemService.update(itemId, {
        state: 'connected',
        genesis_stage: 5,
      });
    }
    return item;
  },

  async quickClassifyAndStructure(
    itemId: string,
    type: AtomItem['type'],
    module: AtomModule,
    body: Record<string, unknown> = {},
    notes?: string,
  ): Promise<AtomItem> {
    await fsmService.classify(itemId, type, module);
    return fsmService.structure(itemId, body, notes);
  },

  getItemHealth(item: AtomItem): {
    belowFloor: boolean;
    floor: number;
    currentStage: number;
    nextAction: string;
  } {
    const floor = item.type ? getFloorStage(item.type as AtomType) : 1;
    let nextAction = '';

    switch (item.state) {
      case 'inbox':
        nextAction = 'Classificar (type + module)';
        break;
      case 'classified':
        nextAction = 'Estruturar (body/notes)';
        break;
      case 'structured':
        nextAction = 'Validar';
        break;
      case 'validated':
        nextAction = 'Conectar com outros items';
        break;
      case 'connected':
        nextAction = 'Sera commitado no wrap';
        break;
      case 'propagated':
        nextAction = 'Sera commitado no wrap';
        break;
      case 'committed':
        nextAction = 'Completo';
        break;
      case 'archived':
        nextAction = 'Arquivado';
        break;
      default:
        nextAction = '';
    }

    return {
      belowFloor: item.genesis_stage < floor,
      floor,
      currentStage: item.genesis_stage,
      nextAction,
    };
  },
};
