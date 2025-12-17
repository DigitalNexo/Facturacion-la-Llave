#!/bin/bash
# Script para instalar dependencias y ejecutar tests

echo "📦 Instalando dependencias de Jest..."
cd /workspaces/Facturacion-la-Llave
npm install

echo ""
echo "✅ Dependencias instaladas!"
echo ""
echo "🧪 Para ejecutar tests:"
echo "   npm test          - Ejecutar todos los tests"
echo "   npm run test:watch - Ejecutar en modo watch"
echo "   npm run test:coverage - Con cobertura"
