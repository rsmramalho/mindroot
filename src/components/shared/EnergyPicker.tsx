// components/shared/EnergyPicker.tsx
// 1-5 energy cost selector — visual bar scale
// Used in EditSheet

interface EnergyPickerProps {
  value: number | null;
  onChange: (energy: number | null) => void;
}

const ENERGY_LABELS: Record<number, string> = {
  1: 'Leve',
  2: 'Baixo',
  3: 'Medio',
  4: 'Alto',
  5: 'Intenso',
};

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
        Custo energetico
      </label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((level) => {
          const selected = value === level;
          const active = value !== null && level <= value;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(selected ? null : level)}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg transition-all duration-150"
              style={{
                padding: '8px 4px',
                backgroundColor: active ? `${ENERGY_COLOR}15` : '#a8947808',
                border: `1px solid ${active ? `${ENERGY_COLOR}40` : '#a8947815'}`,
              }}
              title={ENERGY_LABELS[level]}
            >
              <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
                {Array.from({ length: level }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm transition-all duration-150"
                    style={{
                      width: 3,
                      height: 4 + i * 3,
                      backgroundColor: active ? ENERGY_COLOR : '#a8947830',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: selected ? 600 : 400,
                  color: active ? ENERGY_COLOR : '#a8947850',
                }}
              >
                {ENERGY_LABELS[level]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ENERGY_LABELS, ENERGY_COLOR };
