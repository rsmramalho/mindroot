// components/ritual/RitualView.tsx — Main ritual view
// Shows current period, ritual items, progress arc, and check-in

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRitual } from '@/hooks/useRitual';
import { useItemMutations } from '@/hooks/useItemMutations';
import { useSoul } from '@/hooks/useSoul';
import { useRitualStore } from '@/store/ritual-store';
import type { AtomItem, RitualSlot } from '@/types/item';
import RitualHabit from './RitualHabit';
import RitualCheckIn from './RitualCheckIn';
import CheckInPrompt from '@/components/soul/CheckInPrompt';
import { ListSkeleton } from '@/components/shared/Skeleton';

export default function RitualView() {
  const {
    ritualsByPeriod,
    periodProgress,
    isPeriodComplete,
    periodConfig,
    periodPrompt,
    allPeriodConfigs,
    isLoading,
  } = useRitual();

  const { currentPeriod } = useRitualStore();
  const { completeMutation, uncompleteMutation } = useItemMutations();
  const { checkIn, onItemComplete, startPicking, selectEmotion, skip, dismiss } = useSoul();

  const handleToggle = useCallback(
    (item: AtomItem) => {
      if (item.status === 'completed') {
        uncompleteMutation.mutate(item.id);
      } else {
        completeMutation.mutate(item.id);
        // Trigger soul check-in if item has needs_checkin
        onItemComplete({ ...item, status: 'completed' });
      }
    },
    [completeMutation, uncompleteMutation, onItemComplete]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-2">
          <div className="h-8 w-32 mx-auto animate-pulse rounded" style={{ backgroundColor: '#a8947810' }} />
          <div className="h-3 w-20 mx-auto mt-2 animate-pulse rounded" style={{ backgroundColor: '#a8947808' }} />
        </div>
        <ListSkeleton count={4} type="ritual" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ━━━ Period header ━━━ */}
      <div className="text-center py-2">
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '28px',
            fontWeight: 300,
            color: periodConfig.color,
            letterSpacing: '-0.03em',
          }}
        >
          {periodConfig.greeting}
        </motion.h2>
        <p
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            fontWeight: 400,
            color: '#a8947860',
            marginTop: '4px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {periodConfig.label}
        </p>
      </div>

      {/* ━━━ Progress arc ━━━ */}
      {periodProgress.total > 0 && (
        <div className="flex items-center justify-center gap-3">
          <ProgressRing
            percent={periodProgress.percent}
            color={periodConfig.color}
          />
          <div>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '13px',
                fontWeight: 500,
                color: periodConfig.color,
              }}
            >
              {periodProgress.done}/{periodProgress.total}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#a8947850',
                marginLeft: '6px',
              }}
            >
              rituais
            </span>
          </div>
        </div>
      )}

      {/* ━━━ Current period rituals ━━━ */}
      <PeriodSection
        period={currentPeriod}
        items={ritualsByPeriod[currentPeriod]}
        color={periodConfig.color}
        label={periodConfig.label}
        isCurrent
        onToggle={handleToggle}
      />

      {/* ━━━ Period check-in ━━━ */}
      <RitualCheckIn
        period={currentPeriod}
        periodColor={periodConfig.color}
        prompt={periodPrompt}
        isPeriodComplete={isPeriodComplete}
      />

      {/* ━━━ Other periods (dimmed) ━━━ */}
      {allPeriodConfigs
        .filter((p) => p.key !== currentPeriod)
        .map((p) => (
          <PeriodSection
            key={p.key}
            period={p.key}
            items={ritualsByPeriod[p.key]}
            color={p.color}
            label={p.label}
            isCurrent={false}
            onToggle={handleToggle}
          />
        ))}

      {/* ━━━ Soul check-in overlay ━━━ */}
      <CheckInPrompt
        state={checkIn}
        onStartPicking={startPicking}
        onSelectEmotion={selectEmotion}
        onSkip={skip}
        onDismiss={dismiss}
      />
    </div>
  );
}

// ─── Period Section ──────────────────────────────────────────

function PeriodSection({
  period: _period,
  items,
  color,
  label,
  isCurrent,
  onToggle,
}: {
  period: RitualSlot;
  items: AtomItem[];
  color: string;
  label: string;
  isCurrent: boolean;
  onToggle: (item: AtomItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className="space-y-2"
      style={{ opacity: isCurrent ? 1 : 0.45 }}
    >
      {/* Section header (hidden for current period — already shown above) */}
      {!isCurrent && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: color,
            }}
          />
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              fontWeight: 500,
              color,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        </div>
      )}

      {/* Ritual items */}
      {items.map((item) => (
        <RitualHabit
          key={item.id}
          item={item}
          onToggle={onToggle}
          periodColor={color}
        />
      ))}
    </div>
  );
}

// ─── Progress Ring ──────────────────────────────────────────

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const radius = 18;
  const stroke = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={46} height={46} viewBox="0 0 46 46">
      {/* Background ring */}
      <circle
        cx="23"
        cy="23"
        r={radius}
        fill="none"
        stroke="#a8947815"
        strokeWidth={stroke}
      />
      {/* Progress ring */}
      <motion.circle
        cx="23"
        cy="23"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        transform="rotate(-90 23 23)"
        style={{ opacity: 0.8 }}
      />
    </svg>
  );
}
