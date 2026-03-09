// hooks/useOfflineSync.ts — Listen online/offline events, auto-sync queue
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineStore } from '@/store/offline-store';
import { itemService } from '@/service/item-service';
import {
  getAllEntries,
  dequeue,
  incrementRetry,
  pendingCount,
  compactQueue,
  MAX_RETRIES,
} from '@/engine/offline-queue';
import type { QueueEntry } from '@/engine/offline-queue';
import type { CreateItemPayload, UpdateItemPayload } from '@/types/item';
import { toast } from '@/store/toast-store';

async function processEntry(entry: QueueEntry): Promise<void> {
  switch (entry.action) {
    case 'create':
      await itemService.create(entry.payload as unknown as CreateItemPayload);
      break;
    case 'update':
      if (entry.itemId) {
        await itemService.update(entry.itemId, entry.payload as unknown as UpdateItemPayload);
      }
      break;
    case 'complete':
      if (entry.itemId) await itemService.complete(entry.itemId);
      break;
    case 'uncomplete':
      if (entry.itemId) await itemService.uncomplete(entry.itemId);
      break;
    case 'delete':
      if (entry.itemId) await itemService.delete(entry.itemId);
      break;
  }
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { setOnline, setPendingCount, setSyncing, isSyncing } = useOfflineStore();
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      const count = await pendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB unavailable
    }
  }, [setPendingCount]);

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const raw = await getAllEntries();
      if (raw.length === 0) { return; }

      const entries = compactQueue(raw);
      let synced = 0;
      let failed = 0;

      for (const entry of entries) {
        try {
          await processEntry(entry);
          // Dequeue all original entries for this item (compacted)
          for (const original of raw.filter((r) =>
            entry.itemId ? r.itemId === entry.itemId : r.id === entry.id
          )) {
            await dequeue(original.id);
          }
          synced++;
        } catch {
          if (entry.retries >= MAX_RETRIES) {
            await dequeue(entry.id);
            failed++;
          } else {
            await incrementRetry(entry.id);
          }
        }
      }

      if (synced > 0) {
        toast.success(`${synced} ${synced === 1 ? 'item sincronizado' : 'itens sincronizados'}`);
        queryClient.invalidateQueries({ queryKey: ['items'] });
      }
      if (failed > 0) {
        toast.error(`${failed} ${failed === 1 ? 'item falhou' : 'itens falharam'} ao sincronizar`);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refreshPending();
    }
  }, [setSyncing, queryClient, refreshPending]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.info('Conexao restabelecida');
      sync();
    };
    const handleOffline = () => {
      setOnline(false);
      toast.info('Sem conexao — alteracoes serao salvas localmente');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online and has pending
    refreshPending().then(() => {
      if (navigator.onLine) sync();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, sync, refreshPending]);

  return { sync, refreshPending, isSyncing };
}
