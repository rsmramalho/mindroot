// components/shared/CommandPalette.tsx
// ⌘K command palette — navigate, search items, quick actions

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { useItems } from '@/hooks/useItems';
import type { AppPage } from '@/types/ui';
import type { AtomItem } from '@/types/item';

interface Command {
  id: string;
  label: string;
  category: 'navegacao' | 'acao' | 'item';
  icon: string;
  action: () => void;
  keywords?: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useAppStore((s) => s.navigate);
  const { items } = useItems();

  // ━━━ Keyboard shortcut: ⌘K or Ctrl+K ━━━
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const navigateTo = useCallback(
    (page: AppPage) => {
      navigate(page);
      close();
    },
    [navigate, close]
  );

  // ━━━ Build commands ━━━
  const commands = useMemo((): Command[] => {
    const navCommands: Command[] = [
      { id: 'nav-home', label: 'Início', category: 'navegacao', icon: '⌂', action: () => navigateTo('home'), keywords: 'home dashboard inicio' },
      { id: 'nav-projects', label: 'Projetos', category: 'navegacao', icon: '▧', action: () => navigateTo('projects'), keywords: 'projects projetos' },
      { id: 'nav-calendar', label: 'Calendário', category: 'navegacao', icon: '▦', action: () => navigateTo('calendar'), keywords: 'calendar calendario agenda' },
      { id: 'nav-inbox', label: 'Inbox', category: 'navegacao', icon: '▤', action: () => navigateTo('inbox'), keywords: 'inbox caixa entrada classificar' },
      { id: 'nav-ritual', label: 'Ritual', category: 'navegacao', icon: '◎', action: () => navigateTo('ritual'), keywords: 'ritual aurora zenite crepusculo' },
      { id: 'nav-journal', label: 'Journal', category: 'navegacao', icon: '○', action: () => navigateTo('journal'), keywords: 'journal diario reflexao' },
      { id: 'nav-analytics', label: 'Analytics', category: 'navegacao', icon: '◈', action: () => navigateTo('analytics'), keywords: 'analytics estatisticas tendencias emocao grafico' },
    ];

    // Item search results
    const normalizeStr = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = normalizeStr(query);
    const itemCommands: Command[] = q.length >= 2
      ? items
          .filter((i) => !i.archived && normalizeStr(i.title).includes(q))
          .slice(0, 8)
          .map((item): Command => ({
            id: `item-${item.id}`,
            label: item.title,
            category: 'item',
            icon: getItemIcon(item),
            action: () => {
              // Navigate to the appropriate page based on item type
              if (item.type === 'project') {
                navigate('projects');
              } else if (item.due_date) {
                navigate('calendar');
              } else {
                navigate('home');
              }
              close();
            },
            keywords: item.tags?.join(' '),
          }))
      : [];

    return [...navCommands, ...itemCommands];
  }, [navigateTo, close, items, query, navigate]);

  // ━━━ Filter commands by query ━━━
  const filtered = useMemo(() => {
    if (!query.trim()) return commands.filter((c) => c.category === 'navegacao');

    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = normalize(query);

    return commands.filter((c) => {
      const searchable = normalize(`${c.label} ${c.keywords || ''}`);
      return searchable.includes(q);
    });
  }, [commands, query]);

  // Keep selectedIndex in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // ━━━ Keyboard nav ━━━
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      }
    },
    [filtered, selectedIndex]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: '#111318d0' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-md mx-4 overflow-hidden"
        style={{
          backgroundColor: '#1a1d24',
          borderRadius: '14px',
          border: '1px solid #a8947820',
          boxShadow: '0 20px 60px #00000060',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3"
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #a8947815',
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '14px',
              color: '#a8947840',
            }}
          >
            /
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar..."
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#e8e0d4',
            }}
          />
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947830',
              padding: '2px 6px',
              border: '1px solid #a8947820',
              borderRadius: '4px',
            }}
          >
            esc
          </span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 && (
            <div
              className="text-center py-6"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#a8947840',
              }}
            >
              Nenhum resultado
            </div>
          )}

          {/* Group by category */}
          {['navegacao', 'acao', 'item'].map((cat) => {
            const catItems = filtered.filter((c) => c.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat}>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#a8947835',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '6px 10px',
                    display: 'block',
                  }}
                >
                  {cat === 'navegacao' ? 'Navegação' : cat === 'acao' ? 'Ações' : 'Itens'}
                </span>
                {catItems.map((cmd) => {
                  const globalIndex = filtered.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className="w-full flex items-center gap-3 transition-colors duration-100"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#a8947812' : 'transparent',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '14px',
                          color: '#a8947850',
                          width: 20,
                          textAlign: 'center',
                        }}
                      >
                        {cmd.icon}
                      </span>
                      <span
                        className="flex-1 text-left truncate"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: isSelected ? '#e8e0d4' : '#a89478cc',
                          fontWeight: 400,
                        }}
                      >
                        {cmd.label}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '10px',
                            color: '#a8947830',
                          }}
                        >
                          ↵
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #a8947810',
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947825',
            }}
          >
            ↑↓ navegar
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947825',
            }}
          >
            ↵ selecionar
          </span>
        </div>
      </div>
    </div>
  );
}

// ━━━ Helpers ━━━

function getItemIcon(item: AtomItem): string {
  switch (item.type) {
    case 'project': return '▧';
    case 'task': return '·';
    case 'habit': return '↻';
    case 'ritual': return '◎';
    case 'chore': return '◆';
    case 'note': return '○';
    case 'reflection': return '◇';
    case 'journal': return '▪';
    default: return '·';
  }
}
