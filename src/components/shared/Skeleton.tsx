// components/shared/Skeleton.tsx — Loading placeholder skeletons
// Matches visual structure of ItemRow, ProjectCard, RitualHabit

// ─── Base Skeleton Bar ──────────────────────────────────────
function SkeletonBar({
  width,
  height = 12,
  rounded = '4px',
}: {
  width: string;
  height?: number;
  rounded?: string;
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width,
        height,
        borderRadius: rounded,
        backgroundColor: '#a8947812',
      }}
    />
  );
}

// ─── ItemRow Skeleton ───────────────────────────────────────
export function ItemRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: compact ? '8px 4px' : '10px 8px' }}
    >
      {/* Checkbox circle */}
      <div
        className="flex-shrink-0 animate-pulse"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#a8947810',
          border: '1px solid #a8947815',
        }}
      />
      {/* Priority dot */}
      <div
        className="flex-shrink-0 animate-pulse"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#a8947810',
        }}
      />
      {/* Title */}
      <div className="flex-1 min-w-0">
        <SkeletonBar width={`${55 + Math.random() * 30}%`} height={14} />
      </div>
      {/* Module badge */}
      {!compact && <SkeletonBar width="32px" height={18} rounded="6px" />}
    </div>
  );
}

// ─── ProjectCard Skeleton ───────────────────────────────────
export function ProjectCardSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '12px',
        border: '1px solid #a8947812',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <SkeletonBar width="65%" height={20} rounded="4px" />
        <SkeletonBar width="28px" height={18} rounded="6px" />
      </div>
      {/* Description */}
      <SkeletonBar width="85%" height={12} rounded="4px" />
      {/* Progress bar */}
      <div className="flex items-center gap-3 mt-3">
        <div
          className="flex-1 rounded-full"
          style={{ height: 3, backgroundColor: '#a8947810' }}
        />
        <SkeletonBar width="32px" height={12} />
      </div>
    </div>
  );
}

// ─── RitualHabit Skeleton ───────────────────────────────────
export function RitualHabitSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '12px',
        border: '1px solid #a8947815',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Check circle */}
        <div
          className="flex-shrink-0"
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '2px solid #a8947815',
            backgroundColor: 'transparent',
          }}
        />
        {/* Title + module */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <SkeletonBar width={`${50 + Math.random() * 35}%`} height={16} />
          <SkeletonBar width="40px" height={10} />
        </div>
      </div>
    </div>
  );
}

// ─── Journal Entry Skeleton ─────────────────────────────────
export function JournalEntrySkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '10px',
        border: '1px solid #a8947810',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <SkeletonBar width="60px" height={10} />
        <SkeletonBar width="40px" height={10} />
      </div>
      <SkeletonBar width="90%" height={14} />
      <div className="mt-2">
        <SkeletonBar width="70%" height={12} />
      </div>
    </div>
  );
}

// ─── Generic List Skeleton ──────────────────────────────────
export function ListSkeleton({
  count = 4,
  type = 'item',
}: {
  count?: number;
  type?: 'item' | 'project' | 'ritual' | 'journal';
}) {
  const Component =
    type === 'project'
      ? ProjectCardSkeleton
      : type === 'ritual'
        ? RitualHabitSkeleton
        : type === 'journal'
          ? JournalEntrySkeleton
          : ItemRowSkeleton;

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
