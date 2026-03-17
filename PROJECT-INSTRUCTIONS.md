# MindRoot — Project Instructions

## Sobre
MindRoot é um sistema de produtividade emocional. Não é um to-do app — emoção precede ação, reflexão fecha o ciclo.

## Stack
React 19 + TypeScript 5.8 + Vite 6 + Tailwind 3.4 + Supabase + TanStack Query 5 + Zustand 5 + Framer Motion + date-fns

## Repo
https://github.com/rsmramalho/mindroot

## Produção
https://mindroot.com.au (Vercel + GoDaddy DNS)

## Supabase
Project ref: avvwjkzkzklloyfugzer

## Workflow
Claude Code no terminal do VS Code. Sem zip. CLAUDE.md no repo é a fonte de verdade.

## Regras de Arquitetura

### Regra #1 — Fonte de verdade
CLAUDE.md no repo. Lê-lo antes de qualquer edição. Nunca codar baseado em specs externas.

### Regra #2 — Named exports
Páginas usam named exports. App.tsx importa { HomePage }, { InboxPage }, etc.

### Regra #3 — Path alias
@/ = src/. Exemplo: import { AtomItem } from '@/types/item'

### Regra #4 — AtomItem fields
- item.completed (boolean) — NÃO item.completed_at como check booleano
- item.archived (boolean) — NÃO item.status === 'archived'

### Regra #5 — Service layer
Hooks nunca chamam Supabase direto. Sempre via service/.

### Regra #6 — Design system
- Fontes: Cormorant Garamond (serif), Inter (sans), JetBrains Mono (mono)
- Cores: bg #111318, surface #1a1d24, text #e8e0d4, accent #b8976e
- Sem emoji. Dark theme. Minimalista.

### Regra #7 — Build obrigatório
bash scripts/audit.sh — 20/20. npx tsc --noEmit e npm run build — zero erros.

### Regra #8 — Migrations Supabase
Claude Code cria o .sql. Rick aplica no Supabase Dashboard → SQL Editor.

### Regra #9 — Língua
Código e comentários em inglês. UI strings em português brasileiro.

### Regra #10 — Testes
npx vitest run — 100% passando. Atualmente 467 testes, 24 suites.
E2E com Playwright via terminal (preferível ao Claude in Chrome).

### Regra #11 — Windows/PowerShell
Rick trabalha no Windows. Comandos compatíveis com PowerShell. Git via SSH (ed25519).

## Inventário atual (alpha.25.2)

| Recurso | Contagem |
|---------|----------|
| Componentes | 51 |
| Hooks | 13 |
| Services | 13 |
| Engines | 20 |
| Stores | 11 |
| Testes | 467 |
