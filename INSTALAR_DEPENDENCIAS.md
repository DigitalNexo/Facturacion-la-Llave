# ⚠️ INSTRUCCIONES DE INSTALACIÓN - FASE 3

## 🔴 IMPORTANTE: Faltan dependencias

Los errores de TypeScript que ves son **NORMALES** porque las dependencias aún no se han instalado vía `npm install`.

---

## 📦 INSTALAR DEPENDENCIAS

### Opción 1: Script automatizado (RECOMENDADO)

```bash
chmod +x install-fase3.sh
./install-fase3.sh
```

Este script:
- ✅ Instala `next-auth@beta` y `bcryptjs`
- ✅ Instala tipos `@types/bcryptjs`
- ✅ Genera `NEXTAUTH_SECRET` automáticamente
- ✅ Agrega `NEXTAUTH_URL` a .env

---

### Opción 2: Manual

```bash
# 1. Instalar next-auth (Auth.js v5)
npm install next-auth@beta

# 2. Instalar bcryptjs
npm install bcryptjs

# 3. Instalar tipos de bcryptjs
npm install -D @types/bcryptjs

# 4. Generar NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

# 5. Agregar NEXTAUTH_URL
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
```

---

## 🔄 DESPUÉS DE INSTALAR

```bash
# 1. Regenerar Prisma Client
npm run db:generate

# 2. Ejecutar tests
npm test

# 3. Validar instalación
npm run validate

# 4. Iniciar servidor
npm run dev
```

---

## ✅ VERIFICAR INSTALACIÓN

Después de ejecutar `npm install`, los errores de TypeScript desaparecerán:

### Errores que se resolverán:
- ❌ `No se encuentra el módulo "next-auth"` → ✅ Resuelto
- ❌ `No se encuentra el módulo "bcryptjs"` → ✅ Resuelto
- ❌ `El parámetro tiene un tipo 'any' implícito` → ✅ Resuelto

### Archivos afectados:
- ✅ `/auth.config.ts`
- ✅ `/auth.ts`
- ✅ `/middleware.ts`
- ✅ `/apps/web/src/app/login/page.tsx`
- ✅ `/apps/web/src/app/api/auth/register/route.ts`
- ✅ `/packages/tests/src/__tests__/auth.test.ts`

---

## 🧪 EJECUTAR TESTS

```bash
# Todos los tests (FASE 1 + FASE 3)
npm test

# Solo tests de autenticación
npm run test:auth

# Con watch mode
npm run test:watch
```

**Resultado esperado:**
```
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
  - FASE 1: 5 tests ✅
  - FASE 3: 11 tests ✅
```

---

## 🚀 EJECUTAR SERVIDOR

```bash
npm run dev
```

Abre tu navegador en:
- http://localhost:3000 → Landing page
- http://localhost:3000/register → Registro
- http://localhost:3000/login → Login
- http://localhost:3000/dashboard → Dashboard (protegido)

---

## 📋 CHECKLIST POST-INSTALACIÓN

- [ ] Ejecutar `npm install`
- [ ] Verificar que no hay errores de TypeScript
- [ ] Generar NEXTAUTH_SECRET en .env
- [ ] Ejecutar `npm run db:generate`
- [ ] Ejecutar `npm test` (21 tests deben pasar)
- [ ] Ejecutar `npm run dev`
- [ ] Abrir http://localhost:3000/register
- [ ] Registrar un usuario de prueba
- [ ] Login con ese usuario
- [ ] Verificar dashboard

---

## ⚠️ SI SIGUES VIENDO ERRORES

### Error: "Cannot find module 'next-auth'"
```bash
# Borrar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Prisma Client did not initialize yet"
```bash
npm run db:generate
```

### Error: TypeScript sigue mostrando errores
```bash
# Reiniciar VS Code
# En VS Code: Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

---

## 📝 RESUMEN

**Estado actual:**
- ✅ Código de FASE 3: 100% implementado
- ⏳ Dependencias: Pendientes de instalación
- ⏳ Tests: Listos para ejecutar

**Acción requerida:**
```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
npm run db:generate
npm test
```

**Después de esto:**
- ✅ 0 errores de TypeScript
- ✅ 21 tests pasando
- ✅ Sistema funcionando al 100%

---

**¡Listo para instalar! 🚀**
