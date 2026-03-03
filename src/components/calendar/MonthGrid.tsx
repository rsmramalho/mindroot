// components/calendar/MonthGrid.tsx
// Month grid with day cells showing item dots

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import type { AtomItem } from '@/types/item';

interface MonthGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  items: AtomItem[];
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function MonthGrid({
  currentMonth,
  selectedDate,
  items,
  onSelectDate,
}: MonthGridProps) {
  // Generate calendar days (including overflow from prev/next month)
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Map: date string → items for that day
  const itemsByDate = useMemo(() => {
    const map = new Map<string, AtomItem[]>();
    for (const item of items) {
      if (!item.due_date) continue;
      const key = item.due_date.slice(0, 10); // yyyy-MM-dd
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              color: '#a8947840',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '4px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(dateKey) ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const hasItems = dayItems.length > 0;
          const hasOverdue = dayItems.some(
            (i) => !i.completed && new Date(i.due_date!) < new Date() && !isToday(new Date(i.due_date!))
          );

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className="relative flex flex-col items-center justify-center transition-all duration-150"
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                backgroundColor: selected
                  ? '#c4a88218'
                  : today
                    ? '#a8947808'
                    : 'transparent',
                border: selected
                  ? '1px solid #c4a88240'
                  : today
                    ? '1px solid #a8947820'
                    : '1px solid transparent',
              }}
            >
              {/* Day number */}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '13px',
                  fontWeight: today ? 600 : 400,
                  color: !inMonth
                    ? '#a8947820'
                    : selected
                      ? '#c4a882'
                      : today
                        ? '#e8e0d4'
                        : '#a89478cc',
                }}
              >
                {format(day, 'd')}
              </span>

              {/* Item dots */}
              {hasItems && inMonth && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {dayItems.slice(0, 3).map((item, i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 3,
                        height: 3,
                        backgroundColor: hasOverdue
                          ? '#e85d5d'
                          : item.completed
                            ? '#8a9e7a'
                            : '#c4a882',
                      }}
                    />
                  ))}
                  {dayItems.length > 3 && (
                    <span
                      style={{
                        fontSize: '7px',
                        color: '#a8947860',
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
