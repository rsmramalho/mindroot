// pages/Home.tsx — Dashboard principal + Soul Layer integration
// Fase 2: completar task → check-in → reflection

import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useSoul } from '@/hooks/useSoul';
import type { AtomItem } from '@/types/item';
import DashboardView from '@/components/dashboard/DashboardView';
import { AtomInput } from '@/components/input/AtomInput';
import CheckInPrompt from '@/components/soul/CheckInPrompt';
import SoulPulse from '@/components/soul/SoulPulse';

export function HomePage() {
  const { items, isLoading } = useItems();
  const { completeMutation, uncompleteMutation, updateMutation, deleteMutation } = useItemMutations();
  const { checkIn, onItemComplete, startPicking, selectEmotion, skip, dismiss } = useSoul();

  const handleComplete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      // Completa o item
      completeMutation.mutate(id);
      // Verifica se precisa de check-in
      onItemComplete(item);
    }
  };

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
    <div className="flex flex-col gap-4 px-1">
      <AtomInput />

      {/* Soul Pulse — só aparece se tem emoções registradas */}
      <SoulPulse items={items} />

      <DashboardView
        items={items}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Check-in overlay */}
      <CheckInPrompt
        state={checkIn}
        onStartPicking={startPicking}
        onSelectEmotion={selectEmotion}
        onSkip={skip}
        onDismiss={dismiss}
      />
    </div>
  );
}
