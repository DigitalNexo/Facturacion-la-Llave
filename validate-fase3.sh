#!/bin/bash

# ========================================
# VALIDACIÓN COMPLETA - FASE 3
# Verifica que la autenticación está lista
# ========================================

set -e

echo "🔍 Validando FASE 3 - Autenticación..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0

# Función para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
  fi
}

# 1. Verificar archivos de autenticación
echo "📂 Verificando archivos de configuración..."
[ -f "auth.config.ts" ] && check "auth.config.ts existe" || check "auth.config.ts FALTA"
[ -f "auth.ts" ] && check "auth.ts existe" || check "auth.ts FALTA"
[ -f "middleware.ts" ] && check "middleware.ts existe" || check "middleware.ts FALTA"
[ -f "types/next-auth.d.ts" ] && check "types/next-auth.d.ts existe" || check "types/next-auth.d.ts FALTA"

echo ""

# 2. Verificar API routes
echo "🔌 Verificando API routes..."
[ -f "apps/web/src/app/api/auth/[...nextauth]/route.ts" ] && check "NextAuth route existe" || check "NextAuth route FALTA"
[ -f "apps/web/src/app/api/auth/register/route.ts" ] && check "Register route existe" || check "Register route FALTA"

echo ""

# 3. Verificar páginas
echo "📄 Verificando páginas..."
[ -f "apps/web/src/app/login/page.tsx" ] && check "Login page existe" || check "Login page FALTA"
[ -f "apps/web/src/app/register/page.tsx" ] && check "Register page existe" || check "Register page FALTA"
[ -f "apps/web/src/app/dashboard/page.tsx" ] && check "Dashboard page existe" || check "Dashboard page FALTA"

echo ""

# 4. Verificar tests
echo "🧪 Verificando tests..."
[ -f "packages/tests/src/__tests__/auth.test.ts" ] && check "Auth tests existen" || check "Auth tests FALTAN"

echo ""

# 5. Verificar dependencias en package.json
echo "📦 Verificando dependencias..."
if grep -q "next-auth" package.json; then
  check "next-auth en package.json"
else
  echo -e "${YELLOW}⚠️  next-auth NO está en package.json (ejecutar: npm install next-auth@beta)${NC}"
  ((FAILED++))
fi

if grep -q "bcryptjs" package.json; then
  check "bcryptjs en package.json"
else
  echo -e "${YELLOW}⚠️  bcryptjs NO está en package.json (ejecutar: npm install bcryptjs)${NC}"
  ((FAILED++))
fi

echo ""

# 6. Verificar variables de entorno
echo "🔐 Verificando variables de entorno..."
if [ -f ".env" ]; then
  if grep -q "NEXTAUTH_SECRET" .env; then
    check "NEXTAUTH_SECRET configurado"
  else
    echo -e "${YELLOW}⚠️  NEXTAUTH_SECRET falta en .env (ejecutar: openssl rand -base64 32)${NC}"
    ((FAILED++))
  fi
  
  if grep -q "NEXTAUTH_URL" .env; then
    check "NEXTAUTH_URL configurado"
  else
    echo -e "${YELLOW}⚠️  NEXTAUTH_URL falta en .env${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}❌ Archivo .env no existe${NC}"
  ((FAILED++))
fi

echo ""

# 7. Verificar documentación
echo "📚 Verificando documentación..."
[ -f "docs/FASE_3_AUTENTICACION.md" ] && check "Documentación FASE 3" || check "Documentación FALTA"
[ -f "README_FASE3.md" ] && check "README FASE 3" || check "README FALTA"
[ -f "FASE3_COMPLETADA.md" ] && check "Resumen completado" || check "Resumen FALTA"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Resultado final
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ VALIDACIÓN COMPLETA: $PASSED/$((PASSED+FAILED)) checks pasados${NC}"
  echo ""
  echo "🎉 FASE 3 está lista!"
  echo ""
  echo "Próximos pasos:"
  echo "1. npm install            # Instalar dependencias"
  echo "2. npm run db:generate    # Regenerar Prisma client"
  echo "3. npm test              # Ejecutar todos los tests"
  echo "4. npm run dev           # Iniciar servidor"
  exit 0
else
  echo -e "${RED}❌ VALIDACIÓN FALLÓ: $PASSED/$((PASSED+FAILED)) checks pasados${NC}"
  echo ""
  echo "⚠️  Resolver los errores antes de continuar"
  echo ""
  echo "Pasos sugeridos:"
  echo "1. ./install-fase3.sh    # Instalar dependencias"
  echo "2. Verificar .env        # Agregar NEXTAUTH_SECRET y NEXTAUTH_URL"
  echo "3. npm run db:generate   # Regenerar Prisma"
  exit 1
fi
