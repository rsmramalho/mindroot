// pages/Calendar.tsx — Calendar view with month grid
// alpha.8: EditSheet + ConfirmDialog integration
import { useState, useCallback } from 'react';
import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import type { AtomItem, UpdateItemPayload } from '@/types/item';
import CalendarView from '@/components/calendar/CalendarView';
import EditSheet from '@/components/shared/EditSheet';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export function CalendarPage() {
  const { items, isLoading } = useItems();
  const { completeMutation, uncompleteMutation, updateMutation, deleteMutation } =
    useItemMutations();

  const [editingItem, setEditingItem] = useState<AtomItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingItem = deletingId ? items.find((i) => i.id === deletingId) : null;

  const handleComplete = (id: string) => completeMutation.mutate(id);
  const handleUncomplete = (id: string) => uncompleteMutation.mutate(id);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
      setDeletingId(null);
    }
  };

  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, updates: { status: 'archived' as const } });
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
      <div className="flex flex-col gap-4 px-1">
        <div className="h-8 w-24 animate-pulse rounded" style={{ backgroundColor: '#a8947810' }} />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded"
              style={{ height: 36, backgroundColor: '#a8947808' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-1">
      <CalendarView
        items={items}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onEdit={handleEdit}
        onOpenSheet={handleOpenSheet}
      />

      <EditSheet
        item={editingItem}
        onSave={handleSheetSave}
        onClose={() => setEditingItem(null)}
      />

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
