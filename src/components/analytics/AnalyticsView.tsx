// components/analytics/AnalyticsView.tsx — Analytics dashboard
// Emotional trends, completion heatmap, module breakdown, streaks

import { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MODULES, POSITIVE_EMOTIONS } from '@/types/item';
import type { DailySnapshot, ModuleStats } from '@/hooks/useAnalytics';
import EmptyState from '@/components/shared/EmptyState';

type TimeRange = 7 | 14 | 30;

export default function AnalyticsView() {
  const [range, setRange] = useState<TimeRange>(30);
  const { dailySnapshots, moduleStats, streak, summary, isLoading } = useAnalytics(range);

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex justify-center gap-2">
          {[7, 14, 30].map((r) => (
            <div
              key={r}
              className="animate-pulse rounded-full"
              style={{ width: 48, height: 28, backgroundColor: '#a8947810' }}
            />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl"
            style={{ height: 120, backgroundColor: '#a8947808' }}
          />
        ))}
      </div>
    );
  }

  if (summary.totalCompleted === 0 && summary.totalActive === 0) {
    return (
      <EmptyState
        title="Sem dados ainda"
        description="Complete algumas tarefas para ver analytics"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Time Range */}
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            fontWeight: 300,
            color: '#e8e0d4',
            letterSpacing: '-0.02em',
          }}
        >
          Analytics
        </h2>
        <div className="flex items-center gap-1">
          {([7, 14, 30] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                fontWeight: range === r ? 600 : 400,
                color: range === r ? '#c4a882' : '#a8947850',
                backgroundColor: range === r ? '#c4a88215' : 'transparent',
                border: `1px solid ${range === r ? '#c4a88230' : 'transparent'}`,
                borderRadius: '6px',
                padding: '4px 10px',
              }}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          value={String(summary.totalCompleted)}
          label="concluídos"
          color="#8a9e7a"
        />
        <SummaryCard
          value={String(streak.current)}
          label="dias seguidos"
          color="#c4a882"
        />
        <SummaryCard
          value={summary.topEmotion || '—'}
          label="emocao freq."
          color="#d4856a"
        />
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap snapshots={dailySnapshots} />

      {/* Emotional Pulse Chart */}
      <EmotionTrend snapshots={dailySnapshots} />

      {/* Module Breakdown */}
      <ModuleBreakdown stats={moduleStats} />

      {/* Streak + Misc */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Media/dia" value={String(summary.avgCompletedPerDay)} />
        <StatCard label="Reflexoes" value={String(summary.totalReflections)} />
        <StatCard label="Trabalho inv." value={String(summary.choresDone)} />
        <StatCard label="Recorde" value={`${streak.longest}d`} />
      </div>
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────

function SummaryCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg text-center"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '14px 8px',
      }}
    >
      <span
        className="block"
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '24px',
          fontWeight: 400,
          color,
        }}
      >
        {value}
      </span>
      <span
        className="block mt-1"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '9px',
          color: '#a8947860',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Activity Heatmap ──────────────────────────────────

function ActivityHeatmap({ snapshots }: { snapshots: DailySnapshot[] }) {
  const max = Math.max(...snapshots.map((s) => s.completed), 1);

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '14px 16px',
      }}
    >
      <span
        className="block mb-3"
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '14px',
          fontWeight: 400,
          color: '#a89478',
        }}
      >
        Atividade
      </span>
      <div className="flex items-end gap-[3px]" style={{ height: 48 }}>
        {snapshots.map((snap) => {
          const height = snap.completed > 0 ? Math.max(4, (snap.completed / max) * 48) : 2;
          const opacity = snap.completed > 0 ? 0.3 + (snap.completed / max) * 0.7 : 0.08;
          return (
            <div
              key={snap.date}
              title={`${snap.date}: ${snap.completed} concluídos`}
              className="flex-1 rounded-sm transition-all duration-200"
              style={{
                height: `${height}px`,
                backgroundColor: '#8a9e7a',
                opacity,
                minWidth: 2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Emotion Trend ────────────────────────────────────

function EmotionTrend({ snapshots }: { snapshots: DailySnapshot[] }) {
  const withEmotions = snapshots.filter((s) => s.emotions.length > 0);
  if (withEmotions.length === 0) return null;

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '14px 16px',
      }}
    >
      <span
        className="block mb-3"
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '14px',
          fontWeight: 400,
          color: '#a89478',
        }}
      >
        Pulso emocional
      </span>
      <div className="flex items-center gap-[3px]" style={{ height: 24 }}>
        {snapshots.map((snap) => {
          if (snap.emotions.length === 0) {
            return (
              <div
                key={snap.date}
                className="flex-1 rounded-sm"
                style={{ height: 4, backgroundColor: '#a8947810', minWidth: 2 }}
              />
            );
          }

          const positiveCount = snap.emotions.filter((e) =>
            POSITIVE_EMOTIONS.includes(e)
          ).length;
          const ratio = positiveCount / snap.emotions.length;

          // Interpolate color: red(challenging) → gold(mixed) → green(positive)
          const color =
            ratio >= 0.7 ? '#8a9e7a' : ratio >= 0.4 ? '#c4a882' : '#d4856a';

          return (
            <div
              key={snap.date}
              title={`${snap.date}: ${Math.round(ratio * 100)}% positivo`}
              className="flex-1 rounded-full transition-all"
              style={{
                height: 8 + Math.round(ratio * 16),
                backgroundColor: color,
                opacity: 0.7,
                minWidth: 2,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#a8947840',
          }}
        >
          desafiador
        </span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#a8947840',
          }}
        >
          positivo
        </span>
      </div>
    </div>
  );
}

// ─── Module Breakdown ────────────────────────────────

function ModuleBreakdown({ stats }: { stats: ModuleStats[] }) {
  const active = stats.filter((s) => s.total > 0);
  if (active.length === 0) return null;

  const maxTotal = Math.max(...active.map((s) => s.total), 1);

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '14px 16px',
      }}
    >
      <span
        className="block mb-3"
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '14px',
          fontWeight: 400,
          color: '#a89478',
        }}
      >
        Modulos
      </span>
      <div className="flex flex-col gap-2.5">
        {active.map((stat) => {
          const info = MODULES.find((m) => m.key === stat.module);
          if (!info) return null;
          const completionRate =
            stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

          return (
            <div key={stat.module} className="flex items-center gap-3">
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: info.color,
                  fontWeight: 500,
                  width: 70,
                  flexShrink: 0,
                }}
              >
                {info.label}
              </span>
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: 6, backgroundColor: '#a8947812' }}
              >
                <div
                  className="rounded-full transition-all duration-500"
                  style={{
                    height: '100%',
                    width: `${(stat.total / maxTotal) * 100}%`,
                    backgroundColor: info.color,
                    opacity: 0.6,
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  color: '#a8947860',
                  flexShrink: 0,
                  width: 36,
                  textAlign: 'right',
                }}
              >
                {completionRate}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #a8947810',
        padding: '12px 14px',
      }}
    >
      <span
        className="block"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '18px',
          color: '#e8e0d4',
          fontWeight: 400,
        }}
      >
        {value}
      </span>
      <span
        className="block mt-1"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: '#a8947850',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  );
}
