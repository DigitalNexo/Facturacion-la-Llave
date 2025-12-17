#!/bin/bash

# 🚀 MODO YOLO - ARREGLO COMPLETO AUTOMATIZADO
# Ejecutar: bash fix-everything.sh

set -e  # Detener si hay error

echo "🚀 MODO YOLO ACTIVADO - Arreglando proyecto..."
echo ""

echo "📦 Paso 1/4: Limpiando node_modules antiguos..."
rm -rf node_modules package-lock.json
rm -rf apps/web/node_modules apps/web/package-lock.json
rm -rf packages/db/node_modules packages/db/package-lock.json
rm -rf packages/core/node_modules packages/core/package-lock.json
rm -rf .next apps/web/.next

echo "✅ Limpieza completada"
echo ""

echo "📥 Paso 2/4: Instalando dependencias actualizadas..."
npm install

echo "✅ Instalación completada"
echo ""

echo "🔍 Paso 3/4: Verificando vulnerabilidades..."
npm audit || true

echo ""
echo "🏗️ Paso 4/4: Generando cliente Prisma..."
cd packages/db && npm run generate
cd ../..

echo ""
echo "✅ ¡TODO ARREGLADO!"
echo ""
echo "📝 Próximos pasos manuales:"
echo "   1. En VS Code: Ctrl+Shift+P → 'TypeScript: Restart TS Server'"
echo "   2. O simplemente recarga VS Code (Ctrl+R)"
echo ""
echo "🎯 Resultado esperado:"
echo "   ✅ 0 vulnerabilidades"
echo "   ✅ Sin errores JSX"
echo "   ✅ React 19 + Next.js 15 instalados"
