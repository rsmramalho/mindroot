# MindRoot — Roadmap

Data: 17/03/2026
Versão atual: v1.0.0 (alpha.25.2)
Status: v1.0.0 lançado. M1 + M2 + M3 completos. Pós-launch em andamento.

## Workflow atual
Claude Code no terminal integrado do VS Code. Sem zip, sem extração manual.
1. `claude` no terminal do VS Code (repo local aberto)
2. Colar prompt do alpha (ver PROMPT-TEMPLATE.md)
3. Claude Code lê CLAUDE.md, edita, valida (audit.sh), commita e puxa
4. Migrations SQL: Rick aplica manualmente no Supabase Dashboard

## Histórico completo de entregas

| Versão | Data | O que foi entregue |
|--------|------|--------------------|
| alpha.1 | 02/03 | Scaffold — types, engine, service, store, hooks |
| alpha.2 | 02/03 | Core Loop + Soul Layer — dashboard, inbox, emotions, check-in |
| alpha.3 | 02/03 | Ritual + Journal + 104 testes |
| alpha.4 | 03/03 | Projects, Calendar, CommandPalette + QA fixes |
| alpha.5 | 03/03 | PWA, Google Auth, Analytics, Notifications, AI parsing, brand, animações (222 testes) |
| alpha.6 | 03/03 | Production config (Vercel, auto-seed) + Playwright E2E (69 testes) |
| alpha.7 | 04/03 | Onboarding welcome flow + actionable empty states + input tooltip |
| alpha.8 | 05/03 | Edição de items — EditSheet, ModulePicker, PriorityPicker, inline edit, audit script |
| alpha.9 | 05/03 | Recurrence engine — virtual reset, RecurrencePicker, streak badges (270 testes) |
| alpha.10 | 05/03 | Feedback visual — toasts, error boundaries, loading skeletons (286 testes) |
| alpha.11 | 06/03 | Push notifications — Web Push API, VAPID, send-push edge function (309 testes) |
| alpha.12 | 06/03 | M1 estabilização — bug fixes, toast parity |
| alpha.13 | 07/03 | Offline queue — IndexedDB, sync ao reconectar, status online/offline |
| alpha.14 | 07/03 | Energy cost UI — EnergyPicker, parsing token, dashboard por energia |
| alpha.15 | 08/03 | Analytics v2 — insights emocionais, correlações emoção→produtividade |
| alpha.16 | 08/03 | Search + filtros avançados — CommandPalette com filtros, full-text |
| alpha.17 | 08/03 | QA M2 — polimento, acessibilidade, performance |
| alpha.18 | 09/03 | AI contextual — sugestões emocionais, análise de padrões |
| alpha.19 | 09/03 | Export — journal markdown, backup JSON, auto-backup semanal |
| alpha.20 | 09/03 | Temas + personalização — light/dark toggle, cores de módulo |
| alpha.21 | 09/03 | Sharing — public_shares, SharedContent page, migration 006 |
| alpha.22 | 10/03 | v1.0.0 release — QA final, acessibilidade, landing page, git tag |
| alpha.23 | 10/03 | Landing melhorada + OnboardingWizard 3 passos |
| alpha.24 | 11/03 | Bug fixes pós-launch — OAuth PKCE race, logout→landing, per-user onboarding |
| alpha.25 | 12/03 | Landing page editorial redesign |
| alpha.25.1 | 12/03 | Landing polish — hero spacing, botão #b8976e, scroll hint |
| alpha.25.2 | 12/03 | Fix border-radius botão 4px, scroll hint visível |

## Milestones

| Milestone | Alphas | Status |
|-----------|--------|--------|
| M1 — Sobrevivência | alpha.8–12 | ✅ Completo |
| M2 — Consistência | alpha.13–17 | ✅ Completo |
| M3 — Excelência | alpha.18–22 | ✅ Completo |
| v1.0.0 release | alpha.22 | ✅ No ar |
| Pós-launch polish | alpha.23–25.2 | ✅ Entregue |

## Números reais (alpha.25.2)

| Métrica | Valor |
|---------|-------|
| Componentes | 51 |
| Hooks | 13 |
| Services | 13 |
| Engines | 20 |
| Stores | 11 |
| Testes unitários | 467 |
| LOC (src) | 21.655 |
| Migrations | 6 |
| Deploy | mindroot.com.au (Vercel) |

## Issues abertas (pós alpha.25.2)
- OAuth callback instável em alguns fluxos
- OnboardingWizard não testado com contas novas em produção
- Accent #b8976e parcialmente propagado no design system

## Próximos passos candidatos

| Candidato | Escopo |
|-----------|--------|
| alpha.26 | QA completo OAuth end-to-end + OnboardingWizard com contas novas |
| alpha.27 | Propagação total do tom #b8976e no design system |
| alpha.28 | Monitoramento de erros em produção (Sentry ou similar) |
| alpha.29 | Performance audit — Lighthouse, bundle size, lazy loading |

## Decisões vigentes
1. Um alpha por sessão — contexto limpo
2. Claude Code no IDE — edição direta no repo local, sem zip
3. CLAUDE.md é a fonte de verdade — Claude Code lê antes de qualquer edição
4. audit.sh 20/20 antes de commitar
5. Named exports nas páginas, default nos componentes
6. Service layer obrigatória — hooks nunca chamam Supabase
7. UI em português brasileiro, código em inglês
8. Sem emoji — word-based, minimalista
9. Migrations SQL — aplicadas manualmente pelo Rick no Supabase Dashboard
10. SSH (ed25519) — git push configurado e funcionando
