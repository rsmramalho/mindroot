// components/soul/SoulPulse.tsx
// Widget visual do pulso emocional — mostra últimas emoções registradas
// Aparece no dashboard como "termômetro" da alma

import { useMemo } from 'react';
import type { AtomItem, Emotion } from '@/types/item';
import { POSITIVE_EMOTIONS } from '@/types/item';
import { EMOTION_STYLES } from './EmotionPicker';

interface SoulPulseProps {
  items: AtomItem[];
  maxDots?: number;
}

export default function SoulPulse({ items, maxDots = 7 }: SoulPulseProps) {
  // Pegar últimas emoções registradas (before ou after)
  const recentEmotions = useMemo(() => {
    const emotions: { emotion: Emotion; timestamp: string; source: 'before' | 'after' }[] = [];

    for (const item of items) {
      if (item.emotion_after) {
        emotions.push({
          emotion: item.emotion_after,
          timestamp: item.updated_at,
          source: 'after',
        });
      }
      if (item.emotion_before) {
        emotions.push({
          emotion: item.emotion_before,
          timestamp: item.created_at,
          source: 'before',
        });
      }
    }

    return emotions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxDots);
  }, [items, maxDots]);

  // Score geral: % positiva
  const score = useMemo(() => {
    if (recentEmotions.length === 0) return null;
    const positive = recentEmotions.filter((e) => POSITIVE_EMOTIONS.includes(e.emotion)).length;
    return Math.round((positive / recentEmotions.length) * 100);
  }, [recentEmotions]);

  if (recentEmotions.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '12px',
        border: '1px solid #a8947810',
        padding: '12px 16px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#a89478',
            letterSpacing: '-0.01em',
          }}
        >
          Pulso
        </span>
        {score !== null && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              fontWeight: 400,
              color: score >= 60 ? '#8a9e7a' : score >= 40 ? '#a89478' : '#d4856a',
            }}
          >
            {score}%
          </span>
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1.5">
        {recentEmotions.map((entry, i) => {
          const style = EMOTION_STYLES[entry.emotion];
          const isRecent = i < 2;
          return (
            <div
              key={`${entry.timestamp}-${entry.source}-${i}`}
              title={`${entry.emotion} (${entry.source === 'after' ? 'pós' : 'pré'})`}
              style={{
                width: isRecent ? 10 : 8,
                height: isRecent ? 10 : 8,
                borderRadius: '50%',
                backgroundColor: style.color,
                opacity: isRecent ? 1 : 0.5 + (0.3 * (maxDots - i)) / maxDots,
                transition: 'all 300ms ease',
                flexShrink: 0,
              }}
            />
          );
        })}

        {/* Fill empty slots */}
        {Array.from({ length: Math.max(0, maxDots - recentEmotions.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#a8947815',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Last emotion label */}
      {recentEmotions[0] && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: EMOTION_STYLES[recentEmotions[0].emotion].color,
            fontWeight: 500,
            display: 'block',
            marginTop: '8px',
          }}
        >
          {recentEmotions[0].emotion}
        </span>
      )}
    </div>
  );
}
