#!/bin/bash

# ============================================
# SCRIPT DE VERIFICACIÓN FASE 5.5
# ============================================

echo "🧪 Iniciando verificación de FASE 5.5..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# ============================================
# 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
# ============================================
echo "📂 1. Verificando estructura de archivos..."

FILES=(
  "apps/web/src/components/ToastProvider.tsx"
  "apps/web/src/components/ConfirmModal.tsx"
  "apps/web/src/hooks/useConfirm.ts"
  "apps/web/src/app/forgot-password/page.tsx"
  "apps/web/src/app/reset-password/page.tsx"
  "apps/web/src/app/api/auth/forgot-password/route.ts"
  "apps/web/src/app/api/auth/reset-password/route.ts"
  "apps/web/src/app/dashboard/settings/page.tsx"
  "apps/web/src/app/api/user/change-password/route.ts"
  "apps/web/src/app/dashboard/tenants/page.tsx"
  "apps/web/src/app/dashboard/tenants/[id]/edit/page.tsx"
  "apps/web/src/app/api/tenants/[id]/route.ts"
  "packages/db/prisma/migrations/20251218155312_add_password_reset_tokens/migration.sql"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - NO ENCONTRADO"
    ((ERRORS++))
  fi
done

echo ""

# ============================================
# 2. REGENERAR CLIENTE PRISMA
# ============================================
echo "🔄 2. Regenerando cliente Prisma..."

cd packages/db

if npx prisma generate; then
  echo -e "  ${GREEN}✅ Cliente Prisma regenerado correctamente${NC}"
else
  echo -e "  ${RED}❌ Error al regenerar cliente Prisma${NC}"
  ((ERRORS++))
fi

cd ../..
echo ""

# ============================================
# 3. VERIFICAR SCHEMA PRISMA
# ============================================
echo "🗄️ 3. Verificando modelo PasswordResetToken en schema..."

if grep -q "model PasswordResetToken" packages/db/prisma/schema.prisma; then
  echo -e "  ${GREEN}✅ Modelo PasswordResetToken encontrado${NC}"
else
  echo -e "  ${RED}❌ Modelo PasswordResetToken NO encontrado${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 4. VERIFICAR IMPORTS DE TOASTS
# ============================================
echo "🍞 4. Verificando imports de useToast..."

TOAST_FILES=(
  "apps/web/src/app/forgot-password/page.tsx"
  "apps/web/src/app/reset-password/page.tsx"
  "apps/web/src/app/dashboard/settings/page.tsx"
  "apps/web/src/app/advisor/request-access/page.tsx"
  "apps/web/src/components/admin/AccessRequestButtons.tsx"
  "apps/web/src/components/admin/VerifyAdvisorButton.tsx"
  "apps/web/src/components/admin/AdvisorActionButtons.tsx"
)

for file in "${TOAST_FILES[@]}"; do
  if grep -q "import { useToast }" "$file"; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - NO tiene import de useToast"
    ((ERRORS++))
  fi
done

echo ""

# ============================================
# 5. VERIFICAR IMPORTS DE MODALES
# ============================================
echo "💬 5. Verificando imports de useConfirm..."

MODAL_FILES=(
  "apps/web/src/components/admin/AccessRequestButtons.tsx"
  "apps/web/src/components/admin/VerifyAdvisorButton.tsx"
  "apps/web/src/components/admin/AdvisorActionButtons.tsx"
)

for file in "${MODAL_FILES[@]}"; do
  if grep -q "import { useConfirm }" "$file"; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - NO tiene import de useConfirm"
    ((ERRORS++))
  fi
done

echo ""

# ============================================
# 6. VERIFICAR COMPONENTES <ConfirmModal />
# ============================================
echo "🎭 6. Verificando renderizado de <ConfirmModal />..."

for file in "${MODAL_FILES[@]}"; do
  if grep -q "<ConfirmModal />" "$file"; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - NO renderiza <ConfirmModal />"
    ((ERRORS++))
  fi
done

echo ""

# ============================================
# 7. VERIFICAR TOASTPROVIDER EN LAYOUT
# ============================================
echo "📦 7. Verificando ToastProvider en layout.tsx..."

if grep -q "<ToastProvider>" apps/web/src/app/layout.tsx; then
  echo -e "  ${GREEN}✅ ToastProvider integrado en layout.tsx${NC}"
else
  echo -e "  ${RED}❌ ToastProvider NO encontrado en layout.tsx${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 8. VERIFICAR LINK EN LOGIN
# ============================================
echo "🔗 8. Verificando link 'Olvidaste tu contraseña' en login..."

if grep -q "forgot-password" apps/web/src/app/login/page.tsx; then
  echo -e "  ${GREEN}✅ Link a forgot-password encontrado${NC}"
else
  echo -e "  ${RED}❌ Link a forgot-password NO encontrado${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 9. INSTALAR DEPENDENCIAS (SI ES NECESARIO)
# ============================================
echo "📦 9. Verificando dependencias..."

cd apps/web

if [ ! -d "node_modules" ]; then
  echo -e "  ${YELLOW}⚠️  Instalando dependencias...${NC}"
  npm install
else
  echo "  ✅ node_modules existe"
fi

cd ../..
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo "=========================================="
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}"
  echo "✅ TODAS LAS VERIFICACIONES PASARON"
  echo "✅ FASE 5.5 está completa y lista"
  echo -e "${NC}"
  echo ""
  echo "🚀 Próximos pasos:"
  echo "   1. Reiniciar servidor TypeScript en VS Code"
  echo "      (Ctrl/Cmd + Shift + P → 'TypeScript: Restart TS Server')"
  echo "   2. Iniciar servidor de desarrollo:"
  echo "      cd apps/web && npm run dev"
  echo "   3. Realizar pruebas manuales según RESULTADOS_PRUEBAS_FASE5.5.md"
  echo ""
else
  echo -e "${RED}"
  echo "❌ SE ENCONTRARON $ERRORS ERROR(ES)"
  echo "❌ Revisa los errores anteriores"
  echo -e "${NC}"
  exit 1
fi

echo "=========================================="
echo "✅ Script completado"
echo "=========================================="
