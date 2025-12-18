# 🎯 FASE 3 - AUTENTICACIÓN Y TRIAL SYSTEM

## ✅ COMPLETADO AL 100%

**Fecha:** 17 de diciembre de 2024

---

## 📦 COMPONENTES IMPLEMENTADOS

### 1. NextAuth.js v5 (Auth.js)

**Archivos creados:**
- ✅ `/auth.config.ts` - Configuración de NextAuth
- ✅ `/auth.ts` - Configuración principal con Credentials Provider
- ✅ `/middleware.ts` - Middleware de protección de rutas
- ✅ `/types/next-auth.d.ts` - Tipos TypeScript extendidos
- ✅ `/apps/web/src/app/api/auth/[...nextauth]/route.ts` - Route handler

**Características:**
- ✅ Autenticación con email + contraseña
- ✅ Hash seguro con bcryptjs (12 rounds)
- ✅ JWT sessions (30 días)
- ✅ Tipos extendidos con accountId, accountType, accountStatus

### 2. API de Registro

**Archivo:** `/apps/web/src/app/api/auth/register/route.ts`

**Reglas OBLIGATORIAS implementadas:**
- ✅ Solo permite registro de `self_employed` y `company`
- ❌ Rechaza registro de `advisor` (código 403)
- ✅ Valida email único
- ✅ Valida NIF/CIF único del tenant
- ✅ Crea cuenta + usuario + suscripción + tenant en transacción
- ✅ Asigna plan por defecto según accountType
- ✅ Trial de **EXACTAMENTE 15 días** desde registro

**Transacción atómica:**
1. Crear `Account` con status=trialing y trialEndsAt
2. Crear `User` con passwordHash
3. Crear `Subscription` en estado trialing
4. Crear primer `Tenant` (empresa del usuario)
5. Crear `TenantAccess` con permission set "completo-default"

### 3. Sistema de Trial

**Implementación:**
- ✅ Constante `TRIAL.DAYS = 15` en @fll/core
- ✅ Campo `trialEndsAt` calculado: `now + 15 días`
- ✅ Status inicial: `trialing`

**Lógica de bloqueo (en auth.ts):**
```typescript
if (status === 'trialing' && now > trialEndsAt) {
  // Actualizar a blocked
  await prisma.account.update({ status: 'blocked' });
  throw new Error('Trial expirado');
}

if (status === 'blocked') {
  throw new Error('Cuenta bloqueada');
}

if (status !== 'active' && status !== 'trialing') {
  throw new Error('Cuenta no activa');
}
```

### 4. Middleware de Protección

**Archivo:** `/middleware.ts`

**Rutas protegidas:**
- ✅ `/dashboard/*` - Requiere autenticación
- ✅ Redirige a `/login` si no autenticado
- ✅ Redirige a `/dashboard` si ya autenticado y va a login/register

**Rutas públicas:**
- ✅ `/` - Landing page
- ✅ `/login` - Página de login
- ✅ `/register` - Página de registro
- ✅ `/api/auth/*` - API de NextAuth

### 5. Páginas UI

#### Login (`/apps/web/src/app/login/page.tsx`)
- ✅ Formulario email + contraseña
- ✅ Manejo de errores de autenticación
- ✅ Link a registro
- ✅ Diseño responsive con Tailwind

#### Registro (`/apps/web/src/app/register/page.tsx`)
- ✅ Selector de tipo: Autónomo / Empresa
- ✅ Formulario completo con validaciones
- ✅ Datos personales: nombre, email, contraseña
- ✅ Datos empresa: nombre, NIF/CIF
- ✅ Validación contraseña mínimo 8 caracteres
- ✅ Confirmación de contraseña
- ✅ Diseño responsive

#### Dashboard (`/apps/web/src/app/dashboard/page.tsx`)
- ✅ Página protegida (server component)
- ✅ Muestra info de usuario y cuenta
- ✅ Banner de trial con días restantes
- ✅ Alerta roja cuando quedan ≤3 días
- ✅ Grid de acciones rápidas
- ✅ Navbar con logout

---

## 🧪 TESTS IMPLEMENTADOS

**Archivo:** `/packages/tests/src/__tests__/auth.test.ts`

### Tests de Registro (3 tests)
1. ✅ Debe permitir registro de self_employed
2. ✅ Debe permitir registro de company
3. ✅ NO debe permitir registro de advisor

### Tests de Login (5 tests)
1. ✅ Debe verificar contraseña correctamente con bcrypt
2. ✅ Debe denegar login si trial expiró
3. ✅ Debe permitir login si trial está activo
4. ✅ Debe permitir login si cuenta está activa (pagada)
5. ✅ Debe denegar login si cuenta está bloqueada

### Tests de Trial (3 tests)
1. ✅ TRIAL.DAYS debe ser exactamente 15
2. ✅ Calcular días restantes correctamente
3. ✅ Trial expirado debe detectarse

**Total:** 11 tests de autenticación

---

## 📋 REGLAS OBLIGATORIAS CUMPLIDAS

| Regla | Estado | Implementación |
|-------|--------|----------------|
| Solo registro self_employed/company | ✅ | API rechaza advisor con 403 |
| Trial EXACTAMENTE 15 días | ✅ | `TRIAL.DAYS = 15` |
| Bloqueo TOTAL al expirar | ✅ | Login denegado, status→blocked |
| Hash seguro de contraseñas | ✅ | bcrypt con 12 rounds |
| Transacción atómica | ✅ | Prisma.$transaction |
| Validación email único | ✅ | findUnique antes de crear |
| Validación NIF/CIF único | ✅ | findUnique en tenant.taxId |

---

## 🔐 SEGURIDAD

### Contraseñas
- ✅ Hash con bcryptjs (12 rounds)
- ✅ Validación mínimo 8 caracteres
- ✅ Confirmación de contraseña

### JWT Sessions
- ✅ Secret key en variable de entorno
- ✅ Duración: 30 días
- ✅ Incluye accountId, accountType, accountStatus

### Middleware
- ✅ Protección automática de rutas /dashboard/*
- ✅ Verificación de sesión server-side
- ✅ Redirecciones automáticas

---

## 📝 VARIABLES DE ENTORNO

**Nuevas variables requeridas:**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generar con: openssl rand -base64 32]"
```

**Agregar a `.env`:**
```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

---

## 🚀 USO

### Registro
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "Juan Pérez",
  "accountType": "self_employed",  // o "company"
  "tenantName": "Mi Empresa SL",
  "tenantTaxId": "B12345678"
}
```

**Respuesta:**
```json
{
  "message": "Registro exitoso",
  "userId": "uuid",
  "accountId": "uuid",
  "trialEndsAt": "2024-01-01T00:00:00.000Z"
}
```

### Login
```bash
# NextAuth maneja esto automáticamente
POST /api/auth/signin/credentials
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Verificar sesión
```typescript
import { auth } from '@/auth';

const session = await auth();
if (session?.user) {
  console.log(session.user.accountId);
  console.log(session.user.accountStatus);
}
```

---

## 🔄 FLUJO COMPLETO

1. **Registro**
   - Usuario llena formulario en `/register`
   - POST a `/api/auth/register`
   - Se crea: Account (trialing) + User + Subscription + Tenant + TenantAccess
   - Redirige a `/login` con mensaje de éxito

2. **Login**
   - Usuario llena formulario en `/login`
   - NextAuth valida credenciales
   - Verifica estado de cuenta y trial
   - Si OK: redirige a `/dashboard`
   - Si KO: muestra error

3. **Durante el trial**
   - Banner muestra días restantes
   - Usuario puede usar el sistema
   - Cuando quedan ≤3 días: alerta roja

4. **Expiración del trial**
   - Al intentar login: se detecta `now > trialEndsAt`
   - Account.status → `blocked`
   - Login denegado
   - Mensaje: "Trial expirado, activa suscripción"

5. **Activación (FASE siguiente)**
   - Usuario paga con Stripe
   - Webhook actualiza: Account.status → `active`
   - Puede iniciar sesión normalmente

---

## 📊 ESTADO FASE 3

| Componente | Estado | Tests |
|------------|--------|-------|
| NextAuth.js config | ✅ | - |
| API de registro | ✅ | 3/3 |
| Sistema de trial | ✅ | 3/3 |
| Middleware | ✅ | - |
| Páginas UI | ✅ | - |
| Login & password | ✅ | 5/5 |

**FASE 3: 100% COMPLETA** ✅

---

## 🎯 PRÓXIMOS PASOS (FASE 4)

- Panel Admin interno para crear gestores (advisor)
- Rol superadmin
- Verificación de gestores
- Solicitudes de acceso de gestores a tenants
- Aprobación de solicitudes por clientes

---

## 📚 DOCUMENTACIÓN ADICIONAL

- [NextAuth.js v5 Docs](https://authjs.dev)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)

---

**Desarrollado por:** Búfalo Easy Trade, S.L. (CIF: B86634235)
**Sistema:** FLL-SIF
**Fecha:** 17 de diciembre de 2024
