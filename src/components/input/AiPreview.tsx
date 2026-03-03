// components/input/AiPreview.tsx — Preview of AI-interpreted fields
import type { AIParsedResult } from '@/service/ai-service';

interface AiPreviewProps {
  fields: AIParsedResult | null;
  pending: boolean;
}

const LABELS: Record<string, string> = {
  task: 'tarefa',
  habit: 'habito',
  ritual: 'ritual',
  chore: 'afazer',
  project: 'projeto',
  note: 'nota',
  reflection: 'reflexao',
  journal: 'diario',
  purpose: 'proposito',
  work: 'trabalho',
  family: 'familia',
  body: 'corpo',
  mind: 'mente',
  soul: 'alma',
  aurora: 'aurora',
  zenite: 'zenite',
  crepusculo: 'crepusculo',
  urgente: 'urgente',
  importante: 'importante',
  manutencao: 'manutencao',
  futuro: 'futuro',
};

function label(value: string): string {
  return LABELS[value] || value;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'hoje';
    if (diff === 1) return 'amanha';
    if (diff === -1) return 'ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

export function AiPreview({ fields, pending }: AiPreviewProps) {
  if (pending) {
    return (
      <div className="flex items-center gap-1.5 px-1 py-2">
        <span className="text-[10px] font-mono text-mind uppercase tracking-wider opacity-60">ai</span>
        <span className="text-[11px] font-mono text-muted animate-pulse">
          interpretando...
        </span>
      </div>
    );
  }

  if (!fields) return null;

  const chips: { text: string; style: string }[] = [];

  // Always show type
  chips.push({
    text: label(fields.type),
    style: 'bg-surface border-mind text-mind',
  });

  if (fields.module) {
    chips.push({
      text: label(fields.module),
      style: 'bg-surface border-mod-work text-mod-work',
    });
  }
  if (fields.priority) {
    chips.push({
      text: label(fields.priority),
      style: 'bg-surface border-heart text-heart',
    });
  }
  if (fields.emotion_before) {
    chips.push({
      text: label(fields.emotion_before),
      style: 'bg-surface border-aurora text-aurora',
    });
  }
  if (fields.due_date) {
    chips.push({
      text: formatDate(fields.due_date),
      style: 'bg-surface border-zenite text-zenite',
    });
  }
  if (fields.due_time) {
    chips.push({
      text: fields.due_time,
      style: 'bg-surface border-zenite text-zenite',
    });
  }
  if (fields.ritual_period) {
    chips.push({
      text: label(fields.ritual_period),
      style: 'bg-surface border-crepusculo text-crepusculo',
    });
  }
  if (fields.is_chore) {
    chips.push({
      text: 'afazer',
      style: 'bg-surface border-crepusculo text-crepusculo',
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 py-2">
      <span className="text-[10px] font-mono text-mind uppercase tracking-wider opacity-60">ai</span>
      {chips.map((chip, i) => (
        <span
          key={`ai-${i}`}
          className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${chip.style}`}
        >
          {chip.text}
        </span>
      ))}
    </div>
  );
}
