# MindRoot — Production Setup Guide
## v1.0.0-alpha.11

Checklist completo para o MindRoot funcionar em produção.

---

## 1. Supabase — Migrations

Rodar no **SQL Editor** do Supabase Dashboard (https://supabase.com/dashboard), na ordem:

### 1.1 Core Schema (se ainda não rodou)
```
Arquivo: supabase/migrations/001_core_schema.sql
```

### 1.2 Fix Type Constraint (se ainda não rodou)
```
Arquivo: supabase/migrations/002_fix_type_constraint.sql
```

### 1.3 Auto-Seed Rituals (NOVO — alpha.6)
```
Arquivo: supabase/migrations/003_auto_seed_rituals.sql
```
Esse trigger cria automaticamente 8 rituais + 1 tarefa "Explorar o MindRoot" quando um novo usuário faz signup. Sem isso, o Dashboard fica vazio.

**Para seedar um usuário JÁ existente**, rode manualmente:
```sql
-- Substitua pelo UUID do seu user (Auth → Users → clique no user → copie o UUID)
SELECT public.seed_new_user_rituals();

-- OU insira manualmente com o seed_rituals.sql, substituindo YOUR_USER_ID
```

---

## 2. Supabase — Auth (Google OAuth)

### 2.1 Redirect URLs
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Em **Site URL**, colocar: `https://mindroot-vlhx.vercel.app`
3. Em **Redirect URLs**, adicionar:
   ```
   https://mindroot-vlhx.vercel.app/**
   http://localhost:5173/**
   ```

### 2.2 Google OAuth Provider
1. Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Ativar e preencher:
   - **Client ID**: do Google Cloud Console
   - **Client Secret**: do Google Cloud Console
3. No **Google Cloud Console** (https://console.cloud.google.com):
   - APIs & Services → Credentials → OAuth 2.0 Client
   - Authorized redirect URIs, adicionar:
     ```
     https://avvwjkzkzklloyfugzer.supabase.co/auth/v1/callback
     ```

---

## 3. Supabase — Edge Function (AI Parsing)

### 3.1 Instalar Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 3.2 Linkar ao projeto
```bash
cd mindroot
supabase link --project-ref avvwjkzkzklloyfugzer
```

### 3.3 Configurar API key
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 3.4 Deploy
```bash
supabase functions deploy parse-input
```

### 3.5 Testar
```bash
curl -X POST https://avvwjkzkzklloyfugzer.supabase.co/functions/v1/parse-input \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "meditar 10min amanha de manha"}'
```

**Nota:** Sem a Edge Function, o app funciona normalmente — o `ai-service.ts` faz fallback automático pro parsing engine local.

---

## 4. Vercel — Environment Variables

No Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value | Environments |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://avvwjkzkzklloyfugzer.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | (anon key do Supabase) | Production, Preview, Development |

**Onde achar a anon key:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

---

## 5. Vercel — Deploy

Após configurar env vars, qualquer push pro `main` faz deploy automático.

Para deploy manual:
```bash
npx vercel --prod
```

---

## 6. Verificação Final

- [ ] Migrations 001, 002, 003 rodadas no Supabase SQL Editor
- [ ] Redirect URLs configuradas no Supabase Auth
- [ ] Google OAuth provider ativado (opcional — email/password funciona sem)
- [ ] Environment variables no Vercel
- [ ] Edge Function deployada (opcional — fallback local funciona)
- [ ] Acessar https://mindroot-vlhx.vercel.app → signup → Dashboard com rituais
