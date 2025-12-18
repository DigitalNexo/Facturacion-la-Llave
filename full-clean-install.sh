#!/bin/bash
set -e

echo "🧹 LIMPIEZA TOTAL..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf node_modules/.prisma
rm -rf apps/web/.next
rm -rf .next

echo "📦 Reinstalando dependencias..."
npm install

echo "✨ Generando cliente de Prisma..."
npx prisma generate --schema=./packages/db/prisma/schema.prisma

echo "✅ ¡Todo limpio! Reinicia VS Code para limpiar cache de TypeScript."
echo ""
echo "Después ejecuta: npm run dev"
