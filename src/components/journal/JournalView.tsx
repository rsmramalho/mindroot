// components/journal/JournalView.tsx — Main journal view
// Entries grouped by date, emotion stats, writing prompt, tag filter

import { useRef, useState, useMemo } from 'react';
import { useJournal } from '@/hooks/useJournal';
import { useRitualStore } from '@/store/ritual-store';
import { EmptyState } from '@/components/shared/EmptyState';
import JournalEntry from './JournalEntry';
import JournalPrompt from './JournalPrompt';
import { ListSkeleton } from '@/components/shared/Skeleton';
import { extractTags } from '@/engine/search';

export default function JournalView() {
  const { grouped, stats, journalItems, isLoading } = useJournal();
  const { periodColor } = useRitualStore();
  const promptRef = useRef<{ open: () => void }>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Extract unique tags from journal items
  const tags = useMemo(() => extractTags(journalItems), [journalItems]);

  // Filter groups by tag
  const filteredGroups = useMemo(() => {
    if (!activeTag) return grouped;

    return grouped
      .map((group) => ({
        ...group,
        entries: group.entries.filter((e) =>
          e.tags?.some((t) => t === activeTag)
        ),
      }))
      .filter((group) => group.entries.length > 0);
  }, [grouped, activeTag]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-1">
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '24px',
              fontWeight: 300,
              color: '#e8e0d4',
              letterSpacing: '-0.02em',
            }}
          >
            Journal
          </h2>
        </div>
        <ListSkeleton count={3} type="journal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ━━━ Header ━━━ */}
      <div className="text-center py-1">
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            fontWeight: 300,
            color: '#e8e0d4',
            letterSpacing: '-0.02em',
          }}
        >
          Journal
        </h2>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="flex items-center justify-center gap-4 mt-2">
            <Stat value={stats.total} label="reflexoes" color={periodColor} />
            <Stat value={stats.todayCount} label="hoje" color="#8a9e7a" />
            <Stat value={stats.withEmotion} label="com emocao" color="#c4a882" />
          </div>
        )}
      </div>

      {/* ━━━ Tag filter bar ━━━ */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          <button
            onClick={() => setActiveTag(null)}
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: !activeTag ? '#e8e0d4' : '#a8947860',
              backgroundColor: !activeTag ? '#a8947820' : 'transparent',
              border: `1px solid ${!activeTag ? '#a8947840' : '#a8947815'}`,
              borderRadius: '4px',
              padding: '2px 8px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Todas
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: activeTag === tag ? '#e8e0d4' : '#a8947860',
                backgroundColor: activeTag === tag ? '#a8947820' : 'transparent',
                border: `1px solid ${activeTag === tag ? '#a8947840' : '#a8947815'}`,
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* ━━━ Write prompt ━━━ */}
      <JournalPrompt ref={promptRef} />

      {/* ━━━ Entries by date ━━━ */}
      {filteredGroups.length === 0 ? (
        activeTag ? (
          <div
            className="text-center py-8"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#a8947850',
            }}
          >
            Nenhuma entrada com a tag #{activeTag}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma reflexao ainda"
            description="Complete rituais ou escreva diretamente para comecar"
            actionLabel="Escrever primeira reflexao"
            onAction={() => promptRef.current?.open()}
          />
        )
      ) : (
        filteredGroups.map((group) => (
          <div key={group.date} className="space-y-2">
            {/* Date header */}
            <div className="flex items-center gap-2 px-1">
              <span
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '15px',
                  fontWeight: 400,
                  color: '#a89478',
                  letterSpacing: '-0.01em',
                }}
              >
                {group.label}
              </span>
              <div
                className="flex-1"
                style={{
                  height: 1,
                  backgroundColor: '#a8947812',
                }}
              />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  color: '#a8947830',
                }}
              >
                {group.entries.length}
              </span>
            </div>

            {/* Entries */}
            {group.entries.map((entry) => (
              <JournalEntry key={entry.id} item={entry} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Stat pill ──────────────────────────────────────────────

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          fontWeight: 600,
          color,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: '#a8947850',
        }}
      >
        {label}
      </span>
    </div>
  );
}
