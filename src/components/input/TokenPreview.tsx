// components/input/TokenPreview.tsx — Preview de tokens detectados
import type { DetectedToken } from '@/types/engine';

interface TokenPreviewProps {
  tokens: DetectedToken[];
}

const TOKEN_COLORS: Record<string, string> = {
  module: 'text-mod-work',
  priority: 'text-heart',
  emotion_before: 'text-aurora',
  emotion_after: 'text-soul',
  type: 'text-mind',
  chore: 'text-crepusculo',
  needs_checkin: 'text-muted',
  temporal: 'text-zenite',
};

export function TokenPreview({ tokens }: TokenPreviewProps) {
  if (tokens.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-1 py-1.5">
      {tokens.map((token, i) => (
        <span
          key={`${token.raw}-${i}`}
          className={`text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border ${
            TOKEN_COLORS[token.type] || 'text-muted'
          }`}
        >
          {token.type === 'module' && `◇ ${token.value}`}
          {token.type === 'priority' && `● ${token.value}`}
          {token.type === 'emotion_before' && `○ ${token.value}`}
          {token.type === 'emotion_after' && `✦ ${token.value}`}
          {token.type === 'temporal' && `▸ ${token.value}`}
          {token.type === 'chore' && '◆ chore'}
          {token.type === 'needs_checkin' && '◎ check-in'}
          {token.type === 'type' && `▸ ${token.value}`}
          {!['module', 'priority', 'emotion_before', 'emotion_after', 'temporal', 'chore', 'needs_checkin', 'type'].includes(token.type) && token.raw}
        </span>
      ))}
    </div>
  );
}
