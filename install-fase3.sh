/**
 * SCRIPT DE INSTALACIÓN PARA FASE 3
 * Instala dependencias de autenticación
 */

#!/bin/bash

set -e

echo "🔐 Instalando dependencias de FASE 3 - Autenticación..."

# Instalar next-auth y bcryptjs
npm install next-auth@beta bcryptjs

# Instalar tipos
npm install -D @types/bcryptjs

# Generar NEXTAUTH_SECRET si no existe
if ! grep -q "NEXTAUTH_SECRET" .env 2>/dev/null; then
  echo ""
  echo "📝 Generando NEXTAUTH_SECRET..."
  SECRET=$(openssl rand -base64 32)
  echo "NEXTAUTH_SECRET=\"$SECRET\"" >> .env
  echo "✅ NEXTAUTH_SECRET agregado a .env"
else
  echo "✅ NEXTAUTH_SECRET ya existe en .env"
fi

# Agregar NEXTAUTH_URL si no existe
if ! grep -q "NEXTAUTH_URL" .env 2>/dev/null; then
  echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
  echo "✅ NEXTAUTH_URL agregado a .env"
fi

echo ""
echo "✅ Instalación de FASE 3 completada"
echo ""
echo "Siguientes pasos:"
echo "1. npm run db:generate  # Regenerar Prisma client"
echo "2. npm run dev          # Iniciar servidor"
echo "3. Abrir http://localhost:3000/register"
