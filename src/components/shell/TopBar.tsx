// components/shell/TopBar.tsx — Período + greeting + settings
import { useRitualStore } from '@/store/ritual-store';

interface TopBarProps {
  onOpenSettings?: () => void;
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  const { periodGreeting, currentPeriod, periodColor } = useRitualStore();

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-wide text-light">
            MindRoot
          </h1>
          <p className="text-xs font-sans text-muted mt-0.5">
            <span style={{ color: periodColor }}>●</span>{' '}
            {periodGreeting} — {currentPeriod}
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center transition-colors hover:opacity-80"
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            backgroundColor: '#a8947808',
            border: '1px solid #a8947812',
          }}
          title="Ajustes"
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '14px',
              color: '#a8947860',
              lineHeight: 1,
            }}
          >
            ≡
          </span>
        </button>
      </div>
    </header>
  );
}
