// components/shell/TopBar.tsx — Logo + período + offline indicator + settings
import { useRitualStore } from '@/store/ritual-store';
import { useOfflineStore } from '@/store/offline-store';
import { LogoMark, LogoWordmark } from '@/components/shared/Logo';

interface TopBarProps {
  onOpenSettings?: () => void;
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  const { periodGreeting, currentPeriod, periodColor } = useRitualStore();
  const { isOnline, pendingCount, isSyncing } = useOfflineStore();

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <LogoMark size={16} />
          <div>
            <LogoWordmark size="sm" variant="duo" />
            <p className="text-xs font-sans text-muted mt-0.5">
              <span style={{ color: periodColor }}>●</span>{' '}
              {periodGreeting} — {currentPeriod}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(!isOnline || pendingCount > 0) && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{
                backgroundColor: isOnline ? '#c4a88215' : '#d4856a15',
                border: `1px solid ${isOnline ? '#c4a88230' : '#d4856a30'}`,
              }}
              title={
                !isOnline
                  ? 'Sem conexao'
                  : isSyncing
                    ? 'Sincronizando...'
                    : `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`
              }
            >
              <span
                className="font-mono text-xs"
                style={{ color: isOnline ? '#c4a882' : '#d4856a' }}
              >
                {!isOnline ? 'offline' : isSyncing ? 'sync' : pendingCount}
              </span>
            </div>
          )}
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
      </div>
    </header>
  );
}
