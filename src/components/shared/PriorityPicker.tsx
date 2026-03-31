// components/shared/PriorityPicker.tsx
// 3 níveis de prioridade para seleção
// Usado no EditSheet

import { PRIORITY_CONFIG } from './PriorityDot';
import type { Priority } from '@/types/item';

interface PriorityPickerProps {
  value: Priority | null;
  onChange: (priority: Priority | null) => void;
}

export default function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  return (
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
        Prioridade
      </label>
      <div className="flex gap-2">
        {Object.entries(PRIORITY_CONFIG).map(([key, { color, label }]) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(selected ? null : (key as Priority))}
              aria-label={`Prioridade: ${label}`}
              className="flex items-center gap-1.5 rounded-lg transition-all duration-150 flex-1"
              style={{
                padding: '8px 6px',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: selected ? 600 : 400,
                color: selected ? '#111318' : color,
                backgroundColor: selected ? color : `${color}10`,
                border: `1px solid ${selected ? color : `${color}25`}`,
                justifyContent: 'center',
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: selected ? '#111318' : color,
                  flexShrink: 0,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
