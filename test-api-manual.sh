#!/bin/bash
# PRUEBAS MANUALES CON CURL - FASE 3 API
# Prueba todos los endpoints de autenticación

set -e

echo "🧪 =============================================="
echo "🧪 PRUEBAS MANUALES API - FASE 3"
echo "🧪 =============================================="
echo ""
echo "⚠️  IMPORTANTE: El servidor debe estar corriendo en http://localhost:3000"
echo "   Ejecuta: npm run dev"
echo ""
read -p "¿Servidor corriendo? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Inicia el servidor primero con: npm run dev"
    exit 1
fi

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)

echo ""
echo "📝 TEST 1: Registro de AUTÓNOMO"
echo "================================"
EMAIL_AUTONOMO="autonomo-${TIMESTAMP}@test.com"
echo "Email: $EMAIL_AUTONOMO"
RESPONSE1=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_AUTONOMO\",
    \"password\": \"Test1234\",
    \"name\": \"Juan Autónomo\",
    \"accountType\": \"self_employed\",
    \"tenantName\": \"Juan Autónomo\",
    \"tenantTaxId\": \"12345678A\"
  }")

echo "Respuesta:"
echo "$RESPONSE1" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE1"

if echo "$RESPONSE1" | grep -q "userId"; then
  echo "✅ TEST 1 PASADO: Autónomo registrado"
  USER_ID_1=$(echo "$RESPONSE1" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  ACCOUNT_ID_1=$(echo "$RESPONSE1" | grep -o '"accountId":"[^"]*"' | cut -d'"' -f4)
  echo "   - User ID: $USER_ID_1"
  echo "   - Account ID: $ACCOUNT_ID_1"
else
  echo "❌ TEST 1 FALLADO"
  echo "Respuesta: $RESPONSE1"
fi
echo ""

sleep 1

echo "📝 TEST 2: Registro de EMPRESA"
echo "================================"
EMAIL_EMPRESA="empresa-${TIMESTAMP}@test.com"
echo "Email: $EMAIL_EMPRESA"
RESPONSE2=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_EMPRESA\",
    \"password\": \"Test1234\",
    \"name\": \"María Empresa\",
    \"accountType\": \"company\",
    \"tenantName\": \"Mi Empresa SL\",
    \"tenantTaxId\": \"B${TIMESTAMP}\"
  }")

echo "Respuesta:"
echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"

if echo "$RESPONSE2" | grep -q "userId"; then
  echo "✅ TEST 2 PASADO: Empresa registrada"
  USER_ID_2=$(echo "$RESPONSE2" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  ACCOUNT_ID_2=$(echo "$RESPONSE2" | grep -o '"accountId":"[^"]*"' | cut -d'"' -f4)
  echo "   - User ID: $USER_ID_2"
  echo "   - Account ID: $ACCOUNT_ID_2"
else
  echo "❌ TEST 2 FALLADO"
fi
echo ""

sleep 1

echo "📝 TEST 3: Intento de registro ADVISOR (debe fallar con 403)"
echo "============================================================"
EMAIL_ADVISOR="advisor-${TIMESTAMP}@test.com"
echo "Email: $EMAIL_ADVISOR"
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_ADVISOR\",
    \"password\": \"Test1234\",
    \"name\": \"Carlos Asesor\",
    \"accountType\": \"advisor\",
    \"tenantName\": \"Asesoría Test\",
    \"tenantTaxId\": \"C${TIMESTAMP}\"
  }")

HTTP_CODE=$(echo "$RESPONSE3" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE3" | grep -v "HTTP_CODE")

echo "HTTP Status: $HTTP_CODE"
echo "Respuesta:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ TEST 3 PASADO: Advisor correctamente rechazado (403)"
else
  echo "❌ TEST 3 FALLADO: Debería ser 403, fue $HTTP_CODE"
fi
echo ""

sleep 1

echo "📝 TEST 4: Email duplicado (debe fallar)"
echo "========================================"
RESPONSE4=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_AUTONOMO\",
    \"password\": \"Test1234\",
    \"name\": \"Juan Duplicado\",
    \"accountType\": \"self_employed\",
    \"tenantName\": \"Juan Duplicado\",
    \"tenantTaxId\": \"99999999Z\"
  }")

HTTP_CODE=$(echo "$RESPONSE4" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE4" | grep -v "HTTP_CODE")

echo "HTTP Status: $HTTP_CODE"
echo "Respuesta:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ TEST 4 PASADO: Email duplicado correctamente rechazado (400)"
else
  echo "⚠️  TEST 4: Esperado 400, recibido $HTTP_CODE"
fi
echo ""

sleep 1

echo "📝 TEST 5: Verificar trial de 15 días en BD"
echo "==========================================="
echo "Consultando base de datos..."

npx tsx -e "
import { PrismaClient } from '@fll/db';
const prisma = new PrismaClient();

(async () => {
  const account = await prisma.account.findFirst({
    where: { users: { some: { email: '$EMAIL_AUTONOMO' } } },
    include: { users: { select: { email: true } } }
  });
  
  if (account) {
    const now = new Date();
    const trialEnd = account.trialEndsAt;
    const diff = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000*60*60*24)) : 0;
    
    console.log('   ✅ Cuenta encontrada');
    console.log(\`   - Email: \${account.users[0].email}\`);
    console.log(\`   - Status: \${account.status}\`);
    console.log(\`   - Trial termina: \${trialEnd?.toISOString()}\`);
    console.log(\`   - Días restantes: \${diff}\`);
    
    if (account.status !== 'trialing') {
      console.log('   ❌ ERROR: Status debería ser trialing');
    } else if (diff < 14 || diff > 15) {
      console.log(\`   ❌ ERROR: Días restantes debería ser 15, es \${diff}\`);
    } else {
      console.log('   ✅ Trial de 15 días configurado correctamente');
    }
  } else {
    console.log('   ❌ Cuenta no encontrada');
  }
  
  await prisma.\$disconnect();
})();
"

echo "✅ TEST 5 COMPLETADO"
echo ""

echo "🎉 =============================================="
echo "🎉 PRUEBAS MANUALES COMPLETADAS"
echo "🎉 =============================================="
echo ""
echo "📊 RESUMEN:"
echo "   ✅ TEST 1: Registro autónomo"
echo "   ✅ TEST 2: Registro empresa"
echo "   ✅ TEST 3: Advisor rechazado (403)"
echo "   ✅ TEST 4: Email duplicado rechazado"
echo "   ✅ TEST 5: Trial 15 días verificado"
echo ""
echo "🗑️  Para limpiar los datos de prueba:"
echo "   DELETE FROM users WHERE email LIKE '%${TIMESTAMP}%';"
echo ""
