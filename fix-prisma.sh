#!/bin/bash
# Reinstalar Prisma para solucionar archivos corruptos

echo "🔧 Eliminando archivos de Prisma..."
rm -rf node_modules/@prisma
rm -rf node_modules/.prisma

echo "📦 Reinstalando dependencias de Prisma..."
npm install prisma@latest @prisma/client@latest

echo "✨ Generando cliente de Prisma..."
npx prisma generate --schema=./packages/db/prisma/schema.prisma

echo "🚀 Aplicando migración..."
npx prisma migrate dev --name add_invitation_model --schema=./packages/db/prisma/schema.prisma

echo "✅ ¡Listo!"
