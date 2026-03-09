// pages/Home.tsx — Dashboard principal + Soul Layer integration
// alpha.11: NotificationPrompt + item feed for overdue checks

import { useState, useCallback, useEffect } from 'react';
import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useSoul } from '@/hooks/useSoul';
import { useNotifications } from '@/hooks/useNotifications';
import type { AtomItem, UpdateItemPayload } from '@/types/item';
import DashboardView from '@/components/dashboard/DashboardView';
import { AtomInput } from '@/components/input/AtomInput';
import CheckInPrompt from '@/components/soul/CheckInPrompt';
import SoulPulse from '@/components/soul/SoulPulse';
import EditSheet from '@/components/shared/EditSheet';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import NotificationPrompt from '@/components/shared/NotificationPrompt';
import { ListSkeleton } from '@/components/shared/Skeleton';

export function HomePage() {
  const { items, isLoading } = useItems();
  const { completeMutation, uncompleteMutation, updateMutation, deleteMutation } = useItemMutations();
  const { checkIn, onItemComplete, startPicking, selectEmotion, skip, dismiss } = useSoul();
  const { updateItems } = useNotifications();

  // Feed items to notification system for overdue counting
  useEffect(() => {
    if (items.length > 0) updateItems(items);
  }, [items, updateItems]);

  // Edit sheet state
  const [editingItem, setEditingItem] = useState<AtomItem | null>(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingItem = deletingId ? items.find((i) => i.id === deletingId) : null;

  const handleComplete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      completeMutation.mutate(id);
      onItemComplete(item);
    }
  };

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
    updateMutation.mutate({ id, updates: { archived: true } });
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
        <div className="h-12 animate-pulse rounded-lg" style={{ backgroundColor: '#a8947808' }} />
        <ListSkeleton count={5} type="item" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-1">
      <AtomInput />

      {/* Notification permission prompt — soft ask */}
      <NotificationPrompt />

      {/* Soul Pulse — só aparece se tem emoções registradas */}
      <SoulPulse items={items} />

      <DashboardView
        items={items}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onOpenSheet={handleOpenSheet}
      />

      {/* Check-in overlay */}
      <CheckInPrompt
        state={checkIn}
        onStartPicking={startPicking}
        onSelectEmotion={selectEmotion}
        onSkip={skip}
        onDismiss={dismiss}
      />

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
