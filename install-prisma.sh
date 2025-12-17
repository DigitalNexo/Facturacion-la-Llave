#!/bin/bash
# Instalación correcta de Prisma con engines

set -e

echo "🔧 Instalación completa de Prisma"
echo "=================================="
echo ""

cd /workspaces/Facturacion-la-Llave

# Paso 1: Instalar todas las dependencias de Prisma
echo "📦 Instalando @prisma/client y @prisma/engines..."
npm install @prisma/client @prisma/engines

echo ""
echo "⚙️  Generando cliente Prisma..."
npm run db:generate

echo ""
echo "✅ Prisma instalado correctamente"
echo ""
echo "🧪 Ejecutando tests..."
npm test

echo ""
echo "✅ ¡Completado!"
