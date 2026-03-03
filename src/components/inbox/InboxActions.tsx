// components/inbox/InboxActions.tsx
// Ações para classificar itens do inbox: módulo, prioridade, arquivar
// Aparece ao selecionar um item no Inbox

import { useState } from 'react';
import { MODULE_CONFIG } from '@/components/shared/ModuleBadge';
import { PRIORITY_CONFIG } from '@/components/shared/PriorityDot';

type ActionMode = 'idle' | 'module' | 'priority';

interface InboxActionsProps {
  itemId: string;
  currentModule?: string | null;
  currentPriority?: string | null;
  onSetModule: (id: string, module: string) => void;
  onSetPriority: (id: string, priority: string) => void;
  onArchive: (id: string) => void;
  onPromote: (id: string) => void; // Move to active (set today)
}

export default function InboxActions({
  itemId,
  currentModule,
  currentPriority,
  onSetModule,
  onSetPriority,
  onArchive,
  onPromote,
}: InboxActionsProps) {
  const [mode, setMode] = useState<ActionMode>('idle');

  if (mode === 'module') {
    return (
      <div className="flex flex-col gap-1" style={{ padding: '8px 0' }}>
        <label
          style={{
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: '#a8947860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}
        >
          Módulo
        </label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(MODULE_CONFIG).map(([key, { label, color, icon }]) => (
            <button
              key={key}
              onClick={() => {
                onSetModule(itemId, key);
                setMode('idle');
              }}
              className="flex items-center gap-1 rounded-full transition-all duration-150"
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: currentModule === key ? '#111318' : color,
                backgroundColor: currentModule === key ? color : `${color}15`,
                border: `1px solid ${color}40`,
              }}
            >
              <span style={{ fontSize: '10px' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setMode('idle')}
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#a8947860',
            fontFamily: 'Inter, sans-serif',
            alignSelf: 'flex-start',
          }}
        >
          ← voltar
        </button>
      </div>
    );
  }

  if (mode === 'priority') {
    return (
      <div className="flex flex-col gap-1" style={{ padding: '8px 0' }}>
        <label
          style={{
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: '#a8947860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}
        >
          Prioridade
        </label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PRIORITY_CONFIG).map(([key, { color, label }]) => (
            <button
              key={key}
              onClick={() => {
                onSetPriority(itemId, key);
                setMode('idle');
              }}
              className="flex items-center gap-1.5 rounded-full transition-all duration-150"
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: currentPriority === key ? '#111318' : color,
                backgroundColor: currentPriority === key ? color : `${color}15`,
                border: `1px solid ${color}40`,
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, backgroundColor: color }}
              />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setMode('idle')}
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#a8947860',
            fontFamily: 'Inter, sans-serif',
            alignSelf: 'flex-start',
          }}
        >
          ← voltar
        </button>
      </div>
    );
  }

  // ━━━ Idle: main action bar ━━━
  return (
    <div className="flex items-center gap-2" style={{ padding: '6px 0' }}>
      <InboxBtn
        label="Módulo"
        icon="◇"
        onClick={() => setMode('module')}
        color="#c4a882"
      />
      <InboxBtn
        label="Prioridade"
        icon="●"
        onClick={() => setMode('priority')}
        color="#e8a84c"
      />
      <InboxBtn
        label="Hoje"
        icon="→"
        onClick={() => onPromote(itemId)}
        color="#8a9e7a"
      />
      <div className="flex-1" />
      <InboxBtn
        label="Arquivar"
        icon="⊟"
        onClick={() => onArchive(itemId)}
        color="#a8947860"
      />
    </div>
  );
}

function InboxBtn({
  label,
  icon,
  onClick,
  color,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded transition-all duration-150 hover:opacity-80"
      style={{
        padding: '5px 10px',
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        color,
        backgroundColor: `${color}10`,
        border: `1px solid ${color}20`,
      }}
    >
      <span style={{ fontSize: '11px' }}>{icon}</span>
      {label}
    </button>
  );
}
