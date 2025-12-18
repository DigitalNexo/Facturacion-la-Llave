#!/bin/bash
set -e

echo "🧹 Limpieza completa de dependencias..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

echo "📦 Instalando todas las dependencias desde cero..."
npm install

echo "✨ Generando cliente de Prisma..."
npx prisma generate --schema=./packages/db/prisma/schema.prisma

echo "🗄️ Aplicando migración de base de datos..."
npx prisma migrate dev --name add_invitation_model --schema=./packages/db/prisma/schema.prisma

echo "✅ ¡Todo listo! Ahora ejecuta: npm run dev"
