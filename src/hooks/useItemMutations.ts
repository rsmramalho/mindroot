// hooks/useItemMutations.ts
// createItem: aceita CreateItemPayload (compatível com AtomInput)
// updateMutation/completeMutation/etc: usados por Dashboard/Inbox

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemService } from '@/service/item-service';
import type { AtomItem, CreateItemPayload, UpdateItemPayload } from '@/types/item';

export function useItemMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['items'] });

  const createItem = useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      return itemService.create(payload);
    },
    onSuccess: invalidate,
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
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
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
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
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
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
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
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
    },
    onSettled: invalidate,
  });

  return { createItem, updateMutation, completeMutation, uncompleteMutation, deleteMutation };
}
