// pages/Pipeline.tsx — 7-stage funnel + triage flow
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useItems } from '@/hooks/useItems';
import { useItemMutations } from '@/hooks/useItemMutations';
import type { AtomItem, AtomModule, AtomType, UpdateItemPayload } from '@/types/item';
import { GENESIS_STAGES, MODULES } from '@/types/item';
import { TYPE_FLOORS } from '@/types/item';
import { GeometryIcon } from '@/components/atoms/GeometryIcon';
import { TypeChip } from '@/components/atoms/TypeChip';
import { ModuleBar } from '@/components/atoms/ModuleBar';
import { StageBadge } from '@/components/atoms/StageBadge';
import { ConfidenceBar } from '@/components/atoms/ConfidenceBar';
import { FAB } from '@/components/atoms/FAB';
import { AtomInput } from '@/components/input/AtomInput';
import EditSheet from '@/components/shared/EditSheet';
import { ListSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';

// ─── Triage suggestion (simulated AI) ──────────────────

interface TriageSuggestion {
  type: AtomType;
  module: AtomModule;
  confidence: number;
}

function generateTriageSuggestion(item: AtomItem): TriageSuggestion {
  // Simple heuristic: suggest based on title keywords
  const t = item.title.toLowerCase();
  let type: AtomType = 'note';
  let module: AtomModule = 'mind';
  let confidence = 60;

  if (t.includes('tarefa') || t.includes('fazer') || t.includes('task')) {
    type = 'task'; module = 'work'; confidence = 85;
  } else if (t.includes('treino') || t.includes('exerc')) {
    type = 'workout'; module = 'body'; confidence = 80;
  } else if (t.includes('receita') || t.includes('cozinha')) {
    type = 'recipe'; module = 'body'; confidence = 82;
  } else if (t.includes('reflex') || t.includes('pensar') || t.includes('sinto')) {
    type = 'reflection'; module = 'mind'; confidence = 75;
  } else if (t.includes('habit') || t.includes('rotina') || t.includes('diario')) {
    type = 'habit'; module = 'purpose'; confidence = 70;
  } else if (t.includes('projeto') || t.includes('project')) {
    type = 'project'; module = 'work'; confidence = 78;
  } else if (t.includes('comprar') || t.includes('pagar') || t.includes('gasto')) {
    type = 'task'; module = 'finance'; confidence = 72;
  } else if (t.includes('ligar') || t.includes('familia') || t.includes('mae') || t.includes('pai')) {
    type = 'task'; module = 'family'; confidence = 74;
  } else if (t.includes('ler') || t.includes('artigo') || t.includes('livro')) {
    type = 'article'; module = 'mind'; confidence = 68;
  }

  // If item already has a type/module, use those with higher confidence
  if (item.type) { type = item.type; confidence = Math.max(confidence, 90); }
  if (item.module) { module = item.module; confidence = Math.max(confidence, 88); }

  return { type, module, confidence };
}

// ─── Pipeline Page ──────────────────────────────────────

export function PipelinePage() {
  const { items, isLoading, inboxItems } = useItems();
  const { updateMutation } = useItemMutations();
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [triageItem, setTriageItem] = useState<AtomItem | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [editingItem, setEditingItem] = useState<AtomItem | null>(null);

  // Group items by genesis_stage
  const stageGroups = useMemo(() => {
    const active = items.filter((i) => i.status !== 'completed' && i.status !== 'archived');
    const groups: Record<number, AtomItem[]> = {};
    for (let s = 1; s <= 7; s++) groups[s] = [];
    for (const item of active) {
      const stage = item.genesis_stage ?? 1;
      if (groups[stage]) groups[stage].push(item);
    }
    return groups;
  }, [items]);

  const handleTriageConfirm = useCallback((item: AtomItem, type: AtomType, module: AtomModule) => {
    const floorStage = TYPE_FLOORS[type] ?? 2;
    const newStage = Math.max(item.genesis_stage, floorStage);
    const newState = GENESIS_STAGES.find((s) => s.stage === newStage);

    updateMutation.mutate({
      id: item.id,
      updates: {
        type,
        module,
        status: 'active',
        state: (newState?.name.toLowerCase() ?? 'classified') as any,
        genesis_stage: newStage,
      },
    });

    // Move to next inbox item
    const nextInbox = inboxItems.find((i) => i.id !== item.id);
    setTriageItem(nextInbox ?? null);
  }, [updateMutation, inboxItems]);

  const handleSheetSave = (id: string, updates: UpdateItemPayload) => {
    updateMutation.mutate({ id, updates });
  };

  if (isLoading) return <ListSkeleton count={7} type="item" />;

  return (
    <div className="flex flex-col gap-2 px-1" style={{ paddingBottom: '80px' }}>
      <h1 className="font-serif text-lg" style={{ color: '#e8e0d4', padding: '0 4px' }}>
        Pipeline
      </h1>

      {/* ─── Triage overlay ─── */}
      <AnimatePresence>
        {triageItem && (
          <TriageCard
            item={triageItem}
            onConfirm={(type, module) => handleTriageConfirm(triageItem, type, module)}
            onSkip={() => {
              const next = inboxItems.find((i) => i.id !== triageItem.id);
              setTriageItem(next ?? null);
            }}
            onClose={() => setTriageItem(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Stage funnel (top-down) ─── */}
      {GENESIS_STAGES.map(({ stage, geometry, name, label }) => {
        const stageItems = stageGroups[stage] ?? [];
        const isExpanded = expandedStage === stage;
        const belowFloorCount = stageItems.filter((i) => {
          if (!i.type) return false;
          const floor = TYPE_FLOORS[i.type] ?? 2;
          return i.genesis_stage < floor;
        }).length;

        return (
          <div key={stage}>
            <button
              onClick={() => setExpandedStage(isExpanded ? null : stage)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
              style={{ backgroundColor: isExpanded ? '#1a1d24' : 'transparent' }}
            >
              <GeometryIcon stage={stage} size={22} />
              <div className="flex-1 text-left">
                <span className="text-sm font-sans font-medium" style={{ color: '#e8e0d4' }}>
                  {geometry} {name}
                </span>
                <span className="text-[10px] font-sans ml-2" style={{ color: '#a89478' }}>
                  {label}
                </span>
              </div>
              <span className="text-[12px] font-mono" style={{ color: '#a89478' }}>
                {stageItems.length}
              </span>
              {belowFloorCount > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#c4a87220', color: '#c4a872' }}
                >
                  {belowFloorCount} below floor
                </span>
              )}
            </button>

            {/* Expanded stage items */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-1 pl-4 pr-1 py-2">
                    {stageItems.length === 0 ? (
                      <span className="text-[12px] font-sans py-2 pl-2" style={{ color: '#a8947850' }}>
                        Nenhum item neste estagio
                      </span>
                    ) : (
                      stageItems.map((item) => {
                        const isBelowFloor = item.type
                          ? item.genesis_stage < (TYPE_FLOORS[item.type] ?? 2)
                          : false;

                        return (
                          <ModuleBar key={item.id} module={item.module}>
                            <div
                              className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-surface/50 transition-colors"
                              onClick={() => setEditingItem(item)}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-sans truncate block" style={{ color: '#e8e0d4' }}>
                                  {item.title}
                                </span>
                              </div>
                              {item.type && <TypeChip type={item.type} />}
                              <StageBadge stage={item.genesis_stage} />
                              {isBelowFloor && (
                                <span
                                  className="text-[9px] font-mono px-1 py-0.5 rounded"
                                  style={{ backgroundColor: '#c4a87215', color: '#c4a872' }}
                                >
                                  below
                                </span>
                              )}
                            </div>
                          </ModuleBar>
                        );
                      })
                    )}

                    {/* Triage button for inbox stage */}
                    {stage === 1 && inboxItems.length > 0 && (
                      <button
                        onClick={() => setTriageItem(inboxItems[0])}
                        className="mt-2 px-4 py-2 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#c4a88220', color: '#c4a882' }}
                      >
                        Triar inbox ({inboxItems.length})
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {items.filter((i) => i.status !== 'completed' && i.status !== 'archived').length === 0 && (
        <EmptyState
          title="Pipeline vazio"
          description="Capture algo com o input acima"
        />
      )}

      {/* Capture FAB */}
      <AnimatePresence>
        {showCapture && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-30 rounded-xl p-4"
            style={{ backgroundColor: '#1a1d24', border: '1px solid #2a2d34' }}
          >
            <AtomInput />
            <button
              onClick={() => setShowCapture(false)}
              className="mt-2 text-[12px] font-sans w-full text-center"
              style={{ color: '#a89478' }}
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <FAB onClick={() => setShowCapture(!showCapture)} />

      {/* Edit Sheet */}
      <EditSheet
        item={editingItem}
        onSave={handleSheetSave}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}

// ─── Triage Card ────────────────────────────────────────

function TriageCard({
  item,
  onConfirm,
  onSkip,
  onClose,
}: {
  item: AtomItem;
  onConfirm: (type: AtomType, module: AtomModule) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const suggestion = useMemo(() => generateTriageSuggestion(item), [item]);
  const [selectedType, setSelectedType] = useState<AtomType>(suggestion.type);
  const [selectedModule, setSelectedModule] = useState<AtomModule>(suggestion.module);
  const [editing, setEditing] = useState(false);

  const commonTypes: AtomType[] = ['note', 'task', 'reflection', 'habit', 'recipe', 'spec', 'project'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-x-4 bottom-20 z-40 rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#1a1d24', border: '1px solid #2a2d34' }}
    >
      <div className="p-4">
        {/* Item title */}
        <span className="block font-sans text-base font-medium mb-1" style={{ color: '#e8e0d4' }}>
          {item.title}
        </span>
        <span className="block text-[11px] font-mono mb-3" style={{ color: '#a89478' }}>
          {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </span>

        {/* AI suggestion */}
        <div className="mb-3">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#a89478' }}>
            Sugestao
          </span>
          <div className="flex items-center gap-2 mb-2">
            <TypeChip type={suggestion.type} />
            <span className="text-[12px] font-sans" style={{ color: '#a89478' }}>
              em {MODULES.find((m) => m.key === suggestion.module)?.label ?? suggestion.module}
            </span>
          </div>
          <ConfidenceBar value={suggestion.confidence} />
        </div>

        {/* Edit mode */}
        {editing ? (
          <div className="mb-3">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#a89478' }}>
              Tipo
            </span>
            <div className="flex flex-wrap gap-1 mb-3">
              {commonTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className="px-2 py-1 rounded text-[11px] font-sans transition-all"
                  style={{
                    backgroundColor: selectedType === t ? '#c4a88230' : '#a8947810',
                    color: selectedType === t ? '#c4a882' : '#a89478',
                    border: selectedType === t ? '1px solid #c4a88240' : '1px solid transparent',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#a89478' }}>
              Modulo
            </span>
            <div className="flex flex-wrap gap-1">
              {MODULES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setSelectedModule(key)}
                  className="px-2 py-1 rounded text-[11px] font-sans transition-all"
                  style={{
                    backgroundColor: selectedModule === key ? `${color}30` : '#a8947810',
                    color: selectedModule === key ? color : '#a89478',
                    border: selectedModule === key ? `1px solid ${color}40` : '1px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onConfirm(editing ? selectedType : suggestion.type, editing ? selectedModule : suggestion.module)}
            className="flex-1 py-2.5 rounded-lg text-sm font-sans font-medium"
            style={{ backgroundColor: '#c4a882', color: '#111318' }}
          >
            Confirmar
          </button>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2.5 rounded-lg text-sm font-sans"
              style={{ backgroundColor: '#a8947815', color: '#a89478' }}
            >
              Editar
            </button>
          )}
          <button
            onClick={onSkip}
            className="px-4 py-2.5 rounded-lg text-sm font-sans"
            style={{ backgroundColor: '#a8947810', color: '#a8947860' }}
          >
            Pular
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full mt-2 text-[11px] font-sans text-center py-1"
          style={{ color: '#a8947850' }}
        >
          Fechar triage
        </button>
      </div>
    </motion.div>
  );
}
