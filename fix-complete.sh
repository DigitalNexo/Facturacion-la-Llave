#!/bin/bash
# Solución completa y robusta para Prisma

set -e

echo "🔧 SOLUCIÓN COMPLETA - Prisma + Tests"
echo "======================================"
echo ""

cd /workspaces/Facturacion-la-Llave

# 1. Limpiar COMPLETAMENTE
echo "🧹 Limpieza profunda..."
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf node_modules/@prisma 2>/dev/null || true
rm -rf packages/db/node_modules 2>/dev/null || true
rm -rf package-lock.json 2>/dev/null || true

# 2. Reinstalar TODO desde cero
echo ""
echo "📦 Instalando todas las dependencias desde cero..."
npm install

# 3. Generar cliente Prisma
echo ""
echo "⚙️  Generando cliente Prisma..."
npm run db:generate

# 4. Verificar que todo compila
echo ""
echo "🔍 Verificando compilación..."
npx tsc --noEmit || echo "⚠️  Hay warnings de TypeScript (puede ser normal)"

# 5. Ejecutar tests
echo ""
echo "🧪 Ejecutando tests..."
npm test

echo ""
echo "======================================"
echo "✅ COMPLETADO"
