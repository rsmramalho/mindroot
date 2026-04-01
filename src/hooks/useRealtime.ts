// hooks/useRealtime.ts — Supabase Realtime subscriptions
// Invalidates TanStack Query cache when items change in the database.

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/service/supabase';
import { useAppStore } from '@/store/app-store';

export function useRealtime() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['items'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
