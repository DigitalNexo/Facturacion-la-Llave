#!/bin/bash

# Script de tests de integridad FASE 6 - Core de Facturación
# Verifica las reglas críticas del sistema de facturación

echo "================================================="
echo "  TESTS DE INTEGRIDAD - FASE 6"
echo "  Core de Facturación"
echo "================================================="
echo ""

PASSED=0
FAILED=0

# Función para verificar archivos
check_file() {
  if [ -f "$1" ]; then
    echo "✅ $2"
    ((PASSED++))
  else
    echo "❌ $2 - Archivo no encontrado: $1"
    ((FAILED++))
  fi
}

# Función para verificar contenido
check_content() {
  if grep -q "$2" "$1"; then
    echo "✅ $3"
    ((PASSED++))
  else
    echo "❌ $3 - No encontrado en $1"
    ((FAILED++))
  fi
}

echo "1. VERIFICACIÓN DE ARCHIVOS CREADOS"
echo "======================================"
check_file "apps/web/src/app/api/tenants/[id]/series/route.ts" "API: Gestión de series (GET/POST)"
check_file "apps/web/src/app/api/series/[id]/route.ts" "API: Serie individual (GET/PUT/DELETE)"
check_file "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "API: Facturas por tenant (GET/POST)"
check_file "apps/web/src/app/api/invoices/[id]/route.ts" "API: Factura individual (GET/PUT/DELETE)"
check_file "apps/web/src/app/api/invoices/[id]/issue/route.ts" "API: Emisión de facturas"
check_file "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "API: Generación de PDF"
check_file "apps/web/src/app/api/tenants/[id]/customers/route.ts" "API: Clientes"
check_file "apps/web/src/app/dashboard/tenants/[id]/series/page.tsx" "UI: Gestión de series"
check_file "apps/web/src/app/dashboard/tenants/[id]/invoices/page.tsx" "UI: Listado de facturas"
check_file "apps/web/src/app/dashboard/tenants/[id]/invoices/new/page.tsx" "UI: Nueva factura"
check_file "apps/web/src/app/dashboard/tenants/[id]/invoices/[invoiceId]/edit/page.tsx" "UI: Editar factura"
echo ""

echo "2. REGLAS CRÍTICAS - ESTADOS DE FACTURA"
echo "========================================="
check_content "apps/web/src/app/api/invoices/[id]/route.ts" "invoice.status !== 'draft'" "Validación: No editar facturas emitidas"
check_content "apps/web/src/app/api/invoices/[id]/route.ts" "No se pueden editar facturas emitidas" "Mensaje de error: Editar emitidas"
check_content "apps/web/src/app/api/invoices/[id]/route.ts" "No se pueden eliminar facturas emitidas" "Mensaje de error: Eliminar emitidas"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "status !== 'draft'" "Emisión: Solo desde draft"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "lockedAt" "Campo lockedAt al emitir"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "lockedBy" "Campo lockedBy al emitir"
echo ""

echo "3. NUMERACIÓN CORRELATIVA"
echo "========================="
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "currentNumber" "Incremento de número actual"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "\$transaction" "Transacción atómica para reservar número"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "nextNumber = series.currentNumber + 1" "Cálculo correlativo"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "fullNumber" "Generación de número completo"
check_content "packages/db/prisma/schema.prisma" "@@unique(\[tenantId, seriesId, number\])" "Constraint de unicidad en schema"
echo ""

echo "4. VALIDACIONES DE SERIE"
echo "========================="
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "Serie no encontrada" "Validación: Serie existe"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "no está activa" "Validación: Serie activa"
check_content "apps/web/src/app/api/series/[id]/route.ts" "_count.*invoices" "Verificar facturas antes de borrar serie"
check_content "apps/web/src/app/api/series/[id]/route.ts" "No se puede eliminar una serie con facturas" "Mensaje: Serie con facturas"
check_content "apps/web/src/app/api/series/[id]/route.ts" "No se puede cambiar el código de una serie con facturas" "Protección: Código de serie"
echo ""

echo "5. GENERACIÓN DE PDF"
echo "===================="
check_content "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "jsPDF" "Uso de jsPDF"
check_content "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "status !== 'issued'" "PDF solo para emitidas"
check_content "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "Content-Type.*application/pdf" "Header de PDF"
check_content "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "FACTURA" "Contenido del PDF"
check_content "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "fullNumber" "Número en PDF"
check_content "apps/web/src/app/api/invoices/[id]/pdf/route.ts" "tenant.taxId" "NIF emisor en PDF"
echo ""

echo "6. CONTROL DE ACCESO"
echo "====================="
check_content "apps/web/src/app/api/invoices/[id]/route.ts" "getServerSession" "Autenticación requerida"
check_content "apps/web/src/app/api/invoices/[id]/route.ts" "tenantAccesses" "Verificación de acceso a tenant"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "hasAccess" "Validación de permisos"
check_content "apps/web/src/app/api/series/[id]/route.ts" "Sin acceso a esta serie" "Mensaje de acceso denegado"
echo ""

echo "7. VALIDACIONES DE DATOS"
echo "========================="
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "createInvoiceSchema" "Schema de validación Zod"
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "lines.*min(1)" "Mínimo 1 línea"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "lines.length === 0" "Validar líneas al emitir"
check_content "apps/web/src/app/api/invoices/[id]/issue/route.ts" "!invoice.issueDate" "Validar fecha al emitir"
check_content "apps/web/src/app/api/tenants/[id]/series/route.ts" "P2002" "Manejo de errores de unicidad"
echo ""

echo "8. CÁLCULO DE TOTALES"
echo "====================="
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "subtotal" "Campo subtotal"
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "taxAmount" "Campo taxAmount"
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "total" "Campo total"
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "quantity.*unitPrice" "Cálculo de línea"
check_content "apps/web/src/app/api/tenants/[id]/invoices/route.ts" "taxRate.*100" "Aplicación de IVA"
echo ""

echo "9. UI - ESTADOS Y ACCIONES"
echo "==========================="
check_content "apps/web/src/app/dashboard/tenants/[id]/invoices/page.tsx" "status === 'draft'" "Botones condicionales por estado"
check_content "apps/web/src/app/dashboard/tenants/[id]/invoices/page.tsx" "handleIssue" "Función de emisión"
check_content "apps/web/src/app/dashboard/tenants/[id]/invoices/page.tsx" "useConfirm" "Confirmación modal"
check_content "apps/web/src/app/dashboard/tenants/[id]/invoices/page.tsx" "getStatusBadge" "Badges de estado"
check_content "apps/web/src/app/dashboard/tenants/[id]/invoices/[invoiceId]/edit/page.tsx" "invoice.status !== 'draft'" "Validación UI: Solo draft"
echo ""

echo "10. INTEGRACIÓN CON MODELOS PRISMA"
echo "===================================="
check_content "packages/db/prisma/schema.prisma" "model InvoiceSeries" "Modelo InvoiceSeries"
check_content "packages/db/prisma/schema.prisma" "model Invoice" "Modelo Invoice"
check_content "packages/db/prisma/schema.prisma" "model InvoiceLine" "Modelo InvoiceLine"
check_content "packages/db/prisma/schema.prisma" "enum InvoiceStatus" "Enum InvoiceStatus"
check_content "packages/db/prisma/schema.prisma" "enum InvoiceType" "Enum InvoiceType"
check_content "packages/db/prisma/schema.prisma" "currentNumber.*Int.*@default(0)" "Campo currentNumber"
echo ""

echo "================================================="
echo "  RESUMEN DE TESTS"
echo "================================================="
echo "✅ Tests pasados: $PASSED"
echo "❌ Tests fallidos: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 ¡TODOS LOS TESTS PASARON!"
  echo "La FASE 6 está correctamente implementada."
  exit 0
else
  echo "⚠️  Hay $FAILED tests que requieren atención."
  exit 1
fi
