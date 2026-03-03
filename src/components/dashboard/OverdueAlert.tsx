// components/dashboard/OverdueAlert.tsx
// Alerta visual para itens atrasados
// Aparece no topo do Dashboard quando há overdue


import type { AtomItem } from '@/types/item';

interface OverdueAlertProps {
  items: AtomItem[];
  onViewAll?: () => void;
}

export default function OverdueAlert({ items, onViewAll }: OverdueAlertProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="rounded-lg transition-all duration-200"
      style={{
        padding: '10px 14px',
        backgroundColor: '#e85d5d0a',
        border: '1px solid #e85d5d20',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: '#e85d5d',
              display: 'inline-block',
              animation: 'priorityPulse 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              color: '#e85d5d',
            }}
          >
            {items.length} {items.length === 1 ? 'item atrasado' : 'itens atrasados'}
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              color: '#e85d5d80',
            }}
            className="hover:opacity-70 transition-opacity"
          >
            ver todos →
          </button>
        )}
      </div>

      {/* Preview das primeiras 3 */}
      {items.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5">
          {items.slice(0, 3).map((item) => (
            <span
              key={item.id}
              className="truncate"
              style={{
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                color: '#e8e0d480',
                paddingLeft: '18px',
              }}
            >
              {item.title}
            </span>
          ))}
          {items.length > 3 && (
            <span
              style={{
                fontSize: '11px',
                color: '#a8947860',
                paddingLeft: '18px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              +{items.length - 3} mais
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes priorityPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
