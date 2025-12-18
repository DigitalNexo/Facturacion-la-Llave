# GUÍA DE PRUEBA MANUAL - FASE 4

## Configuración Inicial

### 1. Agregar SUPERADMIN_EMAILS

Edita `/apps/web/.env.local` y agrega:

```env
SUPERADMIN_EMAILS=admin@lallave.com,super@test.com
```

### 2. Reiniciar servidor Next.js

```bash
cd apps/web
npm run dev
```

## Pruebas Manuales

### TEST 1: Acceso al Panel de Admin

1. **Login como usuario normal**
   ```
   Email: test@example.com
   Password: (contraseña de test)
   ```

2. **Intentar acceder a /admin/dashboard**
   - ✅ Debería redirigir a /dashboard (no es superadmin)

3. **Logout**

4. **Login como superadmin**
   ```
   Email: admin@lallave.com
   Password: (contraseña que tengas)
   ```
   
   Si no existe, créalo con:
   ```bash
   npm run db:seed
   # O manualmente en PostgreSQL
   ```

5. **Navegar a /admin/dashboard**
   - ✅ Debería mostrar el panel con estadísticas
   - ✅ Debería ver 4 tarjetas: Total Accounts, Advisors, Verified, Pending Requests

### TEST 2: Crear Advisor

1. **En /admin/dashboard, click en "Create Advisor"**

2. **Llenar formulario:**
   ```
   Nombre: Juan Pérez
   Email: advisor1@test.com
   Contraseña: Advisor123!
   Empresa: Asesoría Pérez S.L.
   CIF: B12345678
   Número profesional: COL-98765
   ```

3. **Submit**
   - ✅ Debería redirigir a /admin/dashboard
   - ✅ Advisor debería aparecer en la lista de "Recent Advisors"
   - ✅ Badge debería mostrar "Not Verified" (naranja)

### TEST 3: Verificar Advisor

1. **En /admin/dashboard, buscar el advisor creado**

2. **Click en botón "Verify"**
   - ✅ Debería cambiar a "Verified" (verde)
   - ✅ Estadística "Verified Advisors" debería incrementar

3. **Click en "Revoke Verification"**
   - ✅ Debería volver a "Not Verified"
   - ✅ Estadística debería decrementar

### TEST 4: Gestionar Solicitudes de Acceso

#### Crear solicitud de prueba (desde psql o Prisma Studio):

```sql
-- Primero crear un Tenant de prueba si no existe
INSERT INTO tenants (id, account_id, business_name, tax_id, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM accounts WHERE account_type = 'autonomo' LIMIT 1),
  'Empresa Test',
  'B87654321',
  NOW(),
  NOW()
);

-- Crear AccessRequest
INSERT INTO access_requests (
  id,
  requester_id,
  tenant_id,
  status,
  message,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'advisor1@test.com'),
  (SELECT id FROM tenants WHERE business_name = 'Empresa Test'),
  'pending',
  'Solicito acceso para gestionar facturación',
  NOW(),
  NOW()
);
```

#### Probar aprobación:

1. **Recargar /admin/dashboard**
   - ✅ Debería aparecer la solicitud en "Pending Access Requests"

2. **Click en "Approve"**
   - ✅ Solicitud debería desaparecer de la lista
   - ✅ Debería crear entrada en tenant_access

3. **Verificar en base de datos:**
   ```sql
   SELECT * FROM tenant_access WHERE user_id = (
     SELECT id FROM users WHERE email = 'advisor1@test.com'
   );
   ```
   - ✅ Debería existir el registro

#### Probar rechazo:

1. **Crear otra solicitud de prueba**

2. **Click en "Reject"**
   - ✅ Solicitud debería desaparecer
   - ✅ Status en BD debería ser 'rejected'

### TEST 5: API Endpoints (con curl)

#### Listar Advisors (GET)

```bash
# Obtener session token primero (login)
curl -X GET http://localhost:3000/api/admin/advisors \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Respuesta esperada:**
```json
{
  "advisors": [
    {
      "id": "...",
      "email": "advisor1@test.com",
      "accountType": "advisor",
      "status": "active",
      "profile": {
        "isVerified": false,
        "companyName": "Asesoría Pérez S.L.",
        ...
      }
    }
  ],
  "total": 1
}
```

#### Crear Advisor (POST)

```bash
curl -X POST http://localhost:3000/api/admin/advisors \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "advisor2@test.com",
    "password": "Advisor456!",
    "name": "María García",
    "companyName": "Asesoría García",
    "taxId": "B11111111"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Advisor creado exitosamente",
  "advisorId": "..."
}
```

#### Verificar Advisor (PUT)

```bash
curl -X PUT http://localhost:3000/api/admin/advisors/ADVISOR_ID/verify \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Respuesta esperada:**
```json
{
  "message": "Advisor verificado exitosamente",
  "isVerified": true,
  "verifiedAt": "2024-01-15T10:30:00.000Z",
  "verifiedBy": "admin@lallave.com"
}
```

#### Listar Solicitudes (GET)

```bash
curl -X GET "http://localhost:3000/api/admin/access-requests?status=pending" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

#### Aprobar Solicitud (POST)

```bash
curl -X POST http://localhost:3000/api/admin/access-requests/REQUEST_ID/approve \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

#### Rechazar Solicitud (POST)

```bash
curl -X POST http://localhost:3000/api/admin/access-requests/REQUEST_ID/reject \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "reason": "No cumple requisitos"
  }'
```

### TEST 6: Middleware Protection

1. **Logout**

2. **Intentar acceder directamente a:**
   - http://localhost:3000/admin/dashboard
   - ✅ Debería redirigir a /login

3. **Login como usuario no-superadmin**

4. **Intentar acceder a /admin/dashboard**
   - ✅ Debería redirigir a /dashboard

5. **Intentar llamar API:**
   ```bash
   curl -X GET http://localhost:3000/api/admin/advisors
   ```
   - ✅ Debería retornar 401 (no autenticado) o 403 (no superadmin)

## Checklist de Validación

- [ ] Middleware protege rutas /admin/*
- [ ] Solo superadmins pueden acceder al panel
- [ ] Dashboard muestra estadísticas correctas
- [ ] Crear advisor funciona y genera cuenta completa
- [ ] Verificar/revocar advisor actualiza correctamente
- [ ] Listar solicitudes muestra datos correctos
- [ ] Aprobar solicitud crea TenantAccess
- [ ] Rechazar solicitud guarda motivo
- [ ] Usuarios normales reciben 403 en API
- [ ] Usuarios no autenticados reciben 401
- [ ] Formulario de crear advisor valida campos
- [ ] Advisor creado tiene mustChangePassword=true
- [ ] Advisor creado tiene isBillingEnabled=false
- [ ] Advisor creado no está verificado inicialmente

## Debugging

### Ver logs de servidor:
```bash
# Terminal donde corre npm run dev
# Buscar errores de autenticación o Prisma
```

### Ver datos en BD:
```bash
# Conectar a PostgreSQL
docker exec -it fll-postgres psql -U postgres -d fll_db

# Queries útiles:
SELECT * FROM accounts WHERE account_type = 'advisor';
SELECT * FROM advisor_profiles;
SELECT * FROM access_requests;
SELECT * FROM tenant_access;
```

### Limpiar datos de prueba:
```bash
npm run db:reset
npm run db:seed
```

## Problemas Comunes

### "Not authenticated"
- Verificar que estás logueado
- Verificar cookie de sesión

### "Forbidden"
- Verificar que tu email está en SUPERADMIN_EMAILS
- Verificar que reiniciaste el servidor después de cambiar .env.local

### "Advisor already exists"
- Email ya está en uso
- Usar otro email o eliminar el advisor existente

### "Access request not found"
- ID incorrecto
- Solicitud ya fue procesada

### Errores de TypeScript
- Ejecutar: `npm run build` para ver errores de compilación
- Revisar imports y tipos
