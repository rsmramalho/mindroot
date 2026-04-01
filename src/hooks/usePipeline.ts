// hooks/usePipeline.ts — Pipeline operations for components
// Wraps pipelineService + fsmService with TanStack Query cache invalidation.

import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { pipelineService } from '@/service/pipeline-service';
import { fsmService } from '@/service/fsm-service';
import { toast } from '@/store/toast-store';
import type { AtomItem, AtomModule, AtomRelation } from '@/types/item';

export function usePipeline() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['items'] });

  const capture = async (title: string): Promise<AtomItem | null> => {
    if (!user) return null;
    try {
      const item = await pipelineService.capture(title, user.id);
      invalidate();
      toast.success('Item capturado');
      return item;
    } catch {
      toast.error('Erro ao capturar item');
      return null;
    }
  };

  const classify = async (itemId: string, type: AtomItem['type'], module: AtomModule): Promise<AtomItem | null> => {
    try {
      const item = await pipelineService.classify(itemId, type, module);
      invalidate();
      toast.success('Item classificado');
      return item;
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao classificar');
      return null;
    }
  };

  const structure = async (itemId: string, body: Record<string, unknown>, notes?: string): Promise<AtomItem | null> => {
    try {
      const item = await pipelineService.structure(itemId, body, notes);
      invalidate();
      toast.success('Item estruturado');
      return item;
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao estruturar');
      return null;
    }
  };

  const validate = async (itemId: string): Promise<AtomItem | null> => {
    try {
      const item = await pipelineService.validate(itemId);
      invalidate();
      toast.success('Item validado');
      return item;
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao validar');
      return null;
    }
  };

  const connect = async (
    itemId: string, targetId: string, relation: AtomRelation, note?: string,
  ): Promise<AtomItem | null> => {
    if (!user) return null;
    try {
      const item = await pipelineService.connect(itemId, targetId, relation, user.id, note);
      invalidate();
      toast.success('Conexao criada');
      return item;
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao conectar');
      return null;
    }
  };

  const quickClassify = async (
    itemId: string, type: AtomItem['type'], module: AtomModule,
    body: Record<string, unknown> = {}, notes?: string,
  ): Promise<AtomItem | null> => {
    try {
      const item = await pipelineService.quickClassifyAndStructure(itemId, type, module, body, notes);
      invalidate();
      toast.success('Item classificado e estruturado');
      return item;
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao classificar');
      return null;
    }
  };

  const morph = async (itemId: string, newType: AtomItem['type']): Promise<void> => {
    try {
      await fsmService.morph(itemId, newType);
      invalidate();
      toast.success('Item transformado (morph)');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro no morph');
    }
  };

  const decay = async (itemId: string): Promise<void> => {
    try {
      await fsmService.decay(itemId);
      invalidate();
      toast.success('Item decaiu — seed criado no inbox');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro no decay');
    }
  };

  const commit = async (itemId: string): Promise<void> => {
    try {
      await fsmService.commit(itemId);
      invalidate();
      toast.success('Item commitado');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao commitar');
    }
  };

  return {
    capture,
    classify,
    structure,
    validate,
    connect,
    quickClassify,
    morph,
    decay,
    commit,
    getHealth: pipelineService.getItemHealth,
  };
}
