// components/ritual/RitualHabit.tsx — Individual ritual item
// Checkable, with module badge and soul layer support

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AtomItem } from '@/types/item';
import { MODULES } from '@/types/item';
import { getRecurrenceBadge } from '@/engine/recurrence';

interface RitualHabitProps {
  item: AtomItem;
  onToggle: (item: AtomItem) => void;
  periodColor: string;
}

export default function RitualHabit({ item, onToggle, periodColor }: RitualHabitProps) {
  const [pressing, setPressing] = useState(false);
  const moduleInfo = MODULES.find((m) => m.key === item.module);
  const recurrenceBadge = getRecurrenceBadge(item.recurrence);

  return (
    <motion.button
      layout
      onClick={() => onToggle(item)}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      className="w-full text-left transition-all duration-200"
      style={{
        backgroundColor: item.completed ? '#1a1d2408' : '#1a1d24',
        borderRadius: '12px',
        border: `1px solid ${item.completed ? '#a8947810' : '#a8947815'}`,
        padding: '14px 16px',
        opacity: item.completed ? 0.55 : 1,
        transform: pressing ? 'scale(0.98)' : 'scale(1)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: item.completed ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        {/* Check circle */}
        <div
          className="flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `2px solid ${item.completed ? periodColor : '#a8947830'}`,
            backgroundColor: item.completed ? periodColor + '20' : 'transparent',
          }}
        >
          <AnimatePresence>
            {item.completed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{
                  color: periodColor,
                  fontSize: '11px',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Title + module */}
        <div className="flex-1 min-w-0">
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '17px',
              fontWeight: 400,
              color: item.completed ? '#a8947860' : '#e8e0d4',
              letterSpacing: '-0.01em',
              textDecoration: item.completed ? 'line-through' : 'none',
              textDecorationColor: '#a8947830',
              display: 'block',
            }}
          >
            {item.title}
          </span>

          {moduleInfo && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                fontWeight: 400,
                color: moduleInfo.color,
                opacity: item.completed ? 0.5 : 0.7,
                letterSpacing: '0.04em',
                marginTop: '2px',
                display: 'block',
              }}
            >
              {moduleInfo.label.toLowerCase()}
            </span>
          )}
        </div>

        {/* Recurrence badge */}
        {recurrenceBadge && (
          <span
            style={{
              fontSize: '9px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
              color: item.completed ? `${periodColor}60` : periodColor,
              backgroundColor: `${periodColor}10`,
              border: `1px solid ${periodColor}20`,
              borderRadius: '4px',
              padding: '2px 6px',
              letterSpacing: '0.04em',
              opacity: item.completed ? 0.5 : 0.8,
              flexShrink: 0,
            }}
          >
            ↻ {recurrenceBadge}
          </span>
        )}

        {/* Check-in indicator */}
        {item.needs_checkin && !item.completed && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: periodColor,
              opacity: 0.6,
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </motion.button>
  );
}
