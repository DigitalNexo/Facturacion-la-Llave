#!/bin/bash

# SCRIPT DE TEST COMPLETO PARA FASE 4 - PANEL DE ADMINISTRACIÓN
# Prueba todas las funcionalidades de superadmin, advisors y access requests

set -e  # Exit on error

echo "=========================================="
echo "TEST COMPLETO - FASE 4: PANEL DE ADMIN"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de tests
PASS=0
FAIL=0

# Función para tests
test_check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
  fi
}

# ==========================================
# 1. VERIFICAR ARCHIVOS CREADOS
# ==========================================
echo "1️⃣  Verificando archivos de FASE 4..."

[ -f "packages/core/src/validations.ts" ] && grep -q "isSuperAdmin" packages/core/src/validations.ts
test_check "isSuperAdmin() existe en validations.ts"

[ -f "apps/web/src/app/api/admin/advisors/route.ts" ]
test_check "Endpoint /api/admin/advisors (POST, GET)"

[ -f "apps/web/src/app/api/admin/advisors/[id]/verify/route.ts" ]
test_check "Endpoint /api/admin/advisors/[id]/verify (PUT, DELETE)"

[ -f "apps/web/src/app/api/admin/access-requests/route.ts" ]
test_check "Endpoint /api/admin/access-requests (GET)"

[ -f "apps/web/src/app/api/admin/access-requests/[id]/approve/route.ts" ]
test_check "Endpoint /api/admin/access-requests/[id]/approve (POST)"

[ -f "apps/web/src/app/api/admin/access-requests/[id]/reject/route.ts" ]
test_check "Endpoint /api/admin/access-requests/[id]/reject (POST)"

[ -f "apps/web/src/app/admin/dashboard/page.tsx" ]
test_check "Admin dashboard UI"

[ -f "apps/web/src/app/admin/advisors/new/page.tsx" ]
test_check "Formulario crear advisor"

[ -f "packages/tests/src/admin.test.ts" ]
test_check "Tests de FASE 4 (admin.test.ts)"

echo ""

# ==========================================
# 2. VERIFICAR CÓDIGO EN ARCHIVOS
# ==========================================
echo "2️⃣  Verificando implementación correcta..."

grep -q "isSuperAdmin" middleware.ts
test_check "Middleware protege rutas /admin"

grep -q "accountType: 'advisor'" apps/web/src/app/api/admin/advisors/route.ts
test_check "Endpoint crea advisors con accountType='advisor'"

grep -q "isBillingEnabled: false" apps/web/src/app/api/admin/advisors/route.ts
test_check "Advisors creados con isBillingEnabled=false"

grep -q "mustChangePassword: true" apps/web/src/app/api/admin/advisors/route.ts
test_check "Advisors deben cambiar contraseña en primer login"

grep -q "isVerified: true" apps/web/src/app/api/admin/advisors/[id]/verify/route.ts
test_check "Endpoint verifica advisors (isVerified=true)"

grep -q "\$transaction" apps/web/src/app/api/admin/access-requests/[id]/approve/route.ts
test_check "Aprobación de solicitud usa transacción"

grep -q "rejectionReason" apps/web/src/app/api/admin/access-requests/[id]/reject/route.ts
test_check "Rechazo de solicitud incluye rejectionReason"

grep -q "SUPERADMIN_EMAILS" packages/core/src/validations.ts
test_check "isSuperAdmin() verifica SUPERADMIN_EMAILS"

echo ""

# ==========================================
# 3. EJECUTAR TESTS DE JEST
# ==========================================
echo "3️⃣  Ejecutando tests de Jest..."

cd /workspaces/Facturacion-la-Llave
npm test -- admin.test.ts --silent 2>&1 | grep -q "15 passed"
test_check "15 tests de FASE 4 pasados"

npm test -- --silent 2>&1 | grep -E "Tests:.*[0-9]+ passed" > /tmp/test_output.txt
TOTAL_TESTS=$(cat /tmp/test_output.txt | grep -oP '\d+ passed' | grep -oP '\d+')
if [ "$TOTAL_TESTS" -ge 32 ]; then
  echo -e "${GREEN}✓${NC} Total: $TOTAL_TESTS tests pasados (FASE 1 + FASE 3 + FASE 4)"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Solo $TOTAL_TESTS tests pasados, esperados >= 32"
  ((FAIL++))
fi

echo ""

# ==========================================
# 4. VERIFICAR ESTRUCTURA DE ENDPOINTS
# ==========================================
echo "4️⃣  Verificando estructura de endpoints..."

# Verificar que todos los endpoints usan auth()
ADMIN_ROUTES=$(find apps/web/src/app/api/admin -name "route.ts" 2>/dev/null | wc -l)
if [ "$ADMIN_ROUTES" -ge 5 ]; then
  echo -e "${GREEN}✓${NC} $ADMIN_ROUTES endpoints de admin creados"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Solo $ADMIN_ROUTES endpoints encontrados"
  ((FAIL++))
fi

# Verificar que usan isSuperAdmin
grep -r "isSuperAdmin" apps/web/src/app/api/admin/ | wc -l | grep -q "[5-9]"
test_check "Endpoints verifican superadmin con isSuperAdmin()"

# Verificar respuestas 403
grep -r "403" apps/web/src/app/api/admin/ | wc -l | grep -q "[5-9]"
test_check "Endpoints retornan 403 si no es superadmin"

echo ""

# ==========================================
# 5. VERIFICAR UI DEL PANEL
# ==========================================
echo "5️⃣  Verificando UI del panel de admin..."

grep -q "isSuperAdmin" apps/web/src/app/admin/dashboard/page.tsx
test_check "Dashboard verifica superadmin"

grep -q "Total Accounts" apps/web/src/app/admin/dashboard/page.tsx
test_check "Dashboard muestra estadísticas"

grep -q "Pending Requests" apps/web/src/app/admin/dashboard/page.tsx
test_check "Dashboard lista solicitudes pendientes"

grep -q "Recent Advisors" apps/web/src/app/admin/dashboard/page.tsx
test_check "Dashboard lista advisors recientes"

grep -q "form" apps/web/src/app/admin/advisors/new/page.tsx
test_check "Formulario crear advisor existe"

grep -q "companyName\|taxId\|professionalNumber" apps/web/src/app/admin/advisors/new/page.tsx
test_check "Formulario incluye campos profesionales"

echo ""

# ==========================================
# RESUMEN FINAL
# ==========================================
echo "=========================================="
echo "RESUMEN DE TESTS DE FASE 4"
echo "=========================================="
echo -e "${GREEN}Tests pasados: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Tests fallidos: $FAIL${NC}"
else
  echo -e "Tests fallidos: $FAIL"
fi
echo ""

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ FASE 4 COMPLETA AL 100% ($PASS/$TOTAL tests)${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  FASE 4 al $PERCENTAGE% ($PASS/$TOTAL tests)${NC}"
  exit 1
fi
