// pages/Calendar.tsx — Calendar view with month grid
import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import type { AtomItem } from '@/types/item';
import CalendarView from '@/components/calendar/CalendarView';

export function CalendarPage() {
  const { items, isLoading } = useItems();
  const { completeMutation, uncompleteMutation, updateMutation, deleteMutation } =
    useItemMutations();

  const handleComplete = (id: string) => completeMutation.mutate(id);
  const handleUncomplete = (id: string) => uncompleteMutation.mutate(id);
  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, updates: { archived: true } });
  };
  const handleEdit = (id: string, updates: Partial<AtomItem>) => {
    updateMutation.mutate({ id, updates });
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
      <CalendarView
        items={items}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onEdit={handleEdit}
      />
    </div>
  );
}
