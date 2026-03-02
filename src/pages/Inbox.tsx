// pages/Inbox.tsx — Classificar itens sem módulo
import { useState, useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import type { ItemModule, ItemPriority } from '@/types/item';
import { sortItems } from '@/engine/dashboard-filters';
import ItemRow from '@/components/shared/ItemRow';
import InboxActions from '@/components/inbox/InboxActions';
import EmptyState from '@/components/shared/EmptyState';
import { startOfDay, formatISO } from 'date-fns';

export function InboxPage() {
  const { inboxItems: rawInbox, isLoading } = useItems();
  const { updateMutation, completeMutation, deleteMutation } = useItemMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inboxItems = useMemo(
    () => sortItems(rawInbox, 'created_at', 'desc'),
    [rawInbox]
  );

  const handleSetModule = (id: string, module: string) => {
    updateMutation.mutate({ id, updates: { module: module as ItemModule } });
    setSelectedId(null);
  };

  const handleSetPriority = (id: string, priority: string) => {
    updateMutation.mutate({ id, updates: { priority: priority as ItemPriority } });
  };

  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, updates: { archived: true } });
    setSelectedId(null);
  };

  const handlePromote = (id: string) => {
    updateMutation.mutate({
      id,
      updates: { due_date: formatISO(startOfDay(new Date())) },
    });
    setSelectedId(null);
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
    setSelectedId(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="font-serif text-lg text-muted/40 font-light animate-pulse">
          carregando...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="font-serif text-xl font-light text-light tracking-tight">
          Inbox
        </h2>
        <span className="font-mono text-xs text-muted/40">
          {inboxItems.length}
        </span>
      </div>

      {inboxItems.length === 0 && (
        <EmptyState message="Inbox vazio" submessage="Itens sem módulo aparecem aqui" />
      )}

      {inboxItems.map((item) => (
        <div key={item.id}>
          <div
            onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
            className="cursor-pointer"
          >
            <ItemRow
              item={item}
              onComplete={handleComplete}
              onDelete={handleDelete}
              showActions={false}
            />
          </div>

          {selectedId === item.id && (
            <div className="pl-10 pr-2 pb-2">
              <InboxActions
                itemId={item.id}
                currentModule={item.module}
                currentPriority={item.priority}
                onSetModule={handleSetModule}
                onSetPriority={handleSetPriority}
                onArchive={handleArchive}
                onPromote={handlePromote}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
