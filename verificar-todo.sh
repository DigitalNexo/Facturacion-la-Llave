#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║  VERIFICACIÓN COMPLETA - FASES 1-7                                ║"
echo "║  Sistema de Facturación La Llave                                   ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar TypeScript compila
echo "▶ 1. Compilando TypeScript..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compila sin errores"
else
    echo "❌ Errores de TypeScript"
    exit 1
fi
echo ""

# 2. Test rápido de FASE 7
echo "▶ 2. Test rápido FASE 7 (hash)..."
npx tsx test-fase7-rapido.ts
if [ $? -eq 0 ]; then
    echo "✅ Hash encadenado funciona"
else
    echo "❌ Error en hash encadenado"
    exit 1
fi
echo ""

# 3. Verificación exhaustiva de todas las fases
echo "▶ 3. Verificación exhaustiva (FASES 1-7)..."
npx tsx verificar-todas-fases.ts
if [ $? -eq 0 ]; then
    echo "✅ Todas las fases verificadas"
else
    echo "❌ Errores en verificación"
    exit 1
fi
echo ""

echo "════════════════════════════════════════════════════════════════════"
echo "║  ✅ VERIFICACIÓN COMPLETA EXITOSA                                ║"
echo "║  Todas las fases (1-7) funcionan correctamente                   ║"
echo "════════════════════════════════════════════════════════════════════"
echo ""
