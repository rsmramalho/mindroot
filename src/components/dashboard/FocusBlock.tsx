// components/dashboard/FocusBlock.tsx
// Bloco de foco: urgente + importante no topo do dashboard
// Visual destacado, tipografia Cormorant


import type { AtomItem } from '@/types/item';
import PriorityDot from '@/components/shared/PriorityDot';
import ModuleBadge from '@/components/shared/ModuleBadge';

interface FocusBlockProps {
  items: AtomItem[];
  onComplete?: (id: string) => void;
}

export default function FocusBlock({ items, onComplete }: FocusBlockProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <span
        style={{
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          color: '#a8947840',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '0 4px',
        }}
      >
        Foco
      </span>

      <div
        className="rounded-lg"
        style={{
          backgroundColor: '#1a1d24',
          border: '1px solid #c4a88215',
          padding: '6px 4px',
        }}
      >
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 group"
            style={{ padding: '8px 8px' }}
          >
            {/* Complete button */}
            <button
              onClick={() => onComplete?.(item.id)}
              className="flex-shrink-0 rounded-full border transition-all duration-200 hover:border-opacity-60"
              style={{
                width: 18,
                height: 18,
                borderColor: '#c4a88240',
                backgroundColor: 'transparent',
              }}
            />

            {/* Priority */}
            <PriorityDot priority={item.priority} />

            {/* Title */}
            <span
              className="flex-1 truncate"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#e8e0d4',
                letterSpacing: '-0.01em',
              }}
            >
              {item.is_chore && (
                <span style={{ color: '#d4856a', marginRight: '5px', fontSize: '13px' }}>◆</span>
              )}
              {item.title}
            </span>

            {/* Module */}
            <ModuleBadge module={item.module} size="sm" showLabel={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
