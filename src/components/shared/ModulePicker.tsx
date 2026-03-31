// components/shared/ModulePicker.tsx
// Grid de módulos para seleção
// Usado no EditSheet e InboxActions

import { MODULE_CONFIG } from './ModuleBadge';
import type { AtomModule } from '@/types/item';

interface ModulePickerProps {
  value: AtomModule | null;
  onChange: (module: AtomModule | null) => void;
}

export default function ModulePicker({ value, onChange }: ModulePickerProps) {
  const modules = Object.entries(MODULE_CONFIG).filter(
    ([key]) => key !== 'home' // home é legado, não mostrar
  );

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
        Módulo
      </label>
      <div className="grid grid-cols-3 gap-2">
        {modules.map(([key, { label, color, icon }]) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(selected ? null : (key as AtomModule))}
              aria-label={label}
              className="flex items-center gap-1.5 rounded-lg transition-all duration-150"
              style={{
                padding: '8px 10px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: selected ? 600 : 400,
                color: selected ? '#111318' : color,
                backgroundColor: selected ? color : `${color}10`,
                border: `1px solid ${selected ? color : `${color}25`}`,
              }}
            >
              <span style={{ fontSize: '11px' }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
