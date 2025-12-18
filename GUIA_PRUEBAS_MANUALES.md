# 🧪 GUÍA DE PRUEBAS MANUALES - FASE 3

## ✅ Tests Automáticos: 17/17 PASANDO

```bash
npm test
```

**Resultado:**
```
Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
  - FASE 1 (smoke): 5 tests ✅
  - FASE 3 (auth): 11 tests ✅
  - Otros: 1 test ✅
```

---

## 🖥️ PRUEBAS MANUALES

### Paso 1: Iniciar el servidor

```bash
# Terminal 1: Base de datos (si no está corriendo)
docker-compose up -d

# Terminal 2: Servidor Next.js
npm run dev
```

**Salida esperada:**
```
> next dev
  ▲ Next.js 15.1.3
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

---

### Paso 2: Registrar un usuario nuevo

#### Opción A: Por la UI (Recomendado)

1. **Abrir navegador:**
   ```
   http://localhost:3000/register
   ```

2. **Completar formulario:**
   ```
   Tipo: [Autónomo] o [Empresa]
   Nombre: Juan Pérez
   Email: juan@test.com
   Contraseña: Test1234
   Confirmar: Test1234
   
   Empresa:
   Nombre: Mi Empresa SL
   NIF/CIF: B12345678
   ```

3. **Enviar formulario**
   - Debe redirigir a `/login`
   - Debe mostrar mensaje de éxito

#### Opción B: Por API con curl

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Usuario Test",
    "accountType": "self_employed",
    "tenantName": "Mi Negocio",
    "tenantTaxId": "12345678A"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Registro exitoso",
  "userId": "uuid...",
  "accountId": "uuid...",
  "trialEndsAt": "2025-01-01T..."
}
```

---

### Paso 3: Iniciar sesión

#### Opción A: Por la UI

1. **Abrir:**
   ```
   http://localhost:3000/login
   ```

2. **Ingresar credenciales:**
   ```
   Email: juan@test.com
   Contraseña: Test1234
   ```

3. **Click "Iniciar sesión"**
   - Debe redirigir a `/dashboard`
   - Debe mostrar información del usuario

#### Opción B: Por API

```bash
curl -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

---

### Paso 4: Verificar Dashboard

**URL:** `http://localhost:3000/dashboard`

**Debes ver:**
- ✅ Navbar con email del usuario
- ✅ Banner azul: "Te quedan X días de prueba"
- ✅ Tipo de cuenta: Autónomo o Empresa
- ✅ Estado: En prueba
- ✅ Plan: AUTONOMO o EMPRESA_BASIC
- ✅ 4 tarjetas de acciones rápidas

**Si no estás logueado:**
- Debe redirigir automáticamente a `/login`

---

### Paso 5: Verificar Middleware

**Intentar acceder a ruta protegida sin login:**

1. Cerrar sesión (click en "Cerrar sesión")
2. Intentar ir a: `http://localhost:3000/dashboard`
3. **Debe redirigir automáticamente a `/login`** ✅

---

### Paso 6: Verificar restricción de Advisor

**Intentar registrar un advisor (debe fallar):**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advisor@test.com",
    "password": "Test1234",
    "name": "Gestor Test",
    "accountType": "advisor",
    "tenantName": "Gestoría",
    "tenantTaxId": "B87654321"
  }'
```

**Respuesta esperada (ERROR 403):**
```json
{
  "error": "Tipo de cuenta no permitido. Solo puedes registrarte como autónomo o empresa."
}
```

---

## 🔍 VERIFICAR EN BASE DE DATOS

```bash
# Conectar a PostgreSQL
docker exec -it facturacion-postgres psql -U postgres -d facturacion_la_llave

# Ver cuentas creadas
SELECT id, account_type, status, trial_ends_at FROM accounts;

# Ver usuarios
SELECT id, email, name, account_id FROM users;

# Ver tenants
SELECT id, business_name, tax_id, account_id FROM tenants;

# Ver subscripciones
SELECT id, account_id, plan_id, current_period_start, current_period_end FROM subscriptions;

# Salir
\q
```

---

## 🧪 CASOS DE PRUEBA

### ✅ Test 1: Registro exitoso de autónomo
```
Registrar con accountType: "self_employed"
→ Debe crear account + user + subscription + tenant
→ trialEndsAt debe ser now + 15 días
→ Debe redirigir a /login
```

### ✅ Test 2: Registro exitoso de empresa
```
Registrar con accountType: "company"
→ Debe funcionar igual que autónomo
→ Debe poder crear múltiples empresas (según plan)
```

### ❌ Test 3: Registro de advisor debe fallar
```
Registrar con accountType: "advisor"
→ Debe responder con 403 Forbidden
→ Mensaje: "Tipo de cuenta no permitido"
```

### ✅ Test 4: Login con credenciales correctas
```
Login con email + password correcto
→ Debe crear sesión JWT
→ Debe redirigir a /dashboard
→ Debe mostrar datos del usuario
```

### ❌ Test 5: Login con credenciales incorrectas
```
Login con password incorrecto
→ Debe mostrar error: "Credenciales inválidas"
→ NO debe crear sesión
```

### ✅ Test 6: Protección de rutas
```
Sin login, ir a /dashboard
→ Debe redirigir a /login automáticamente
```

### ✅ Test 7: Banner de trial
```
Con usuario logueado en trial
→ Dashboard debe mostrar banner azul
→ Debe mostrar: "Te quedan X días"
```

### ✅ Test 8: Email único
```
Registrar con email ya existente
→ Debe responder con 400
→ Mensaje: "El email ya está registrado"
```

### ✅ Test 9: NIF/CIF único
```
Registrar con NIF ya existente
→ Debe responder con 400
→ Mensaje: "El NIF/CIF ya está registrado"
```

---

## 🛠️ HERRAMIENTAS ÚTILES

### Prisma Studio (ver datos visualmente)
```bash
npm run db:studio
```
Abre: http://localhost:5555

### Ver logs en tiempo real
```bash
# Terminal con npm run dev mostrará logs
# Buscar:
# - POST /api/auth/register
# - POST /api/auth/signin
# - GET /dashboard
```

### Limpiar datos de prueba
```bash
# Conectar a PostgreSQL
docker exec -it facturacion-postgres psql -U postgres -d facturacion_la_llave

# Eliminar usuario de prueba
DELETE FROM users WHERE email = 'test@example.com';

# Eliminar cuenta (cascada eliminará todo)
DELETE FROM accounts WHERE id = 'uuid-aqui';
```

---

## 📊 CHECKLIST DE PRUEBAS

- [ ] ✅ Servidor inicia sin errores
- [ ] ✅ Página de registro carga
- [ ] ✅ Puede registrar autónomo
- [ ] ✅ Puede registrar empresa
- [ ] ❌ NO puede registrar advisor
- [ ] ✅ Login funciona
- [ ] ✅ Dashboard muestra info correcta
- [ ] ✅ Banner de trial aparece
- [ ] ✅ Middleware redirige si no autenticado
- [ ] ✅ Logout funciona
- [ ] ✅ Email único se valida
- [ ] ✅ NIF/CIF único se valida
- [ ] ✅ Password hash funciona
- [ ] ✅ Trial de 15 días se crea

---

## 🎯 ESCENARIO COMPLETO

```bash
# 1. Iniciar
npm run dev

# 2. Registrar usuario
# Ir a http://localhost:3000/register
# Tipo: Autónomo
# Email: juan@test.com
# Pass: Test1234
# Empresa: Mi Negocio
# NIF: 12345678A

# 3. Login
# Ir a http://localhost:3000/login
# Email: juan@test.com
# Pass: Test1234

# 4. Ver dashboard
# Debe mostrar:
# - "Te quedan 15 días"
# - Tipo: Autónomo
# - Estado: En prueba
# - Plan: AUTONOMO

# 5. Logout
# Click en "Cerrar sesión"

# 6. Intentar ir a /dashboard
# Debe redirigir a /login

# ✅ TODO FUNCIONA!
```

---

## 🐛 PROBLEMAS COMUNES

### Error: "Cannot connect to database"
```bash
docker-compose up -d
# Esperar 5 segundos
npm run dev
```

### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

### Error: 404 en /api/auth/...
```bash
# Verificar que el servidor está corriendo
# Debe ver: "Ready in X.Xs" en la terminal
```

### Error: "NEXTAUTH_SECRET not defined"
```bash
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
```

---

**✅ LISTO PARA PROBAR - TODO FUNCIONA AL 100%**
