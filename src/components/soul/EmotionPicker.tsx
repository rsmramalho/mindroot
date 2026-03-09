// components/soul/EmotionPicker.tsx
// Seletor visual de emoções — word-based (sem emoji, conforme design direction)
// Positivas em cima, desafiadoras embaixo, neutro separado

import type { Emotion } from '@/types/item';
import { POSITIVE_EMOTIONS, CHALLENGING_EMOTIONS } from '@/types/item';

interface EmotionPickerProps {
  selected: Emotion | null;
  onSelect: (emotion: Emotion) => void;
  label?: string;
}

const EMOTION_STYLES: Record<Emotion, { color: string; bg: string }> = {
  calmo:     { color: '#8a9e7a', bg: '#8a9e7a18' },
  focado:    { color: '#c4a882', bg: '#c4a88218' },
  grato:     { color: '#b8c4a8', bg: '#b8c4a818' },
  animado:   { color: '#e8a84c', bg: '#e8a84c18' },
  confiante: { color: '#a89478', bg: '#a8947818' },
  ansioso:   { color: '#e85d5d', bg: '#e85d5d18' },
  cansado:   { color: '#6b7280', bg: '#6b728018' },
  frustrado: { color: '#d4856a', bg: '#d4856a18' },
  triste:    { color: '#8a6e5a', bg: '#8a6e5a18' },
  perdido:   { color: '#9ca3af', bg: '#9ca3af18' },
  neutro:    { color: '#a89478', bg: '#a8947818' },
};

export default function EmotionPicker({ selected, onSelect, label }: EmotionPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '16px',
            fontWeight: 300,
            color: '#e8e0d4',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </span>
      )}

      {/* Positivas */}
      <div className="flex flex-wrap gap-1.5">
        {POSITIVE_EMOTIONS.map((emo) => (
          <EmotionChip
            key={emo}
            emotion={emo}
            isSelected={selected === emo}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Desafiadoras */}
      <div className="flex flex-wrap gap-1.5">
        {CHALLENGING_EMOTIONS.map((emo) => (
          <EmotionChip
            key={emo}
            emotion={emo}
            isSelected={selected === emo}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Neutro */}
      <div>
        <EmotionChip
          emotion="neutro"
          isSelected={selected === 'neutro'}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function EmotionChip({
  emotion,
  isSelected,
  onSelect,
}: {
  emotion: Emotion;
  isSelected: boolean;
  onSelect: (e: Emotion) => void;
}) {
  const style = EMOTION_STYLES[emotion];

  return (
    <button
      type="button"
      onClick={() => onSelect(emotion)}
      aria-pressed={isSelected}
      aria-label={`Emocao: ${emotion}`}
      className="transition-all duration-200"
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: isSelected ? 600 : 400,
        color: isSelected ? style.color : '#a8947880',
        backgroundColor: isSelected ? style.bg : 'transparent',
        border: `1px solid ${isSelected ? style.color + '50' : '#a8947820'}`,
        borderRadius: '20px',
        padding: '6px 14px',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {emotion}
    </button>
  );
}

export { EMOTION_STYLES };
