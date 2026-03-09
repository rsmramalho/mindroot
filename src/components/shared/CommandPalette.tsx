// components/shared/CommandPalette.tsx
// ⌘K command palette — navigate, search items, advanced filters

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useItems } from '@/hooks/useItems';
import type { AppPage } from '@/types/ui';
import type { AtomItem } from '@/types/item';
import { MODULES, EMOTIONS } from '@/types/item';
import { RITUAL_PERIODS } from '@/types/ui';
import {
  parseSearchQuery,
  searchItems,
  hasActiveFilters,
  getFilterLabels,
  EMPTY_FILTERS,
} from '@/engine/search';
import type { SearchFilters } from '@/engine/search';

interface Command {
  id: string;
  label: string;
  category: 'navegacao' | 'acao' | 'filtro' | 'item';
  icon: string;
  action: () => void;
  keywords?: string;
  subtitle?: string;
  color?: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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

  // ━━━ Parse query into filters ━━━
  const filters = useMemo(() => parseSearchQuery(query), [query]);
  const filtersActive = hasActiveFilters(filters);
  const filterLabels = useMemo(() => getFilterLabels(filters), [filters]);

  // ━━━ Helper: insert filter prefix ━━━
  const insertFilter = useCallback((prefix: string) => {
    setQuery((q) => {
      const trimmed = q.trim();
      return trimmed ? `${trimmed} ${prefix}` : prefix;
    });
    setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  // ━━━ Build commands ━━━
  const commands = useMemo((): Command[] => {
    const hasQuery = query.trim().length > 0;
    const hasText = filters.text.length > 0;

    // Navigation commands (always shown when no query)
    const navCommands: Command[] = [
      { id: 'nav-home', label: 'Inicio', category: 'navegacao', icon: '⌂', action: () => navigateTo('home'), keywords: 'home dashboard inicio' },
      { id: 'nav-projects', label: 'Projetos', category: 'navegacao', icon: '▧', action: () => navigateTo('projects'), keywords: 'projects projetos' },
      { id: 'nav-calendar', label: 'Calendario', category: 'navegacao', icon: '▦', action: () => navigateTo('calendar'), keywords: 'calendar calendario agenda' },
      { id: 'nav-inbox', label: 'Inbox', category: 'navegacao', icon: '▤', action: () => navigateTo('inbox'), keywords: 'inbox caixa entrada classificar' },
      { id: 'nav-ritual', label: 'Ritual', category: 'navegacao', icon: '◎', action: () => navigateTo('ritual'), keywords: 'ritual aurora zenite crepusculo' },
      { id: 'nav-journal', label: 'Journal', category: 'navegacao', icon: '○', action: () => navigateTo('journal'), keywords: 'journal diario reflexao' },
      { id: 'nav-analytics', label: 'Analytics', category: 'navegacao', icon: '◈', action: () => navigateTo('analytics'), keywords: 'analytics estatisticas tendencias emocao grafico' },
    ];

    // Filter shortcut commands (shown when typing "mod", "emo", etc.)
    const filterCommands: Command[] = [];
    const q = filters.text.toLowerCase();

    if (q && !hasQuery) {
      // Don't show filter suggestions when already using prefixes
    } else if (q.length >= 1 && q.length <= 4) {
      // Show filter type suggestions
      if ('mod'.startsWith(q) || 'modulo'.startsWith(q)) {
        for (const m of MODULES) {
          filterCommands.push({
            id: `filter-mod-${m.key}`,
            label: m.label,
            category: 'filtro',
            icon: '◇',
            action: () => insertFilter(`mod:${m.key}`),
            color: m.color,
            subtitle: 'Filtrar por modulo',
          });
        }
      }
      if ('emo'.startsWith(q) || 'emocao'.startsWith(q)) {
        for (const e of EMOTIONS) {
          filterCommands.push({
            id: `filter-emo-${e}`,
            label: e,
            category: 'filtro',
            icon: '◆',
            action: () => insertFilter(`emo:${e}`),
            subtitle: 'Filtrar por emocao',
          });
        }
      }
      if ('per'.startsWith(q) || 'periodo'.startsWith(q)) {
        for (const p of RITUAL_PERIODS) {
          filterCommands.push({
            id: `filter-per-${p.key}`,
            label: p.label,
            category: 'filtro',
            icon: '◎',
            action: () => insertFilter(`per:${p.key}`),
            color: p.color,
            subtitle: 'Filtrar por periodo',
          });
        }
      }
    }

    // Item search results (when text >= 2 chars OR filters active)
    let itemCommands: Command[] = [];
    if (hasText || filtersActive) {
      const searchResults = searchItems(items, filters);
      itemCommands = searchResults.slice(0, 12).map((r): Command => ({
        id: `item-${r.item.id}`,
        label: r.item.title,
        category: 'item',
        icon: getItemIcon(r.item),
        subtitle: buildSubtitle(r.item, r.matchField),
        action: () => {
          if (r.item.type === 'project') {
            navigate('projects');
          } else if (r.item.type === 'journal' || r.item.type === 'reflection') {
            navigate('journal');
          } else if (r.item.due_date) {
            navigate('calendar');
          } else {
            navigate('home');
          }
          close();
        },
        keywords: r.item.tags?.join(' '),
      }));
    }

    return [...navCommands, ...filterCommands, ...itemCommands];
  }, [navigateTo, close, items, query, navigate, filters, filtersActive, insertFilter]);

  // ━━━ Filter commands by query ━━━
  const filtered = useMemo(() => {
    const hasText = filters.text.trim().length > 0;

    if (!query.trim()) return commands.filter((c) => c.category === 'navegacao');

    // When filters are active or text search, show items + filters
    if (filtersActive || hasText) {
      const items = commands.filter((c) => c.category === 'item');
      if (items.length > 0) return items;
    }

    // Filter nav + filter commands by text
    const q = filters.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!q) {
      // Only prefix filters, show matching items
      return commands.filter((c) => c.category === 'item');
    }

    const navAndFilter = commands.filter((c) => c.category === 'navegacao' || c.category === 'filtro');
    const matched = navAndFilter.filter((c) => {
      const searchable = `${c.label} ${c.keywords || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return searchable.includes(q);
    });

    // Also include item results
    const itemResults = commands.filter((c) => c.category === 'item');

    return [...matched, ...itemResults];
  }, [commands, query, filters, filtersActive]);

  // Keep selectedIndex in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

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
      } else if (e.key === 'Backspace' && query === '' && filtersActive) {
        // Clear last filter on backspace when input is empty
        close();
      }
    },
    [filtered, selectedIndex, query, filtersActive, close]
  );

  if (!open) return null;

  const CATEGORIES: { key: Command['category']; label: string }[] = [
    { key: 'navegacao', label: 'Navegacao' },
    { key: 'filtro', label: 'Filtros' },
    { key: 'item', label: 'Itens' },
  ];

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: '#111318d0' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.div
        className="w-full max-w-md mx-4 overflow-hidden"
        style={{
          backgroundColor: '#1a1d24',
          borderRadius: '14px',
          border: '1px solid #a8947820',
          boxShadow: '0 20px 60px #00000060',
        }}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
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
            placeholder="Buscar ou filtrar... (mod: emo: per: tag:)"
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

        {/* Active filter chips */}
        {filterLabels.length > 0 && (
          <div
            className="flex flex-wrap gap-1"
            style={{ padding: '6px 16px 2px' }}
          >
            {filterLabels.map((fl) => (
              <span
                key={fl.key}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  color: fl.color,
                  backgroundColor: `${fl.color}15`,
                  border: `1px solid ${fl.color}30`,
                  borderRadius: '4px',
                  padding: '1px 6px',
                }}
              >
                {fl.label}
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '360px', overflowY: 'auto', padding: '6px' }}>
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
          {CATEGORIES.map(({ key: cat, label: catLabel }) => {
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
                  {catLabel}
                </span>
                {catItems.map((cmd) => {
                  const globalIndex = filtered.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      data-selected={isSelected}
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
                          color: cmd.color || '#a8947850',
                          width: 20,
                          textAlign: 'center',
                        }}
                      >
                        {cmd.icon}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <span
                          className="block truncate"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: isSelected ? '#e8e0d4' : '#a89478cc',
                            fontWeight: 400,
                          }}
                        >
                          {cmd.label}
                        </span>
                        {cmd.subtitle && (
                          <span
                            className="block truncate"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '10px',
                              color: '#a8947840',
                            }}
                          >
                            {cmd.subtitle}
                          </span>
                        )}
                      </div>
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
            mod: emo: per: tag: data:
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
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
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

function buildSubtitle(item: AtomItem, matchField: string): string {
  const parts: string[] = [];

  if (item.module) {
    const m = MODULES.find((mod) => mod.key === item.module);
    if (m) parts.push(m.label);
  }
  if (item.emotion_before) parts.push(item.emotion_before);
  if (item.tags?.length) parts.push(item.tags.map((t) => `#${t}`).join(' '));
  if (matchField === 'description') parts.push('(descricao)');

  return parts.join(' · ');
}
