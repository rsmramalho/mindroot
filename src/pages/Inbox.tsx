// pages/Inbox.tsx — Classificar itens sem módulo
// alpha.8: EditSheet + ConfirmDialog integration
import { useState, useMemo, useCallback } from 'react';
import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import type { AtomItem, AtomModule, Priority, UpdateItemPayload } from '@/types/item';
import { sortItems } from '@/engine/dashboard-filters';
import ItemRow from '@/components/shared/ItemRow';
import InboxActions from '@/components/inbox/InboxActions';
import EmptyState from '@/components/shared/EmptyState';
import EditSheet from '@/components/shared/EditSheet';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { ListSkeleton } from '@/components/shared/Skeleton';
import { startOfDay, formatISO } from 'date-fns';

export function InboxPage() {
  const { inboxItems: rawInbox, isLoading } = useItems();
  const { updateMutation, completeMutation, deleteMutation } = useItemMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Edit sheet state
  const [editingItem, setEditingItem] = useState<AtomItem | null>(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inboxItems = useMemo(
    () => sortItems(rawInbox, 'created_at', 'desc'),
    [rawInbox]
  );

  const deletingItem = deletingId ? inboxItems.find((i) => i.id === deletingId) : null;

  const handleSetModule = (id: string, module: string) => {
    updateMutation.mutate({ id, updates: { module: module as AtomModule } });
    setSelectedId(null);
  };

  const handleSetPriority = (id: string, priority: string) => {
    updateMutation.mutate({
      id,
      updates: {
        body: { operations: { priority: priority as Priority } } as any,
      },
    });
  };

  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, updates: { status: 'archived' as const } });
    setSelectedId(null);
  };

  const handlePromote = (id: string) => {
    updateMutation.mutate({
      id,
      updates: {
        body: { operations: { due_date: formatISO(startOfDay(new Date())).slice(0, 10) } } as any,
      },
    });
    setSelectedId(null);
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
    setSelectedId(null);
  };

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
      setDeletingId(null);
      setSelectedId(null);
    }
  };

  const handleEdit = (id: string, updates: Partial<AtomItem>) => {
    updateMutation.mutate({ id, updates });
  };

  const handleOpenSheet = useCallback((item: AtomItem) => {
    setEditingItem(item);
  }, []);

  const handleSheetSave = (id: string, updates: UpdateItemPayload) => {
    updateMutation.mutate({ id, updates });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="font-serif text-xl font-light text-light tracking-tight">
            Inbox
          </h2>
        </div>
        <ListSkeleton count={4} type="item" />
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
        <EmptyState
          message="Tudo classificado"
          submessage="Nenhum item pendente de organizacao"
          positive
        />
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
              onEdit={handleEdit}
              onOpenSheet={handleOpenSheet}
              showActions={false}
            />
          </div>

          {selectedId === item.id && (
            <div className="pl-10 pr-2 pb-2">
              <InboxActions
                itemId={item.id}
                currentModule={item.module}
                currentPriority={item.body.operations?.priority}
                onSetModule={handleSetModule}
                onSetPriority={handleSetPriority}
                onArchive={handleArchive}
                onPromote={handlePromote}
              />
            </div>
          )}
        </div>
      ))}

      {/* Edit Sheet */}
      <EditSheet
        item={editingItem}
        onSave={handleSheetSave}
        onClose={() => setEditingItem(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingId}
        title="Excluir item"
        description={deletingItem ? `"${deletingItem.title}" será removido permanentemente.` : ''}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="#e85d5d"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
