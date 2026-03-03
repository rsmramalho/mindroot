// components/calendar/CalendarView.tsx
// Month navigation + MonthGrid + DayDetail
import { useState, useCallback } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AtomItem } from '@/types/item';
import MonthGrid from './MonthGrid';
import DayDetail from './DayDetail';

interface CalendarViewProps {
  items: AtomItem[];
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (id: string, updates: Partial<AtomItem>) => void;
}

export default function CalendarView({
  items,
  onComplete,
  onUncomplete,
  onDelete,
  onArchive,
  onEdit,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const goNext = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const goPrev = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const goToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }, []);

  return (
    <div className="flex flex-col gap-2" style={{ paddingBottom: '80px' }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={goPrev}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '16px',
            color: '#a8947860',
            padding: '4px 8px',
          }}
        >
          ‹
        </button>

        <button
          onClick={goToday}
          className="capitalize"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '18px',
            fontWeight: 400,
            color: '#e8e0d4',
            letterSpacing: '-0.01em',
          }}
        >
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </button>

        <button
          onClick={goNext}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '16px',
            color: '#a8947860',
            padding: '4px 8px',
          }}
        >
          ›
        </button>
      </div>

      {/* Grid */}
      <MonthGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        items={items}
        onSelectDate={setSelectedDate}
      />

      {/* Day detail */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          items={items}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onDelete={onDelete}
          onArchive={onArchive}
          onEdit={onEdit}
        />
      )}
    </div>
  );
}
