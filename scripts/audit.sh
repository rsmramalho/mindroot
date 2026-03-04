#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# MindRoot — Full System Audit Script
# Run from repo root: bash scripts/audit.sh
# ═══════════════════════════════════════════════════════════

# No set -e: we handle errors ourselves

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
RESET='\033[0m'
BOLD='\033[1m'

PASS=0
FAIL=0
WARN=0

pass() { ((PASS++)); echo -e "  ${GREEN}✓${RESET} $1"; }
fail() { ((FAIL++)); echo -e "  ${RED}✗${RESET} $1"; }
warn() { ((WARN++)); echo -e "  ${YELLOW}!${RESET} $1"; }
section() { echo -e "\n${CYAN}━━━ $1 ━━━${RESET}"; }

# ═══════════════════════════════════════════════════════════
section "1. BUILD PIPELINE"
# ═══════════════════════════════════════════════════════════

echo -e "${DIM}  Running tsc --noEmit...${RESET}"
TSC_OUT=$(npx tsc --noEmit 2>&1) && TSC_OK=1 || TSC_OK=0
if [ "$TSC_OK" -eq 1 ]; then
  pass "TypeScript: zero errors"
else
  fail "TypeScript: has errors"
  echo "$TSC_OUT" | head -10
fi

echo -e "${DIM}  Running vite build...${RESET}"
BUILD_OUT=$(npm run build 2>&1) && BUILD_OK=1 || BUILD_OK=0
if [ "$BUILD_OK" -eq 1 ]; then
  pass "Vite build: success"
  echo "$BUILD_OUT" | grep "dist/" | while read -r line; do
    echo -e "    ${DIM}$line${RESET}"
  done
else
  fail "Vite build: failed"
  echo "$BUILD_OUT" | tail -10
fi

# Main bundle size check
MAIN_SIZE=$(echo "$BUILD_OUT" | grep "index-.*\.js" | grep -v vendor | head -1 | awk '{print $2}' | sed 's/[^0-9.]//g' 2>/dev/null || echo "")
if [ -n "$MAIN_SIZE" ]; then
  MAIN_INT=${MAIN_SIZE%%.*}
  if [ "${MAIN_INT:-0}" -gt 500 ]; then
    warn "Main bundle > 500KB (${MAIN_SIZE}KB) — consider code splitting"
  else
    pass "Main bundle size: ${MAIN_SIZE}KB"
  fi
fi

# ═══════════════════════════════════════════════════════════
section "2. UNIT TESTS"
# ═══════════════════════════════════════════════════════════

echo -e "${DIM}  Running vitest...${RESET}"
TEST_OUT=$(npx vitest run 2>&1) && TEST_OK=1 || TEST_OK=0
if [ "$TEST_OK" -eq 1 ]; then
  TESTS_LINE=$(echo "$TEST_OUT" | grep "Tests" | tail -1)
  SUITES_LINE=$(echo "$TEST_OUT" | grep "Test Files" | tail -1)
  pass "Unit tests: $TESTS_LINE"
  echo -e "    ${DIM}$SUITES_LINE${RESET}"
else
  fail "Unit tests: some failed"
  echo "$TEST_OUT" | grep -E "FAIL|✗|Error" | head -10
fi

# ═══════════════════════════════════════════════════════════
section "3. ARCHITECTURE COMPLIANCE"
# ═══════════════════════════════════════════════════════════

# 3a. Service layer — hooks must NOT import supabase directly
echo -e "${DIM}  Checking service layer compliance...${RESET}"
HOOKS_SUPABASE=$(grep -rl "from.*service/supabase" src/hooks/ 2>/dev/null || true)
if [ -z "$HOOKS_SUPABASE" ]; then
  pass "Hooks never import supabase directly"
else
  fail "Hooks importing supabase directly:"
  echo "$HOOKS_SUPABASE" | while read -r f; do echo "    $f"; done
fi

# 3b. Named exports on pages
echo -e "${DIM}  Checking named exports on pages...${RESET}"
PAGE_DEFAULTS=$(grep -l "export default" src/pages/*.tsx 2>/dev/null || true)
if [ -z "$PAGE_DEFAULTS" ]; then
  pass "All pages use named exports"
else
  fail "Pages with default export (should be named):"
  echo "$PAGE_DEFAULTS" | while read -r f; do echo "    $f"; done
fi

# 3c. All pages must have named export function
PAGES_MISSING=0
for page in src/pages/*.tsx; do
  if ! grep -q "export function" "$page"; then
    fail "$page: missing named export function"
    ((PAGES_MISSING++)) || true
  fi
done
if [ "$PAGES_MISSING" -eq 0 ]; then
  pass "All pages have export function"
fi

# 3d. Path alias — no relative imports crossing src/ boundary
echo -e "${DIM}  Checking path alias usage...${RESET}"
BAD_IMPORTS=$(grep -rn "from '\.\./\.\." src/pages/ src/components/ src/hooks/ 2>/dev/null | grep -v node_modules || true)
if [ -z "$BAD_IMPORTS" ]; then
  pass "No deep relative imports (all use @/)"
else
  warn "Deep relative imports found (should use @/):"
  echo "$BAD_IMPORTS" | head -5 | while read -r line; do echo "    $line"; done
fi

# 3e. AtomItem: never use completed_at as boolean check
echo -e "${DIM}  Checking AtomItem field usage...${RESET}"
BAD_COMPLETED=$(grep -rn "item\.completed_at\b" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "types/item.ts" | grep -v "service/item-service.ts" | grep -v "hooks/useItemMutations.ts" | grep -v "\.test\." | grep -v "completed_at:" | grep -v "completed_at =" | grep -v "completed_at?" | grep -v "completed_at\b.*null" || true)
# Filter: allow "completed_at && parseISO/isSameDay" (timestamp check before date parsing)
# Flag only: "if (item.completed_at)" as sole boolean, or "!item.completed_at" as status check
BAD_COMPLETED_BOOL=$(echo "$BAD_COMPLETED" | grep -E "if\s*\(\s*item\.completed_at\s*\)|!item\.completed_at\s*[&)|]" | grep -v "parseISO\|isSameDay\|format\|new Date" || true)
if [ -z "$BAD_COMPLETED_BOOL" ]; then
  pass "No boolean checks on completed_at"
else
  fail "completed_at used as boolean:"
  echo "$BAD_COMPLETED_BOOL" | while read -r line; do echo "    $line"; done
fi

BAD_STATUS=$(grep -rn "item\.status\b\|\.status ==\|\.status !=\|\.status ===" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules || true)
if [ -z "$BAD_STATUS" ]; then
  pass "No item.status usage (use item.completed/item.archived)"
else
  fail "item.status references found:"
  echo "$BAD_STATUS" | head -5 | while read -r line; do echo "    $line"; done
fi

# ═══════════════════════════════════════════════════════════
section "4. DESIGN SYSTEM COMPLIANCE"
# ═══════════════════════════════════════════════════════════

# 4a. No emoji in components (excluding test files)
echo -e "${DIM}  Checking for emoji in components...${RESET}"
# Check for common emoji patterns in TSX files (excluding tests and specific allowed chars like ✓ ✎ × ◆ ◇)
EMOJI_HITS=$(grep -Prn '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]' src/components/ src/pages/ 2>/dev/null | grep -v "\.test\." || true)
if [ -z "$EMOJI_HITS" ]; then
  pass "No emoji in components (word-based UI)"
else
  warn "Possible emoji in components:"
  echo "$EMOJI_HITS" | head -5 | while read -r line; do echo "    $line"; done
fi

# 4b. Font usage — must use the 3 system fonts
echo -e "${DIM}  Checking font family usage...${RESET}"
WRONG_FONTS=$(grep -rn "font-family:" src/components/ src/pages/ 2>/dev/null | grep -v "Cormorant\|Inter\|JetBrains\|sans-serif\|serif\|monospace\|font-family: var" || true)
if [ -z "$WRONG_FONTS" ]; then
  pass "All inline fonts use Cormorant/Inter/JetBrains Mono"
else
  warn "Non-standard font-family found:"
  echo "$WRONG_FONTS" | head -5 | while read -r line; do echo "    $line"; done
fi

# 4c. No hardcoded light theme colors
echo -e "${DIM}  Checking theme colors...${RESET}"
WHITE_BG=$(grep -rn "backgroundColor.*['\"]#fff\|backgroundColor.*['\"]white\|background:.*#fff\|background:.*white" src/components/ src/pages/ 2>/dev/null || true)
if [ -z "$WHITE_BG" ]; then
  pass "No white/light backgrounds (dark theme)"
else
  fail "Light backgrounds found (should be dark theme):"
  echo "$WHITE_BG" | head -5 | while read -r line; do echo "    $line"; done
fi

# ═══════════════════════════════════════════════════════════
section "5. CODE QUALITY"
# ═══════════════════════════════════════════════════════════

# 5a. Console.log left in production code
echo -e "${DIM}  Checking for console.log...${RESET}"
CONSOLE_LOGS=$(grep -rn "console\.log\|console\.warn\|console\.error" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "\.test\.\|\.spec\.\|service/notification-service" || true)
if [ -z "$CONSOLE_LOGS" ]; then
  pass "No console.log in production code"
else
  warn "console.log found in production code:"
  echo "$CONSOLE_LOGS" | while read -r line; do echo "    $line"; done
fi

# 5b. TODO/FIXME/HACK comments
echo -e "${DIM}  Checking for TODO/FIXME...${RESET}"
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules || true)
if [ -z "$TODOS" ]; then
  pass "No TODO/FIXME/HACK comments"
else
  TODO_COUNT=$(echo "$TODOS" | wc -l)
  warn "$TODO_COUNT TODO/FIXME/HACK comments found:"
  echo "$TODOS" | while read -r line; do echo "    $line"; done
fi

# 5c. Unused imports — quick heuristic via tsc strict mode
echo -e "${DIM}  Checking for unused imports (heuristic)...${RESET}"
# We already ran tsc with noUnusedLocals=false; a strict check would catch them
# For now, just check if any file has more than 10 imports (smell)
HEAVY_IMPORTS=$(find src/components src/pages src/hooks -name "*.tsx" -o -name "*.ts" | xargs grep -c "^import" 2>/dev/null | awk -F: '$2 > 10 {print}' || true)
if [ -z "$HEAVY_IMPORTS" ]; then
  pass "No files with excessive imports (>10)"
else
  warn "Files with many imports (>10, check for unused):"
  echo "$HEAVY_IMPORTS" | while read -r line; do echo "    $line"; done
fi

# ═══════════════════════════════════════════════════════════
section "6. COMPONENT INVENTORY"
# ═══════════════════════════════════════════════════════════

PAGES=$(find src/pages -name "*.tsx" ! -name "*.test.*" | wc -l)
COMPONENTS=$(find src/components -name "*.tsx" ! -name "*.test.*" | wc -l)
HOOKS=$(find src/hooks -name "*.ts" ! -name "*.test.*" | wc -l)
SERVICES=$(find src/service -name "*.ts" ! -name "*.test.*" ! -name "supabase.ts" | wc -l)
ENGINES=$(find src/engine -name "*.ts" ! -name "*.test.*" | wc -l)
STORES=$(find src/store -name "*.ts" ! -name "*.test.*" | wc -l)
TYPES=$(find src/types -name "*.ts" ! -name "*.test.*" | wc -l)
UNIT_TESTS=$(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
E2E_TESTS=$(find e2e -name "*.spec.ts" 2>/dev/null | wc -l)
TOTAL_LOC=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
E2E_LOC=$(find e2e -name "*.ts" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

echo -e "  ${BOLD}Pages:${RESET}        $PAGES"
echo -e "  ${BOLD}Components:${RESET}   $COMPONENTS"
echo -e "  ${BOLD}Hooks:${RESET}        $HOOKS"
echo -e "  ${BOLD}Services:${RESET}     $SERVICES"
echo -e "  ${BOLD}Engines:${RESET}      $ENGINES"
echo -e "  ${BOLD}Stores:${RESET}       $STORES"
echo -e "  ${BOLD}Types:${RESET}        $TYPES"
echo -e "  ${BOLD}Unit tests:${RESET}   $UNIT_TESTS suites"
echo -e "  ${BOLD}E2E specs:${RESET}    $E2E_TESTS specs"
echo -e "  ${BOLD}Src LOC:${RESET}      $TOTAL_LOC"
echo -e "  ${BOLD}E2E LOC:${RESET}      $E2E_LOC"

# ═══════════════════════════════════════════════════════════
section "7. LANGUAGE COMPLIANCE"
# ═══════════════════════════════════════════════════════════

# UI strings should be in Portuguese, code in English
echo -e "${DIM}  Checking for English UI strings in components...${RESET}"
# Common English UI words that should be Portuguese
EN_UI=$(grep -rn "\"Cancel\"\|\"Save\"\|\"Delete\"\|\"Submit\"\|\"Loading\"\|\"Error\"\|\"Success\"\|'Cancel'\|'Save'\|'Delete'" src/components/ src/pages/ 2>/dev/null | grep -v "\.test\." || true)
if [ -z "$EN_UI" ]; then
  pass "No English UI strings detected"
else
  warn "Possible English UI strings (should be PT-BR):"
  echo "$EN_UI" | head -5 | while read -r line; do echo "    $line"; done
fi

# ═══════════════════════════════════════════════════════════
section "8. FILE STRUCTURE"
# ═══════════════════════════════════════════════════════════

# Check all pages are registered in App.tsx
echo -e "${DIM}  Checking page registration in App.tsx...${RESET}"
ORPHAN_PAGES=0
for page in src/pages/*.tsx; do
  BASENAME=$(basename "$page" .tsx)
  if [ "$BASENAME" = "Auth" ]; then continue; fi
  if ! grep -q "${BASENAME}Page\|${BASENAME}" src/App.tsx 2>/dev/null; then
    fail "Page not registered in App.tsx: $BASENAME"
    ((ORPHAN_PAGES++)) || true
  fi
done
if [ "$ORPHAN_PAGES" -eq 0 ]; then
  pass "All pages registered in App.tsx"
fi

# Check for orphan components (defined but never imported)
echo -e "${DIM}  Checking for orphan components...${RESET}"
ORPHAN_COMPONENTS=0
while IFS= read -r comp; do
  BASENAME=$(basename "$comp" .tsx)
  IMPORT_COUNT=$(grep -rl "$BASENAME" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "$comp" | grep -v "\.test\." | wc -l)
  if [ "$IMPORT_COUNT" -eq 0 ]; then
    warn "Possibly orphan component: $comp"
    ((ORPHAN_COMPONENTS++)) || true
  fi
done < <(find src/components -name "*.tsx" ! -name "*.test.*")
if [ "$ORPHAN_COMPONENTS" -eq 0 ]; then
  pass "No orphan components detected"
fi

# ═══════════════════════════════════════════════════════════
section "9. DEPENDENCY HEALTH"
# ═══════════════════════════════════════════════════════════

echo -e "${DIM}  Checking for outdated dependencies...${RESET}"
OUTDATED_COUNT=$(npm outdated 2>/dev/null | tail -n +2 | wc -l || echo "0")
if [ "$OUTDATED_COUNT" = "0" ]; then
  pass "All dependencies up to date"
else
  warn "$OUTDATED_COUNT outdated packages"
  npm outdated 2>/dev/null | head -10 | while read -r line; do echo -e "    ${DIM}$line${RESET}"; done
fi

# Check for security vulnerabilities
echo -e "${DIM}  Running npm audit...${RESET}"
AUDIT_OUT=$(npm audit 2>&1) && AUDIT_OK=1 || AUDIT_OK=0
if [ "$AUDIT_OK" -eq 1 ]; then
  pass "No known vulnerabilities"
else
  VULN_SUMMARY=$(echo "$AUDIT_OUT" | grep -E "vulnerabilities|found" | tail -1)
  warn "Vulnerabilities: $VULN_SUMMARY"
fi

# ═══════════════════════════════════════════════════════════
section "SUMMARY"
# ═══════════════════════════════════════════════════════════

echo ""
echo -e "  ${GREEN}Passed:${RESET}   $PASS"
echo -e "  ${YELLOW}Warnings:${RESET} $WARN"
echo -e "  ${RED}Failed:${RESET}   $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}AUDIT FAILED${RESET} — $FAIL issue(s) must be fixed"
  exit 1
else
  if [ "$WARN" -gt 0 ]; then
    echo -e "  ${YELLOW}${BOLD}AUDIT PASSED WITH WARNINGS${RESET} — $WARN item(s) to review"
  else
    echo -e "  ${GREEN}${BOLD}AUDIT PASSED${RESET} — all checks clean"
  fi
  exit 0
fi
