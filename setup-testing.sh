#!/bin/bash
# Script completo para configurar testing

echo "🚀 Configurando entorno de testing..."
echo ""

# Cambiar al directorio raíz
cd /workspaces/Facturacion-la-Llave

# 1. Generar cliente Prisma actualizado
echo "📦 Generando cliente Prisma..."
npm run db:generate

echo ""
echo "📦 Instalando dependencias de Jest..."
npm install

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "🧪 Comandos disponibles:"
echo "   npm test              - Ejecutar todos los tests"
echo "   npm run test:watch    - Ejecutar en modo watch"
echo "   npm run test:coverage - Con cobertura de código"
echo ""
echo "⚠️  IMPORTANTE: Antes de ejecutar tests, configura una BD de test separada"
