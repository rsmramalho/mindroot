// components/journal/JournalEntry.tsx — Individual journal entry
// Shows emotion flow, title, description, tags, and context

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AtomItem } from '@/types/item';
import { EMOTION_STYLES } from '@/components/soul/EmotionPicker';
import ShareReflectionSheet from './ShareReflectionSheet';
import { format, parseISO } from 'date-fns';

interface JournalEntryProps {
  item: AtomItem;
}

export default function JournalEntry({ item }: JournalEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isReflection = item.type === 'reflection';
  const hasDescription = !!item.description;
  const time = format(parseISO(item.created_at), 'HH:mm');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="transition-all duration-200"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '12px',
        border: '1px solid #a8947810',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start gap-3">
          {/* Type indicator */}
          <div
            className="flex-shrink-0 mt-0.5"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
              color: isReflection ? '#c4a882' : '#8a9e7a',
              opacity: 0.6,
              lineHeight: 1,
            }}
          >
            {isReflection ? '↻' : '○'}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#e8e0d4',
                lineHeight: 1.35,
                letterSpacing: '-0.01em',
                display: 'block',
              }}
            >
              {item.title}
            </span>

            {/* Emotion flow */}
            <div className="flex items-center gap-2 mt-1.5">
              {item.emotion_before && (
                <>
                  <EmotionDot emotion={item.emotion_before} />
                  {item.emotion_after && (
                    <span style={{ color: '#a8947830', fontSize: '9px' }}>→</span>
                  )}
                </>
              )}
              {item.emotion_after && (
                <EmotionDot emotion={item.emotion_after} />
              )}

              {/* Time */}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  color: '#a8947840',
                  marginLeft: 'auto',
                }}
              >
                {time}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (hasDescription || item.context || item.tags.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-0"
              style={{ borderTop: '1px solid #a8947808' }}
            >
              {/* Description */}
              {hasDescription && (
                <p
                  className="mt-3"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 300,
                    color: '#e8e0d4c0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.description}
                </p>
              )}

              {/* Context */}
              {item.context && (
                <p
                  className="mt-2"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '10px',
                    color: '#a8947840',
                    fontStyle: 'italic',
                  }}
                >
                  {item.context}
                </p>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '10px',
                        color: '#a8947850',
                        backgroundColor: '#a8947810',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Ritual period badge */}
              {item.ritual_period && (
                <div
                  className="mt-2 inline-block"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '10px',
                    color:
                      item.ritual_period === 'aurora'
                        ? '#f0c674'
                        : item.ritual_period === 'zenite'
                        ? '#e8e0d4'
                        : '#8a6e5a',
                    backgroundColor:
                      item.ritual_period === 'aurora'
                        ? '#f0c67415'
                        : item.ritual_period === 'zenite'
                        ? '#e8e0d415'
                        : '#8a6e5a15',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    letterSpacing: '0.06em',
                  }}
                >
                  {item.ritual_period}
                </div>
              )}

              {/* Share button */}
              {isReflection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShare(true);
                  }}
                  className="mt-3"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#c4a88280',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#c4a88210',
                    border: '1px solid #c4a88215',
                  }}
                >
                  Compartilhar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareReflectionSheet
        item={showShare ? item : null}
        onClose={() => setShowShare(false)}
      />
    </motion.div>
  );
}

// ─── Emotion Dot ────────────────────────────────────────────

function EmotionDot({ emotion }: { emotion: string }) {
  const style = EMOTION_STYLES[emotion as keyof typeof EMOTION_STYLES];
  if (!style) return null;

  return (
    <div className="flex items-center gap-1">
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: style.color,
          opacity: 0.8,
        }}
      />
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: style.color,
          fontWeight: 500,
          opacity: 0.7,
        }}
      >
        {emotion}
      </span>
    </div>
  );
}
