#!/bin/bash
set -e

echo "🧹 Limpiando cliente de Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo "✨ Generando cliente de Prisma..."
npx prisma generate --schema=./packages/db/prisma/schema.prisma

echo "🧹 Limpiando cache de Next.js..."
rm -rf apps/web/.next
rm -rf .next

echo "✅ ¡Listo! Ahora ejecuta: npm run dev"
