// components/shared/EnergyPicker.tsx
// Energy level selector — high/medium/low
// Used in EditSheet

import type { EnergyLevel } from '@/types/item';

interface EnergyPickerProps {
  value: EnergyLevel | null;
  onChange: (energy: EnergyLevel | null) => void;
}

const ENERGY_OPTIONS: { key: EnergyLevel; label: string; bars: number }[] = [
  { key: 'low', label: 'Baixo', bars: 1 },
  { key: 'medium', label: 'Medio', bars: 3 },
  { key: 'high', label: 'Alto', bars: 5 },
];

const ENERGY_COLOR = '#d4856a';

export default function EnergyPicker({ value, onChange }: EnergyPickerProps) {
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
        Nivel de energia
      </label>
      <div className="flex items-center gap-2">
        {ENERGY_OPTIONS.map(({ key, label, bars }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(selected ? null : key)}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg transition-all duration-150"
              style={{
                padding: '8px 4px',
                backgroundColor: selected ? `${ENERGY_COLOR}15` : '#a8947808',
                border: `1px solid ${selected ? `${ENERGY_COLOR}40` : '#a8947815'}`,
              }}
              title={label}
              aria-label={label}
            >
              <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
                {Array.from({ length: bars }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm transition-all duration-150"
                    style={{
                      width: 3,
                      height: 4 + i * 3,
                      backgroundColor: selected ? ENERGY_COLOR : '#a8947830',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: selected ? 600 : 400,
                  color: selected ? ENERGY_COLOR : '#a8947850',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ENERGY_OPTIONS, ENERGY_COLOR };
