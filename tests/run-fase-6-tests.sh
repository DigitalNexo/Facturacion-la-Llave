#!/bin/bash

# ========================================
# PRUEBAS EXHAUSTIVAS FASE 6 - FACTURACIÓN
# ========================================
# Este script ejecuta pruebas completas del sistema de facturación
# 
# Uso: chmod +x tests/run-fase-6-tests.sh && ./tests/run-fase-6-tests.sh

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     PRUEBAS EXHAUSTIVAS FASE 6 - SISTEMA DE FACTURACIÓN      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

# Función para verificar resultado
check_result() {
    local test_name="$1"
    local condition="$2"
    TOTAL=$((TOTAL + 1))
    
    if [ "$condition" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} $test_name"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}✗${NC} $test_name"
        FAILED=$((FAILED + 1))
    fi
}

# ============================================
# 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
# ============================================
echo -e "\n${BLUE}═══ 1. ESTRUCTURA DE ARCHIVOS ═══${NC}"

# APIs de Series
check_result "API: tenants/[id]/series/route.ts existe" \
    "$([ -f apps/web/src/app/api/tenants/\[id\]/series/route.ts ] && echo true || echo false)"
check_result "API: series/[id]/route.ts existe" \
    "$([ -f apps/web/src/app/api/series/\[id\]/route.ts ] && echo true || echo false)"

# APIs de Facturas
check_result "API: tenants/[id]/invoices/route.ts existe" \
    "$([ -f apps/web/src/app/api/tenants/\[id\]/invoices/route.ts ] && echo true || echo false)"
check_result "API: invoices/[id]/route.ts existe" \
    "$([ -f apps/web/src/app/api/invoices/\[id\]/route.ts ] && echo true || echo false)"
check_result "API: invoices/[id]/issue/route.ts existe" \
    "$([ -f apps/web/src/app/api/invoices/\[id\]/issue/route.ts ] && echo true || echo false)"
check_result "API: invoices/[id]/pdf/route.ts existe" \
    "$([ -f apps/web/src/app/api/invoices/\[id\]/pdf/route.ts ] && echo true || echo false)"

# Páginas de UI
check_result "UI: tenants/[id]/series/page.tsx existe" \
    "$([ -f apps/web/src/app/dashboard/tenants/\[id\]/series/page.tsx ] && echo true || echo false)"
check_result "UI: tenants/[id]/invoices/page.tsx existe" \
    "$([ -f apps/web/src/app/dashboard/tenants/\[id\]/invoices/page.tsx ] && echo true || echo false)"
check_result "UI: tenants/[id]/invoices/new/page.tsx existe" \
    "$([ -f apps/web/src/app/dashboard/tenants/\[id\]/invoices/new/page.tsx ] && echo true || echo false)"
check_result "UI: tenants/[id]/invoices/[invoiceId]/edit/page.tsx existe" \
    "$([ -f apps/web/src/app/dashboard/tenants/\[id\]/invoices/\[invoiceId\]/edit/page.tsx ] && echo true || echo false)"

# ============================================
# 2. VERIFICAR ESQUEMA DE BD
# ============================================
echo -e "\n${BLUE}═══ 2. ESQUEMA DE BASE DE DATOS ═══${NC}"

SCHEMA_FILE="packages/db/prisma/schema.prisma"

check_result "Model InvoiceSeries definido" \
    "$(grep -q 'model InvoiceSeries' $SCHEMA_FILE && echo true || echo false)"
check_result "Model Invoice definido" \
    "$(grep -q 'model Invoice' $SCHEMA_FILE && echo true || echo false)"
check_result "Model InvoiceLine definido" \
    "$(grep -q 'model InvoiceLine' $SCHEMA_FILE && echo true || echo false)"
check_result "Enum InvoiceStatus definido" \
    "$(grep -q 'enum InvoiceStatus' $SCHEMA_FILE && echo true || echo false)"
check_result "Enum InvoiceType definido" \
    "$(grep -q 'enum InvoiceType' $SCHEMA_FILE && echo true || echo false)"

# Campos críticos
check_result "Invoice tiene campo status" \
    "$(grep -A 50 'model Invoice' $SCHEMA_FILE | grep -q 'status.*InvoiceStatus' && echo true || echo false)"
check_result "Invoice tiene campo lockedAt" \
    "$(grep -A 50 'model Invoice' $SCHEMA_FILE | grep -q 'lockedAt' && echo true || echo false)"
check_result "Invoice tiene campo fullNumber" \
    "$(grep -A 50 'model Invoice' $SCHEMA_FILE | grep -q 'fullNumber' && echo true || echo false)"
check_result "InvoiceSeries tiene campo currentNumber" \
    "$(grep -A 30 'model InvoiceSeries' $SCHEMA_FILE | grep -q 'currentNumber' && echo true || echo false)"

# ============================================
# 3. VERIFICAR TYPESCRIPT
# ============================================
echo -e "\n${BLUE}═══ 3. VERIFICACIÓN TYPESCRIPT ═══${NC}"

echo -e "  ${YELLOW}⏳${NC} Ejecutando verificación de tipos..."
cd /workspaces/Facturacion-la-Llave

# Verificar compilación de TypeScript
if npx tsc --noEmit --project apps/web/tsconfig.json 2>/dev/null; then
    check_result "TypeScript compila sin errores" "true"
else
    # Capturar errores específicos
    TS_ERRORS=$(npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -20)
    check_result "TypeScript compila sin errores" "false"
    echo -e "    ${RED}Errores encontrados:${NC}"
    echo "$TS_ERRORS" | head -10 | sed 's/^/    /'
fi

# ============================================
# 4. VERIFICAR CÓDIGO DE APIs
# ============================================
echo -e "\n${BLUE}═══ 4. VERIFICACIÓN DE APIs ═══${NC}"

# Series API
SERIES_API="apps/web/src/app/api/tenants/\[id\]/series/route.ts"
check_result "Series API: GET handler" \
    "$(grep -q 'export async function GET' $SERIES_API && echo true || echo false)"
check_result "Series API: POST handler" \
    "$(grep -q 'export async function POST' $SERIES_API && echo true || echo false)"
check_result "Series API: usa auth()" \
    "$(grep -q 'await auth()' $SERIES_API && echo true || echo false)"
check_result "Series API: valida acceso a tenant" \
    "$(grep -q 'tenantAccesses' $SERIES_API && echo true || echo false)"

# Invoices API
INVOICES_API="apps/web/src/app/api/tenants/\[id\]/invoices/route.ts"
check_result "Invoices API: GET handler" \
    "$(grep -q 'export async function GET' $INVOICES_API && echo true || echo false)"
check_result "Invoices API: POST handler" \
    "$(grep -q 'export async function POST' $INVOICES_API && echo true || echo false)"
check_result "Invoices API: usa Zod para validación" \
    "$(grep -q "import { z } from 'zod'" $INVOICES_API && echo true || echo false)"

# Issue API
ISSUE_API="apps/web/src/app/api/invoices/\[id\]/issue/route.ts"
check_result "Issue API: POST handler" \
    "$(grep -q 'export async function POST' $ISSUE_API && echo true || echo false)"
check_result "Issue API: usa transacción" \
    "$(grep -q '\$transaction' $ISSUE_API && echo true || echo false)"
check_result "Issue API: incrementa currentNumber" \
    "$(grep -q 'currentNumber.*increment' $ISSUE_API && echo true || echo false)"
check_result "Issue API: establece lockedAt" \
    "$(grep -q 'lockedAt' $ISSUE_API && echo true || echo false)"

# PDF API
PDF_API="apps/web/src/app/api/invoices/\[id\]/pdf/route.ts"
check_result "PDF API: GET handler" \
    "$(grep -q 'export async function GET' $PDF_API && echo true || echo false)"
check_result "PDF API: usa jsPDF" \
    "$(grep -q 'jsPDF' $PDF_API && echo true || echo false)"
check_result "PDF API: solo facturas emitidas" \
    "$(grep -q 'issued' $PDF_API && echo true || echo false)"

# ============================================
# 5. VERIFICAR CÓDIGO DE UI
# ============================================
echo -e "\n${BLUE}═══ 5. VERIFICACIÓN DE UI ═══${NC}"

# Series page
SERIES_PAGE="apps/web/src/app/dashboard/tenants/\[id\]/series/page.tsx"
check_result "Series UI: usa 'use client'" \
    "$(head -1 $SERIES_PAGE | grep -q "'use client'" && echo true || echo false)"
check_result "Series UI: useToast importado" \
    "$(grep -q 'useToast' $SERIES_PAGE && echo true || echo false)"
check_result "Series UI: form de crear serie" \
    "$(grep -q 'handleCreateSeries' $SERIES_PAGE && echo true || echo false)"

# Invoices page
INVOICES_PAGE="apps/web/src/app/dashboard/tenants/\[id\]/invoices/page.tsx"
check_result "Invoices UI: usa 'use client'" \
    "$(head -1 $INVOICES_PAGE | grep -q "'use client'" && echo true || echo false)"
check_result "Invoices UI: filtro por estado" \
    "$(grep -q 'statusFilter\|status' $INVOICES_PAGE && echo true || echo false)"
check_result "Invoices UI: botón emitir" \
    "$(grep -q 'Emitir\|issue' $INVOICES_PAGE && echo true || echo false)"
check_result "Invoices UI: botón PDF" \
    "$(grep -q 'PDF\|pdf' $INVOICES_PAGE && echo true || echo false)"

# New invoice page
NEW_PAGE="apps/web/src/app/dashboard/tenants/\[id\]/invoices/new/page.tsx"
check_result "New Invoice UI: formulario de líneas" \
    "$(grep -q 'InvoiceLine\|lines' $NEW_PAGE && echo true || echo false)"
check_result "New Invoice UI: cálculo de totales" \
    "$(grep -q 'calculateTotals\|total' $NEW_PAGE && echo true || echo false)"
check_result "New Invoice UI: selector de serie" \
    "$(grep -q 'seriesId' $NEW_PAGE && echo true || echo false)"

# ============================================
# 6. VERIFICAR LÓGICA DE NEGOCIO
# ============================================
echo -e "\n${BLUE}═══ 6. LÓGICA DE NEGOCIO ═══${NC}"

# Inmutabilidad
check_result "Facturas emitidas tienen lockedAt" \
    "$(grep -rq 'lockedAt.*new Date' apps/web/src/app/api/ && echo true || echo false)"

# Numeración correlativa
check_result "Serie tiene currentNumber @default(0)" \
    "$(grep -A 5 'currentNumber' $SCHEMA_FILE | grep -q '@default(0)' && echo true || echo false)"

# Estados de factura
check_result "InvoiceStatus tiene draft" \
    "$(grep -A 10 'enum InvoiceStatus' $SCHEMA_FILE | grep -q 'draft' && echo true || echo false)"
check_result "InvoiceStatus tiene issued" \
    "$(grep -A 10 'enum InvoiceStatus' $SCHEMA_FILE | grep -q 'issued' && echo true || echo false)"

# Control de acceso
check_result "APIs verifican tenantAccesses" \
    "$(grep -rq 'tenantAccesses' apps/web/src/app/api/tenants/ && echo true || echo false)"

# ============================================
# 7. VERIFICAR DEPENDENCIAS
# ============================================
echo -e "\n${BLUE}═══ 7. DEPENDENCIAS ═══${NC}"

check_result "zod instalado en node_modules" \
    "$([ -d node_modules/zod ] && echo true || echo false)"
check_result "jspdf instalado en node_modules" \
    "$([ -d node_modules/jspdf ] && echo true || echo false)"
check_result "next-auth instalado" \
    "$([ -d node_modules/next-auth ] && echo true || echo false)"
check_result "@prisma/client instalado" \
    "$([ -d node_modules/@prisma/client ] && echo true || echo false)"

# ============================================
# 8. VERIFICAR MIGRACIONES
# ============================================
echo -e "\n${BLUE}═══ 8. MIGRACIONES ═══${NC}"

MIGRATIONS_DIR="packages/db/prisma/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR" | wc -l)
    check_result "Existen migraciones ($MIGRATION_COUNT encontradas)" "true"
    
    # Verificar migración de facturación
    if ls "$MIGRATIONS_DIR" | grep -qiE 'invoice|factura|series'; then
        check_result "Existe migración de facturación" "true"
    else
        check_result "Existe migración de facturación" "false"
    fi
else
    check_result "Directorio de migraciones existe" "false"
fi

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    RESUMEN DE PRUEBAS                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "  Total de pruebas: ${BLUE}$TOTAL${NC}"
echo -e "  Pasaron: ${GREEN}$PASSED${NC}"
echo -e "  Fallaron: ${RED}$FAILED${NC}"
echo ""

PERCENTAGE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODAS LAS PRUEBAS PASARON - FASE 6 LISTA (100%)          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  MAYORÍA DE PRUEBAS PASARON - REVISAR ERRORES ($PERCENTAGE%)    ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ MUCHAS PRUEBAS FALLARON - REVISIÓN NECESARIA ($PERCENTAGE%)       ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
