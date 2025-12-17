#!/bin/bash
# Script para arreglar el cliente Prisma y ejecutar tests

set -e

echo "🔧 Arreglando configuración de tests..."
echo ""

cd /workspaces/Facturacion-la-Llave

# 1. Limpiar cache de node_modules/@prisma
echo "🧹 Limpiando cache de Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 2. Reinstalar @prisma/client
echo "📦 Reinstalando @prisma/client..."
npm install @prisma/client

# 3. Regenerar cliente Prisma
echo "⚙️  Regenerando cliente Prisma con UsageCounter..."
npm run db:generate

# 4. Verificar TypeScript
echo "🔍 Verificando TypeScript..."
npx tsc --noEmit

# 5. Ejecutar tests
echo "🧪 Ejecutando tests..."
npm test

echo ""
echo "✅ ¡Todo listo!"
