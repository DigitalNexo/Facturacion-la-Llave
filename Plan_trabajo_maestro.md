# Plan de trabajo maestro (OBLIGATORIO)

## Proyecto: Facturación La Llave (FLL-SIF)

> ⚠️ **OBLIGATORIO**: Este plan debe seguirse paso a paso.
> ⚠️ **OBLIGATORIO**: Todo desarrollo debe respetar `FACTURACION_LA_LLAVE_OBLIGATORIO.md`.
> ⚠️ **OBLIGATORIO**: Si hay conflicto, prevalece el documento de cumplimiento.

---

## 0) Principios de ejecución (no negociables)

1. **Primero cumplimiento, luego producto.** Ninguna pantalla “bonita” se construye si el núcleo legal no está cerrado con tests.
2. **Todo cambio requiere test.** Si se añade una funcionalidad, se añade un test que la proteja.
3. **Fuente de verdad del cobro = Stripe + Webhooks.** Nunca “activar manualmente”.
4. **Trial 15 días exactos y bloqueo total.** Tras expirar sin pago: **no se puede iniciar sesión**.
5. **Gestores (advisor) no se registran.** Se crean exclusivamente por admin interno.
6. **Inmutabilidad por diseño.** Facturas emitidas: NO se editan ni se borran. Solo se rectifican.
7. **Preparado 2027 desde hoy.** La estructura de registros y el módulo de envío VERI*FACTU existen desde el inicio (aunque estén desactivados).

---

## 1) Estructura del repositorio (obligatoria)

Repositorio: `facturacion-la-llave`

* `/apps/web` → Next.js (UI + API Routes)
* `/packages/db` → Prisma schema + migraciones
* `/packages/core` → lógica de negocio (dominio) reutilizable
* `/packages/tests` → utilidades de test (fixtures, helpers)
* `/docs` → documentación operativa (manual, DR, arquitectura)
* `FACTURACION_LA_LLAVE_OBLIGATORIO.md` → constitución del proyecto
* `PLAN_DE_TRABAJO_FACTURACION_LA_LLAVE.md` → este plan

Convenciones:

* TypeScript estricto (`strict: true`)
* Lint + format (ESLint + Prettier)
* Commits pequeños y descriptivos

---

## 2) Definición de “hecho” (Definition of Done)

Una tarea se considera **hecha** SOLO si:

* (A) Código implementado
* (B) Tests automáticos añadidos y pasando
* (C) Validaciones de seguridad aplicadas
* (D) Revisión manual rápida (checklist)
* (E) Documentación mínima actualizada si aplica

---

## 3) Plan de trabajo por fases (detallado)

### FASE 1 — Arranque del proyecto (Semana 1)

#### 1.1 Crear proyecto base

**Objetivo:** repositorio listo para desarrollar con estándares.

Checklist:

* [ ] Crear repo `facturacion-la-llave`
* [ ] Crear Next.js app con TypeScript en `/apps/web`
* [ ] Configurar ESLint + Prettier
* [ ] Configurar variables de entorno (`.env.example`)
* [ ] Añadir scripts estándar:

  * `dev`, `build`, `start`
  * `test`, `test:watch`
  * `lint`, `format`

Entregables:

* Repo compila
* Tests mínimos corren

#### 1.2 PostgreSQL + Prisma

**Objetivo:** base de datos lista con migraciones.

Checklist:

* [ ] Docker Compose con Postgres (dev)
* [ ] Prisma inicializado en `/packages/db`
* [ ] Conexión desde `/apps/web`
* [ ] Migración inicial vacía aplicada

Entregables:

* `prisma migrate dev` funciona
* Healthcheck de BD

#### 1.3 Test harness

**Objetivo:** poder testear servicios y API.

Checklist:

* [ ] Jest o Vitest configurado
* [ ] Utilidad para BD de test (reset por suite)
* [ ] Primer test “smoke”

---

### FASE 2 — Modelo de dominio y base de datos “2027-ready” (Semana 2)

> ⚠️ Esta fase define la base. No avanzar a UI sin completar.

#### 2.1 Modelos (Prisma) obligatorios

Crear tablas (mínimo):

* `accounts` (self_employed, company, advisor)
* `plans`
* `subscriptions`
* `users`
* `tenants`
* `customers`
* `invoice_series`
* `invoices`
* `invoice_lines`
* `invoice_records` (registro legal + hash encadenado)
* `vf_submissions` (cola envío AEAT)
* `audit_events`
* `permission_sets`
* `tenant_access`
* `access_requests`
* `advisor_profiles` (verificación de gestor)
* `usage_counters`

Checklist por tabla:

* [ ] PK UUID
* [ ] Índices en campos de consulta
* [ ] Uniques críticos (series + number, tenant+tax_id, etc.)
* [ ] Campos de auditoría (`created_at`, `updated_at`) donde aplique

#### 2.2 Reglas de integridad (BD + backend)

* [ ] Autónomo: máx 1 tenant
* [ ] Empresa: tenants según plan
* [ ] Gestor: sin billing

Implementación:

* (obligatorio) validación en backend
* (recomendado) trigger/constraint en BD para blindaje

#### 2.3 Seeds de planes

Crear planes “buenos” (no excesivos) y sembrarlos:

* **AUTÓNOMO**

  * max_tenants: 1
  * max_users: 1
  * max_invoices_per_month: 150
  * max_storage_mb: 1024

* **EMPRESA 1**

  * max_tenants: 1
  * max_users: 3
  * max_invoices_per_month: 500
  * max_storage_mb: 4096

* **EMPRESA MULTI**

  * max_tenants: 5
  * max_users: 10
  * max_invoices_per_month: null (ilimitado)
  * max_storage_mb: 20480

* **AGENCIA**

  * max_tenants: null (ilimitado)
  * max_users: null (ilimitado)
  * max_invoices_per_month: null
  * max_storage_mb: null

Notas:

* Estos límites se aplican SIEMPRE en backend.
* Los precios se gestionan en Stripe; aquí solo informativo.

Tests obligatorios:

* [ ] No se pueden crear 2 tenants en `self_employed`
* [ ] No se puede superar `max_tenants` en `company`

---

### FASE 3 — Autenticación, trial y bloqueo total (Semana 3)

#### 3.1 Registro permitido SOLO para autónomo/empresa

API/UI:

* Registro pide:

  * Email
  * Password
  * Tipo: `self_employed` o `company`
  * Datos básicos fiscales del pagador

Reglas:

* [ ] Prohibido registrar `advisor`

#### 3.2 Trial 15 días exactos

Al registrar:

* `accounts.status = trialing`
* `trial_ends_at = now + 15 days`

#### 3.3 Bloqueo total

Regla:

* Si `now > trial_ends_at` y `status != active` → login denegado y `status = blocked`

Implementación:

* Middleware de autenticación que, tras validar credenciales:

  * Revisa `accounts.status`
  * Si no es `active` → deniega
  * Si es `trialing` → permite solo hasta `trial_ends_at`

Tests obligatorios:

* [ ] Al día 16 sin pago: no inicia sesión
* [ ] Con `active`: inicia sesión

---

### FASE 4 — Panel Admin interno (gestores) (Semana 4)

> Admin interno: solo Búfalo Easy Trade.

#### 4.1 Rol superadmin

* Crear un usuario superadmin en seed / configuración segura.
* Acceso por lista blanca (env var) o por flag en BD.

#### 4.2 Crear gestor (advisor) desde admin

Flujo:

* Admin crea:

  * `account (advisor)` con `status=active`, `is_billing_enabled=false`
  * `advisor_profiles` con datos y verificación
  * `user` con `must_change_password=true`

#### 4.3 Solicitudes de acceso

* Gestor (ya creado) puede solicitar acceso a un tenant
* Cliente aprueba y asigna `permission_set`

Tests obligatorios:

* [ ] No existe endpoint de registro público de advisor
* [ ] Solo admin puede crear advisor

---

### FASE 5 — Permisos (RBAC) por tenant (Semana 5)

#### 5.1 Lista de permisos (definitiva)

Permisos mínimos (no exceder ~15):

* `invoices.read`
* `invoices.download_pdf`
* `invoices.create_draft`
* `invoices.edit_draft`
* `invoices.issue_lock`
* `invoices.rectify`
* `invoices.void`
* `customers.manage`
* `series.manage`
* `exports.read`
* `records.read`

#### 5.2 permission_sets

* Crear sets por defecto por tenant:

  * Solo lectura
  * Puede facturar (borrador + emitir)
  * Completo

#### 5.3 Enforcement

* Middleware `requirePermission(tenantId, perm)`
* Todas las rutas sensibles lo usan

Tests obligatorios:

* [ ] Gestor con solo lectura no puede emitir
* [ ] Usuario sin acceso no puede ver tenant

---

### FASE 6 — Núcleo de facturación (Semana 6)

> ⚠️ Aquí nace el corazón legal. No se avanza si no está blindado.

#### 6.1 Series y numeración correlativa

* Crear/gestionar series
* Al emitir factura:

  * Reservar número
  * Garantizar unique

Tests obligatorios:

* [ ] No hay duplicados
* [ ] No se puede emitir sin serie

#### 6.2 Borrador vs Emitida

Estados:

* `draft` (editable)
* `issued` (bloqueada)
* `rectified` / `voided` (según flujo)

Reglas:

* `issued` → `locked_at` no null
* Si `locked_at` no null: edición prohibida

Tests obligatorios:

* [ ] Editar emitida falla
* [ ] Borrar emitida falla

#### 6.3 PDF

* Generar PDF determinista de factura emitida
* Guardar referencia (ruta/sha) si aplica

---

### FASE 7 — Registro legal (invoice_records) + hash encadenado (Semana 7)

#### 7.1 Estructura del record_payload

* Definir `record_payload` conforme a especificación
* Incluir identificación:

  * `product_name`, `product_id`, `version`, `producer_tax_id`
  * `tenant_tax_id` del obligado

#### 7.2 Hash encadenado

* Para cada registro:

  * `prev_hash`
  * `hash` calculado sobre payload + metadatos
* Guardar `prev_record_id`

Tests obligatorios:

* [ ] Cadena correcta
* [ ] Si se altera payload en BD, hash no cuadra (test de integridad)

#### 7.3 Registros de evento (si aplica)

* Registrar eventos relevantes (login, cambios de permisos, etc.)

---

### FASE 8 — VERI*FACTU módulo de envío (desactivado) (Semana 8)

> Objetivo: que exista la infraestructura y se pueda activar en 2027 sin reescribir.

#### 8.1 Feature flag

* `tenants.verifactu_mode` = `disabled | enabled`

#### 8.2 Cola de envíos

* Cada `invoice_record` genera `vf_submissions` en `pending` si modo enabled
* Worker (cron) reintenta `error` hasta N veces

#### 8.3 Separación por obligado

* Un envío (lote) solo incluye registros de un mismo `tenant_tax_id`

Tests obligatorios:

* [ ] En disabled no crea submissions
* [ ] En enabled crea submissions

---

### FASE 9 — Stripe Suscripciones + Webhooks (Semana 9)

#### 9.1 Checkout

* Página de planes
* Crear Stripe Checkout Session

#### 9.2 Webhooks (OBLIGATORIO)

* Verificar firma de webhook
* Mapear eventos a BD:

  * subscription active → `accounts.status=active`
  * payment_failed / canceled → bloquear

#### 9.3 Acceso condicionado

* Login permite solo `active` (o trial no expirado)

Tests obligatorios:

* [ ] Simulación de webhook activa cuenta
* [ ] Al cancelarse se bloquea

---

### FASE 10 — UX MVP completo (Semana 10)

Pantallas mínimas:

* Registro + login
* Onboarding:

  * crear tenant (si allowed)
  * crear serie
  * crear primer cliente
* Facturas:

  * listado
  * crear borrador
  * emitir
  * descargar PDF
* Gestión acceso gestor:

  * solicitudes
  * aprobar/rechazar
  * asignar permisos
* Admin interno:

  * crear gestor

---

### FASE 11 — Seguridad y cumplimiento operativo (Semana 11)

#### 11.1 Seguridad técnica

* Rate limiting en login
* Hash de password (bcrypt/argon2)
* CSRF (según arquitectura)
* Validación de inputs (zod)

#### 11.2 Backups

* Política de backups (dev/staging/prod)
* Restore probado

#### 11.3 Observabilidad

* Logs de app
* Tracking de errores

---

### FASE 12 — Documentación legal y paquete de inspección (Semana 12)

#### 12.1 Declaración Responsable (DR)

* Crear DR del sistema conforme a Orden HAC/1177/2024
* Guardar:

  * plantilla
  * versión firmada

#### 12.2 Manuales

* Manual usuario
* Manual técnico (arquitectura + BD + hashes)
* Política de conservación

#### 12.3 Evidencias

* Resultados de tests
* Capturas de flujos
* Export de ejemplo

---

### FASE 13 — Beta cerrada y lanzamiento (Semana 13–14)

#### 13.1 Beta

* 5–10 usuarios reales
* Monitorizar:

  * errores
  * fricción UX
  * tiempos

#### 13.2 Hardening

* Ajustes performance
* Cierre de bugs

#### 13.3 Venta

* Landing
* Términos
* Política privacidad
* Stripe live

---

## 4) Checklists obligatorias (rápidas)

### 4.1 Checklist “Registro y Trial”

* [ ] Solo self_employed/company se registran
* [ ] trial_ends_at set + 15 días
* [ ] Bloqueo total en expiración

### 4.2 Checklist “Facturas”

* [ ] No borrar emitidas
* [ ] No editar emitidas
* [ ] Series + correlativo

### 4.3 Checklist “Registro legal”

* [ ] invoice_records siempre se crea al emitir/rectificar/anular
* [ ] Hash encadenado
* [ ] Auditoría de usuario

### 4.4 Checklist “Stripe”

* [ ] Webhooks verificados
* [ ] Estado en BD solo por webhook
* [ ] Acceso solo active

---

## 5) Reglas de trabajo con Copilot (OBLIGATORIO)

1. Antes de pedir código, Copilot debe leer:

   * `FACTURACION_LA_LLAVE_OBLIGATORIO.md`
   * `PLAN_DE_TRABAJO_FACTURACION_LA_LLAVE.md`

2. Cada prompt debe incluir:

   * “Cumple estrictamente los documentos obligatorios.”

3. Cada entrega de Copilot debe incluir:

   * Archivos modificados
   * Tests añadidos
   * Instrucciones para ejecutar

4. No se acepta código sin tests cuando toque núcleo legal, permisos, pagos, auth.

---

## 6) Criterio final de salida a producción (venta)

### 6.1 Condiciones mínimas para vender (OBLIGATORIO)

Se puede **vender** (cobrar suscripciones en producción) SOLO cuando se cumpla todo lo siguiente:

**Acceso y cobro**

* [ ] Registro permitido SOLO para `self_employed` y `company`.
* [ ] Trial de 15 días exactos creado automáticamente (`trial_ends_at`).
* [ ] Bloqueo total tras expiración sin pago: no login, no acceso a nada.
* [ ] Stripe en modo live configurado.
* [ ] Webhooks verificados (firma Stripe) y persistencia en BD.
* [ ] El estado `accounts.status` se actualiza únicamente por webhooks (o proceso automatizado equivalente) y no por acciones manuales.

**Facturación (núcleo de negocio)**

* [ ] Creación de borradores funciona.
* [ ] Emisión/bloqueo (`issue_lock`) funciona.
* [ ] Numeración correlativa por serie garantizada y testeada.
* [ ] Generación de PDF de factura emitida y descarga.

**Cumplimiento (núcleo legal)**

* [ ] Facturas emitidas: NO se borran, NO se editan. Solo rectificación/anulación.
* [ ] `invoice_records` se genera obligatoriamente en emisión/rectificación/anulación.
* [ ] Hash encadenado (`prev_hash` → `hash`) implementado y testeado.
* [ ] Auditoría (`audit_events`) registra acciones clave (login, emisión, permisos, cambios de configuración, etc.).
* [ ] Exportación técnica mínima de evidencias (registros/auditoría) disponible para soporte e inspección.

**Gestores (advisor) y permisos**

* [ ] No existe registro público de gestores.
* [ ] Panel admin interno crea accounts/users de tipo `advisor`.
* [ ] Flujo solicitud → aprobación/rechazo → asignación de permisos funciona.
* [ ] Enforcement real de permisos por tenant (tests por permiso crítico: emitir, rectificar/anular, ver/descargar).

**Preparación VERI*FACTU (2027-ready)**

* [ ] Existe feature flag por tenant (`verifactu_mode`).
* [ ] Existe tabla/cola `vf_submissions`.
* [ ] Worker/cron de reintentos implementado (aunque esté inactivo si `disabled`).
* [ ] Estructura de `record_payload` preparada para envío (sin reescribir el núcleo).

**Operación y seguridad**

* [ ] Backups configurados y restore probado.
* [ ] Observabilidad mínima: logs + tracking de errores.
* [ ] Rate limiting en login y medidas anti-fuerza bruta.
* [ ] Variables secretas gestionadas por entorno (nunca hardcode).

---

### 6.2 “Trámites” y paquete documental (lo que realmente se puede preparar)

> ⚠️ Aclaración importante: no existe un trámite de “aprobación previa” por parte de la AEAT como sello para software. Lo que corresponde es disponer de documentación y **Declaración Responsable** del sistema conforme al marco normativo, y estar en condiciones de aportarla si se requiere.

**Paquete documental mínimo antes de vender a escala**

* [ ] **Declaración Responsable** del productor (Búfalo Easy Trade, S.L., CIF B86634235) lista y versionada.
* [ ] Manual de usuario (emisión, rectificación/anulación, roles, permisos, trial/pago).
* [ ] Manual técnico (arquitectura, BD, hashing, registros, auditoría, backups, despliegue).
* [ ] Identificación del sistema y versionado: `FLL-SIF`, productor, versión, changelog.
* [ ] Política de conservación y copias de seguridad (qué se guarda, dónde, cuánto tiempo, cómo restaurar).
* [ ] Evidencias de pruebas: report de tests, casos críticos y resultados.

**Cumplimiento privacidad (mínimo operativo)**

* [ ] Aviso legal, política de privacidad y cookies (si aplica), y términos del servicio.
* [ ] Registro de tratamientos / acuerdo de encargado (si corresponde, según el rol respecto a los datos).

---

### 6.3 Criterio final de “OK para vender” (gate)

Se considera “OK para vender” cuando:

* [ ] Se completa 6.1 y 6.2.
* [ ] Se ejecuta una beta cerrada con usuarios reales y se corrigen los fallos críticos.
* [ ] Se realiza un checklist de inspección interna (simulación) sobre: numeración, inmutabilidad, registros, hash, auditoría, exportación.

---

## 7) Evaluación honesta del plan

### 7.1 Qué está bien (fortalezas)

* El plan prioriza lo correcto: **cumplimiento + tests antes de UI**.
* Incluye los pilares que más suelen fallar: **bloqueo de edición/borrado**, **hash encadenado**, **auditoría**, **permisos por tenant** y **Stripe con webhooks**.
* Define un camino para estar **"2027-ready"** sin rehacer el núcleo, manteniendo el envío VERI*FACTU como módulo desacoplado.

### 7.2 Qué faltaba / qué he corregido aquí

* El apartado 6 necesitaba estar más “cerrado” como **gate de salida a producción**, con lista completa de condiciones y un bloque explícito de **paquete documental**.
* He añadido un criterio realista de “trámites”: **no es una autorización previa**, sino documentación + declaración responsable + evidencias.

### 7.3 ¿Cuando lleguemos al último paso se puede vender?

**Sí, si se cumplen TODOS los checks del apartado 6** (especialmente los del núcleo legal y los webhooks de Stripe), el producto se puede lanzar y vender como:

* SIF conforme al marco del RRSIF
* y **preparado** para activar VERI*FACTU cuando proceda.

### 7.4 ¿Se puede “empezar a hacer trámites con Hacienda”?

Puedes tener todo el **paquete documental y declaración responsable** preparado y versionado desde el lanzamiento.
Lo que NO existe (y por tanto el plan no puede prometer) es un trámite estándar de “presento esto y AEAT me da un sello/aprobación previa”.

---

## FIN DEL PLAN DE TRABAJO
