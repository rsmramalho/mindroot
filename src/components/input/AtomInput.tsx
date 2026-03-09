// components/input/AtomInput.tsx — ★ O input central (com AI parsing em tempo real)
import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { parseInput } from '@/engine/parsing';
import { aiService } from '@/service/ai-service';
import type { AIParsedResult } from '@/service/ai-service';
import { useAppStore } from '@/store/app-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useItemMutations } from '@/hooks/useItemMutations';
import { TokenPreview } from './TokenPreview';
import { AiPreview } from './AiPreview';
import type { ParsedInput } from '@/types/engine';

export function AtomInput() {
  const [value, setValue] = useState('');
  const [parsed, setParsed] = useState<ParsedInput | null>(null);
  const [aiResult, setAiResult] = useState<AIParsedResult | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAiQuery = useRef('');
  const user = useAppStore((s) => s.user);
  const { setInputFocused } = useAppStore();
  const { createItem } = useItemMutations();
  const { inputTooltipShown, setInputTooltipShown } = useOnboardingStore();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setValue(text);

    const trimmed = text.trim();
    if (trimmed.length > 0) {
      setParsed(parseInput(text));
    } else {
      setParsed(null);
      setAiResult(null);
      setAiPending(false);
      lastAiQuery.current = '';
    }
  }, []);

  // Debounced AI parsing — fires 800ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    const localParsed = trimmed ? parseInput(value) : null;
    const hasTokens = localParsed ? localParsed.tokens.length > 0 : false;

    // Only call AI for natural language (no manual tokens), min 3 chars
    if (!trimmed || trimmed.length < 3 || hasTokens) {
      setAiResult(null);
      setAiPending(false);
      lastAiQuery.current = '';
      return;
    }

    // Don't re-query the same text
    if (trimmed === lastAiQuery.current) return;

    setAiPending(true);

    debounceRef.current = setTimeout(async () => {
      try {
        lastAiQuery.current = trimmed;
        const result = await aiService.parseInput(trimmed);
        // Only update if input hasn't changed while we waited
        if (lastAiQuery.current === trimmed && result) {
          setAiResult(result);
        }
      } catch {
        // AI unavailable — no preview, no problem
      } finally {
        setAiPending(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || !user) return;

    const localParsed = parsed || parseInput(value);

    // If AI result exists, merge it with local
    let finalParsed = localParsed;
    if (aiResult) {
      finalParsed = aiService.mergeWithLocal(aiResult, localParsed);
    }

    try {
      await createItem.mutateAsync({
        user_id: user.id,
        title: finalParsed.title || value.trim(),
        type: finalParsed.type,
        module: finalParsed.module,
        priority: finalParsed.priority,
        emotion_before: finalParsed.emotion_before,
        emotion_after: finalParsed.emotion_after,
        needs_checkin: finalParsed.needs_checkin,
        is_chore: finalParsed.is_chore,
        energy_cost: finalParsed.energy_cost,
        due_date: finalParsed.due_date,
        due_time: finalParsed.due_time,
        ritual_period: finalParsed.ritual_period,
        tags: finalParsed.tags,
        context: finalParsed.context,
      });

      setValue('');
      setParsed(null);
      setAiResult(null);
      setAiPending(false);
      lastAiQuery.current = '';
    } catch {
      // Toast already shown by mutation onError
    }
    inputRef.current?.focus();
  }, [value, user, parsed, aiResult, createItem]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isSaving = createItem.isPending;

  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setInputFocused(true);
            if (!inputTooltipShown) {
              setShowTooltip(true);
              setInputTooltipShown();
              setTimeout(() => setShowTooltip(false), 4000);
            }
          }}
          onBlur={() => {
            setInputFocused(false);
            setShowTooltip(false);
          }}
          placeholder="O que está na sua mente?"
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm font-sans text-light placeholder:text-muted/50 focus:outline-none focus:border-mind/50 focus:ring-1 focus:ring-mind/20 transition-colors"
          autoComplete="off"
          disabled={isSaving}
        />
        {value.trim() && (
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-mind hover:text-light text-sm font-mono px-2 py-1 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-block animate-pulse">...</span>
            ) : '↵'}
          </button>
        )}
      </div>

      {/* First-use tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: '#a8947870',
              backgroundColor: '#1a1d24',
              border: '1px solid #a8947815',
              borderRadius: '8px',
              padding: '8px 12px',
              marginTop: '6px',
            }}
          >
            Experimente: Meditar 10min #mod_soul @amanha
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual tokens preview (instant, local) */}
      {parsed && parsed.tokens.length > 0 && (
        <TokenPreview tokens={parsed.tokens} />
      )}

      {/* AI interpretation preview (debounced, shows before submit) */}
      {(aiPending || aiResult) && parsed && parsed.tokens.length === 0 && (
        <AiPreview fields={aiResult} pending={aiPending} />
      )}
    </div>
  );
}
