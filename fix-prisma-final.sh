#!/bin/bash
# FIX DEFINITIVO - Instalar Prisma correctamente y ejecutar tests

set -e

echo "🔧 FIX DEFINITIVO - Prisma + Tests"
echo "===================================="
echo ""

cd /workspaces/Facturacion-la-Llave

# 1. Limpiar todo
echo "🧹 Limpiando instalación anterior..."
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf node_modules/@prisma 2>/dev/null || true
rm -rf packages/db/node_modules 2>/dev/null || true

# 2. Instalar dependencias correctas
echo ""
echo "📦 Instalando dependencias de Prisma..."
npm install @prisma/client@6.2.0 @prisma/engines@6.2.0

# 3. Generar cliente Prisma
echo ""
echo "⚙️  Generando cliente Prisma..."
cd packages/db
npx dotenv -e ../../.env -- npx prisma generate
cd ../..

# 4. Verificar TypeScript
echo ""
echo "🔍 Verificando TypeScript..."
npx tsc --noEmit

# 5. Ejecutar tests
echo ""
echo "🧪 Ejecutando tests..."
npm test

echo ""
echo "===================================="
echo "✅ ¡TODO COMPLETO!"
echo ""
echo "📊 Resumen:"
echo "   ✅ Prisma 6.2.0 instalado"
echo "   ✅ Cliente generado con 17 modelos"
echo "   ✅ TypeScript sin errores"
echo "   ✅ Tests ejecutándose"
echo ""
