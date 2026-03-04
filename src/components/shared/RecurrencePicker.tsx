// components/shared/RecurrencePicker.tsx
// Selector for recurrence type (none/daily/weekdays/weekly/monthly)
// Used in EditSheet

import { RECURRENCE_OPTIONS, type RecurrenceType } from '@/engine/recurrence';

interface RecurrencePickerProps {
  value: string | null;
  onChange: (recurrence: string | null) => void;
}

const RECURRENCE_COLORS: Record<string, string> = {
  none: '#a89478',
  daily: '#f0c674',
  weekdays: '#c4a882',
  weekly: '#8a9e7a',
  monthly: '#8a6e5a',
};

export default function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
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
        Recorrência
      </label>
      <div className="flex gap-2 flex-wrap">
        {RECURRENCE_OPTIONS.map(({ key, label }) => {
          const isNone = key === 'none';
          const currentValue = value || 'none';
          const selected = currentValue === key;
          const color = RECURRENCE_COLORS[key] || '#a89478';

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(isNone ? null : key)}
              className="flex items-center gap-1.5 rounded-lg transition-all duration-150"
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: selected ? 600 : 400,
                color: selected ? '#111318' : color,
                backgroundColor: selected ? color : `${color}10`,
                border: `1px solid ${selected ? color : `${color}25`}`,
              }}
            >
              {!isNone && (
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  ↻
                </span>
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
