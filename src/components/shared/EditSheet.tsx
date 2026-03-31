// components/shared/EditSheet.tsx
// Bottom sheet de edição completa de um AtomItem
// Campos: título, módulo, prioridade, due_date, tags, notes
// emotion_before/after: read-only

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AtomItem, UpdateItemPayload, AtomModule, Priority, EnergyLevel } from '@/types/item';
import ModulePicker from './ModulePicker';
import PriorityPicker from './PriorityPicker';
import EnergyPicker from './EnergyPicker';
import RecurrencePicker from './RecurrencePicker';
import TagChip from './TagChip';

interface EditSheetProps {
  item: AtomItem | null;
  onSave: (id: string, updates: UpdateItemPayload) => void;
  onClose: () => void;
}

export default function EditSheet({ item, onSave, onClose }: EditSheetProps) {
  const [title, setTitle] = useState('');
  const [module, setModule] = useState<AtomModule | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setModule(item.module);
      setPriority(item.body.operations?.priority ?? null);
      setDueDate(item.body.operations?.due_date ? item.body.operations.due_date.split('T')[0] : '');
      setRecurrence(item.body.recurrence?.rule || null);
      setEnergyLevel(item.body.soul?.energy_level ?? null);
      setTags(item.tags || []);
      setNotes(item.notes || '');
      setTimeout(() => titleRef.current?.focus(), 200);
    }
  }, [item]);

  // Close on Escape
  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  const handleSave = () => {
    if (!item || !title.trim()) return;

    const updates: UpdateItemPayload = {};

    if (title.trim() !== item.title) updates.title = title.trim();
    if (module !== item.module) updates.module = module;

    const oldPriority = item.body.operations?.priority ?? null;
    if (priority !== oldPriority) {
      updates.body = {
        ...updates.body,
        operations: { ...item.body.operations, ...updates.body?.operations, priority } as any,
      };
    }

    const newDueDate = dueDate || null;
    const oldDueDate = item.body.operations?.due_date ? item.body.operations.due_date.split('T')[0] : null;
    if (newDueDate !== oldDueDate) {
      updates.body = {
        ...updates.body,
        operations: { ...item.body.operations, ...updates.body?.operations, due_date: newDueDate } as any,
      };
    }

    if (JSON.stringify(tags) !== JSON.stringify(item.tags)) updates.tags = tags;
    if (notes !== (item.notes || '')) updates.notes = notes || null;

    if (recurrence !== (item.body.recurrence?.rule || null)) {
      updates.body = {
        ...updates.body,
        recurrence: { ...item.body.recurrence, ...updates.body?.recurrence, rule: recurrence } as any,
      };
    }

    const oldEnergyLevel = item.body.soul?.energy_level ?? null;
    if (energyLevel !== oldEnergyLevel) {
      updates.body = {
        ...updates.body,
        soul: { ...item.body.soul, ...updates.body?.soul, energy_level: energyLevel } as any,
      };
    }

    // Only save if something changed
    if (Object.keys(updates).length > 0) {
      onSave(item.id, updates);
    }

    onClose();
  };

  const handleAddTag = () => {
    const cleaned = newTag.trim().replace(/^#/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative rounded-t-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Editar item"
            style={{
              backgroundColor: '#111318',
              border: '1px solid #a8947815',
              borderBottom: 'none',
              maxHeight: '85dvh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="rounded-full"
                style={{
                  width: 36,
                  height: 4,
                  backgroundColor: '#a8947830',
                }}
              />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{ padding: '8px 20px 16px' }}
            >
              <h3
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '20px',
                  fontWeight: 400,
                  color: '#e8e0d4',
                }}
              >
                Editar
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#a8947860',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#a8947810',
                    border: '1px solid #a8947815',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#111318',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#c4a882',
                    border: '1px solid #c4a882',
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Form */}
            <div
              className="flex flex-col gap-5"
              style={{ padding: '0 20px 32px' }}
            >
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontSize: '10px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#a8947860',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Título
                </label>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent outline-none"
                  style={{
                    color: '#e8e0d4',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1a1d24',
                    border: '1px solid #a8947820',
                  }}
                />
              </div>

              {/* Module */}
              <ModulePicker value={module} onChange={setModule} />

              {/* Priority */}
              <PriorityPicker value={priority} onChange={setPriority} />

              {/* Recurrence */}
              <RecurrencePicker value={recurrence} onChange={setRecurrence} />

              {/* Energy Level */}
              <EnergyPicker value={energyLevel} onChange={setEnergyLevel} />

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontSize: '10px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#a8947860',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Data
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                    style={{
                      color: dueDate ? '#e8e0d4' : '#a8947840',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '13px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#1a1d24',
                      border: '1px solid #a8947820',
                      colorScheme: 'dark',
                    }}
                  />
                  {dueDate && (
                    <button
                      onClick={() => setDueDate('')}
                      style={{
                        fontSize: '11px',
                        fontFamily: 'Inter, sans-serif',
                        color: '#a8947860',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#a8947810',
                        border: '1px solid #a8947815',
                      }}
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontSize: '10px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#a8947860',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <TagChip key={tag} tag={tag} onRemove={() => handleRemoveTag(tag)} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Nova tag..."
                    className="flex-1 bg-transparent outline-none"
                    style={{
                      color: '#e8e0d4',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#1a1d24',
                      border: '1px solid #a8947820',
                    }}
                  />
                  {newTag.trim() && (
                    <button
                      onClick={handleAddTag}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '14px',
                        color: '#c4a882',
                        padding: '6px 10px',
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Notes (was Description) */}
              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontSize: '10px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: '#a8947860',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notas, contexto, detalhes..."
                  className="bg-transparent outline-none resize-none"
                  style={{
                    color: '#e8e0d4',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1a1d24',
                    border: '1px solid #a8947820',
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Emotion (read-only) */}
              {(item.body.soul?.emotion_before || item.body.soul?.emotion_after) && (
                <div className="flex flex-col gap-1.5">
                  <label
                    style={{
                      fontSize: '10px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      color: '#a8947860',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Emoção registrada
                  </label>
                  <div
                    className="flex items-center gap-3"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#1a1d2480',
                      border: '1px solid #a8947810',
                    }}
                  >
                    {item.body.soul?.emotion_before && (
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'Inter, sans-serif',
                            color: '#a8947850',
                          }}
                        >
                          antes
                        </span>
                        <span
                          style={{
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            color: '#c4a882',
                          }}
                        >
                          {item.body.soul.emotion_before}
                        </span>
                      </div>
                    )}
                    {item.body.soul?.emotion_before && item.body.soul?.emotion_after && (
                      <span style={{ color: '#a8947830', fontSize: '12px' }}>→</span>
                    )}
                    {item.body.soul?.emotion_after && (
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'Inter, sans-serif',
                            color: '#a8947850',
                          }}
                        >
                          depois
                        </span>
                        <span
                          style={{
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            color: '#8a9e7a',
                          }}
                        >
                          {item.body.soul.emotion_after}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Item type + created_at (read-only info) */}
              <div
                className="flex items-center gap-4"
                style={{
                  paddingTop: '8px',
                  borderTop: '1px solid #a8947810',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: '"JetBrains Mono", monospace',
                    color: '#a8947840',
                  }}
                >
                  {item.type}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: '"JetBrains Mono", monospace',
                    color: '#a8947830',
                  }}
                >
                  criado {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
