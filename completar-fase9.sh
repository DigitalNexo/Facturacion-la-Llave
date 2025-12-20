#!/bin/bash

# ========================================
# SCRIPT: Completar FASE 9
# Instala dependencias, migra BD y verifica
# ========================================

set -e  # Salir si hay error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║       COMPLETANDO FASE 9 - STRIPE SUSCRIPCIONES          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Paso 1: Instalar dependencias
echo "📦 Paso 1/4: Instalando dependencias (incluye Stripe)..."
npm install
echo "✅ Dependencias instaladas"
echo ""

# Paso 2: Migrar base de datos
echo "🗄️  Paso 2/4: Migrando base de datos (añadiendo currentPlan y stripePriceId)..."
cd packages/db
npx prisma migrate dev --name add_current_plan_and_price_id
echo "✅ Migración completada"
echo ""

# Paso 3: Generar cliente Prisma
echo "🔧 Paso 3/4: Generando cliente Prisma..."
npx prisma generate
cd ../..
echo "✅ Cliente Prisma generado"
echo ""

# Paso 4: Verificar todo
echo "🔍 Paso 4/4: Verificando implementación..."
echo ""
npx tsx verificar-todas-fases.ts
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║       ✅ FASE 9 COMPLETADA AL 100%                        ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. Configurar Stripe (seguir GUIA_CONFIGURACION_STRIPE.md)"
echo "2. Añadir claves a .env:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - STRIPE_PRICE_AUTONOMO"
echo "   - STRIPE_PRICE_EMPRESA_BASIC"
echo "   - STRIPE_PRICE_EMPRESA_PRO"
echo "   - STRIPE_PRICE_ASESORIA"
echo ""
echo "3. Iniciar app: npm run dev"
echo ""
echo "4. Probar flujo completo"
echo ""
echo "🎉 ¡LISTO PARA RECIBIR PAGOS!"
