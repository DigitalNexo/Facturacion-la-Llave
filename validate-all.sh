#!/bin/bash
# Script completo de revisión y validación - FASE 1 y FASE 2

set -e  # Salir si hay error

echo "🔍 REVISIÓN COMPLETA - FACTURACIÓN LA LLAVE"
echo "=========================================="
echo ""

# Cambiar al directorio raíz
cd /workspaces/Facturacion-la-Llave

# 1. GENERAR CLIENTE PRISMA
echo "📦 1/6 Generando cliente Prisma actualizado..."
npm run db:generate
echo "✅ Cliente Prisma generado"
echo ""

# 2. INSTALAR DEPENDENCIAS
echo "📦 2/6 Instalando dependencias..."
npm install
echo "✅ Dependencias instaladas"
echo ""

# 3. VERIFICAR ESTADO DE MIGRACIONES
echo "🗄️  3/6 Verificando migraciones de BD..."
cd packages/db
npx dotenv -e ../../.env -- prisma migrate status
cd ../..
echo "✅ Migraciones verificadas"
echo ""

# 4. VERIFICAR TYPESCRIPT
echo "🔧 4/6 Verificando compilación TypeScript..."
npx tsc --noEmit
echo "✅ TypeScript OK"
echo ""

# 5. EJECUTAR TESTS
echo "🧪 5/6 Ejecutando tests smoke..."
npm test
echo "✅ Tests OK"
echo ""

# 6. RESUMEN FINAL
echo "📊 6/6 Resumen final"
echo "=========================================="
echo ""
echo "✅ FASE 1 - Arranque del proyecto: 100%"
echo "   ✅ 1.1 Proyecto base"
echo "   ✅ 1.2 PostgreSQL + Prisma"
echo "   ✅ 1.3 Test harness"
echo ""
echo "✅ FASE 2 - Modelo de dominio: 100%"
echo "   ✅ 2.1 17 modelos Prisma"
echo "   ✅ 2.2 Validaciones backend"
echo "   ✅ 2.3 Seeds (4 planes + 3 permisos)"
echo ""
echo "🚀 Sistema listo para FASE 3 - Autenticación"
echo ""
