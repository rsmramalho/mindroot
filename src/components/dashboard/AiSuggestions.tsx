// components/dashboard/AiSuggestions.tsx — AI contextual suggestions panel
// Shows max 3 pattern-based suggestions on the dashboard

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AtomItem } from '@/types/item';
import { generateAiSuggestions, ACTION_LABELS, ACTION_COLORS } from '@/engine/ai-suggestions';
import type { AiSuggestion } from '@/engine/ai-suggestions';

interface AiSuggestionsProps {
  items: AtomItem[];
}

export default function AiSuggestions({ items }: AiSuggestionsProps) {
  const suggestions = useMemo(() => generateAiSuggestions(items), [items]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <section aria-label="Sugestoes contextuais">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            fontWeight: 500,
            color: '#a8947850',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          sugestoes
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            backgroundColor: '#a8947812',
          }}
        />
      </div>

      {/* Suggestion cards */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {visible.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={handleDismiss}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── SuggestionCard ─────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onDismiss,
}: {
  suggestion: AiSuggestion;
  onDismiss: (id: string) => void;
}) {
  const color = ACTION_COLORS[suggestion.action];
  const label = ACTION_LABELS[suggestion.action];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '10px',
        border: `1px solid ${color}18`,
        padding: '12px 14px',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Left accent */}
        <div
          className="flex-shrink-0 mt-1"
          style={{
            width: 3,
            height: 32,
            borderRadius: 2,
            backgroundColor: `${color}40`,
          }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#e8e0d4cc',
              lineHeight: 1.5,
              marginBottom: 6,
            }}
          >
            {suggestion.text}
          </p>

          {/* Context line */}
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947840',
              lineHeight: 1.4,
            }}
          >
            {suggestion.context}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                fontWeight: 500,
                color: color,
                backgroundColor: `${color}12`,
                borderRadius: '4px',
                padding: '3px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </span>

            <button
              onClick={() => onDismiss(suggestion.id)}
              aria-label="Dispensar sugestao"
              className="transition-opacity duration-150 hover:opacity-80"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                color: '#a8947830',
                padding: '3px 6px',
              }}
            >
              dispensar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
