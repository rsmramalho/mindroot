// hooks/useItemMutations.ts
// createItem: aceita CreateItemPayload (compatível com AtomInput)
// updateMutation/completeMutation/etc: usados por Dashboard/Inbox
// alpha.10: toast notifications on success/error, undo on delete/archive

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemService } from '@/service/item-service';
import type { AtomItem, CreateItemPayload, UpdateItemPayload } from '@/types/item';
import { toast } from '@/store/toast-store';

export function useItemMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['items'] });

  const createItem = useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      return itemService.create(payload);
    },
    onSuccess: (item) => {
      invalidate();
      if (item) {
        toast.success('Item criado');
      }
    },
    onError: () => {
      toast.error('Erro ao criar item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateItemPayload }) => {
      return itemService.update(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previous = queryClient.getQueryData<AtomItem[]>(['items']);
      queryClient.setQueryData<AtomItem[]>(['items'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      return { previous, updates };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
      toast.error('Erro ao atualizar item');
    },
    onSuccess: (_data, { updates }, context) => {
      if (updates.archived === true && context?.previous) {
        const previousItems = context.previous;
        toast.success('Item arquivado', {
          undoAction: () => {
            queryClient.setQueryData(['items'], previousItems);
            const id = _data?.id;
            if (id) itemService.update(id, { archived: false });
          },
        });
      } else if (updates.archived !== true) {
        toast.success('Item atualizado');
      }
    },
    onSettled: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => itemService.complete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previous = queryClient.getQueryData<AtomItem[]>(['items']);
      queryClient.setQueryData<AtomItem[]>(['items'], (old) =>
        old?.map((item) =>
          item.id === id ? { ...item, completed: true, completed_at: new Date().toISOString() } : item
        )
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Item concluido');
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
      toast.error('Erro ao concluir item');
    },
    onSettled: invalidate,
  });

  const uncompleteMutation = useMutation({
    mutationFn: async (id: string) => itemService.uncomplete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previous = queryClient.getQueryData<AtomItem[]>(['items']);
      queryClient.setQueryData<AtomItem[]>(['items'], (old) =>
        old?.map((item) =>
          item.id === id ? { ...item, completed: false, completed_at: null } : item
        )
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Item reaberto');
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
      toast.error('Erro ao reabrir item');
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => itemService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previous = queryClient.getQueryData<AtomItem[]>(['items']);
      queryClient.setQueryData<AtomItem[]>(['items'], (old) =>
        old?.filter((item) => item.id !== id)
      );
      return { previous };
    },
    onSuccess: (_data, _id, context) => {
      if (context?.previous) {
        const previousItems = context.previous;
        toast.success('Item excluido', {
          undoAction: () => {
            queryClient.setQueryData(['items'], previousItems);
            queryClient.invalidateQueries({ queryKey: ['items'] });
          },
        });
      } else {
        toast.success('Item excluido');
      }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
      toast.error('Erro ao excluir item');
    },
    onSettled: invalidate,
  });

  return { createItem, updateMutation, completeMutation, uncompleteMutation, deleteMutation };
}
