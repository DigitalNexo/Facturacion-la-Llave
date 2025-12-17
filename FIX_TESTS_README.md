# 🔧 Solución rápida para errores de tests

## Problema detectado

El cliente Prisma necesita regenerarse para incluir el modelo `UsageCounter`.

## Solución

Ejecuta este comando:

```bash
chmod +x fix-tests.sh && ./fix-tests.sh
```

Este script:
1. Limpia cache de Prisma
2. Reinstala @prisma/client
3. Regenera cliente con UsageCounter
4. Verifica TypeScript
5. Ejecuta tests

## Alternativa manual

```bash
# Limpiar y regenerar
rm -rf node_modules/.prisma node_modules/@prisma/client
npm install @prisma/client
npm run db:generate

# Ejecutar tests
npm test
```

## ⚠️ Nota sobre BD de test

Los **smoke tests** (solo lectura) ahora pueden ejecutarse en cualquier BD.

Para tests que **modifican datos**, deberías:
1. Crear una BD de test separada
2. Configurar `DATABASE_URL` con "test" en el nombre
3. Aplicar migraciones: `npm run db:migrate`
4. Aplicar seeds: `npm run db:seed`

Ejemplo de BD de test en `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/facturacion_la_llave_test?schema=public"
```
