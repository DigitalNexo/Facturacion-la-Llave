# ⚠️ DOCUMENTO OBLIGATORIO DE CUMPLIMIENTO

## FACTURACIÓN LA LLAVE

> **ESTE ARCHIVO ES DE CUMPLIMIENTO OBLIGATORIO Y PRIORITARIO**
> Todo el código, arquitectura, base de datos, lógica de negocio, tests y despliegues del proyecto **Facturación La Llave** DEBEN cumplir estrictamente este documento.
>
> ❌ No se permiten atajos
> ❌ No se permiten interpretaciones libres
> ❌ No se permite ignorar ningún punto
>
> En caso de conflicto:
> **Este documento prevalece sobre cualquier otro archivo o decisión técnica.**

---

## 1. IDENTIDAD DEL SOFTWARE

### 1.1 Nombre e identificación

* **Nombre comercial:** Facturación La Llave
* **ID técnico del sistema:** `FLL-SIF`
* **Tipo:** Sistema Informático de Facturación (SIF)
* **Estado:** 100% preparado para VERI*FACTU

### 1.2 Productor del software

* **Empresa:** Búfalo Easy Trade, S.L.
* **CIF:** B86634235
* **Rol:** Productor y responsable legal del software ante la AEAT

---

## 2. STACK TECNOLÓGICO (OBLIGATORIO)

### 2.1 Stack elegido

* **Framework:** Next.js (Frontend + Backend)
* **Lenguaje:** TypeScript
* **Base de datos:** PostgreSQL
* **ORM:** Prisma
* **Pagos:** Stripe (suscripciones)
* **Autenticación:** Email + contraseña (hash seguro)
* **Tests:** Obligatorios (Jest o Vitest)
* **Infraestructura:** Dockerizable

❌ No se permite cambiar este stack sin modificar este documento.

---

## 3. NORMATIVA LEGAL DE OBLIGADO CUMPLIMIENTO

El sistema debe cumplir **desde el primer día**, aunque ciertas funciones estén desactivadas.

### 3.1 Normativa aplicable

* Real Decreto 1007/2023 (RRSIF)
* Orden HAC/1177/2024
* Especificaciones técnicas VERI*FACTU (AEAT)
* Ley General Tributaria

### 3.2 Principios obligatorios

El sistema debe garantizar:

* Integridad
* Inalterabilidad
* Trazabilidad
* Conservación
* Legibilidad
* Accesibilidad para inspección

Estos principios **no son configurables**.

---

## 4. MODELO DE CUENTAS Y USUARIOS

### 4.1 Tipos de cuenta (`accounts.account_type`)

* `self_employed` → Autónomo
* `company` → Empresa
* `advisor` → Asesor / Gestor

### 4.2 Registro público

* ❌ Prohibido el registro público de gestores
* ✅ Solo pueden registrarse autónomos y empresas

### 4.3 Gestores

* Los gestores:

  * Son creados exclusivamente por Búfalo Easy Trade
  * No pagan
  * No tienen trial
  * Requieren validación interna
  * Tienen login creado manualmente

---

## 5. TRIAL Y BLOQUEO DE ACCESO

### 5.1 Trial obligatorio

* Autónomos y empresas disponen de **15 días exactos** de prueba
* `trial_ends_at = created_at + 15 días`

### 5.2 Fin del trial

Si al finalizar el trial no hay pago activo:

* ❌ Login completamente bloqueado
* ❌ No se permite acceso a ningún dato
* ❌ No se permite descarga ni exportación

Estado de la cuenta:

* `status = blocked`
* `blocked_reason = trial_expired`

NO existe modo lectura tras el trial.

---

## 6. PAGOS Y STRIPE

### 6.1 Autoridad única

* Stripe es la única fuente de verdad del estado de pago

### 6.2 Estados válidos de cuenta

* `trialing`
* `active`
* `past_due`
* `canceled`
* `blocked`

### 6.3 Acceso

* Solo las cuentas en estado `active` pueden iniciar sesión

---

## 7. PLANES DE SUSCRIPCIÓN

### 7.1 Plan AUTÓNOMO

* **Precio orientativo:** 15 €/mes
* 1 empresa (obligatorio)
* 1 usuario
* Hasta 150 facturas/mes
* RRSIF completo
* VERI*FACTU preparado

---

### 7.2 Plan EMPRESA BASIC

* **Precio orientativo:** 29 €/mes
* 1 empresa
* Hasta 3 usuarios
* Hasta 500 facturas/mes
* 1 gestor externo

---

### 7.3 Plan EMPRESA PRO

* **Precio orientativo:** 49 €/mes
* Hasta 5 empresas
* Hasta 10 usuarios
* Facturas ilimitadas
* Gestores ilimitados

---

### 7.4 Plan ASESORÍAS / AGENCIAS

* **Precio orientativo:** 79 €/mes
* Empresas ilimitadas
* Usuarios ilimitados
* Facturas ilimitadas

---

## 8. MULTIEMPRESA (TENANTS)

* Autónomos: máximo 1 empresa
* Empresas: según límite del plan

Validación obligatoria en backend y base de datos.

---

## 9. FACTURACIÓN (REGLAS INMUTABLES)

* Numeración correlativa
* Series configurables
* ❌ Prohibido borrar facturas
* ❌ Prohibido editar facturas emitidas

Correcciones solo mediante:

* Factura rectificativa
* Registro de anulación

---

## 10. REGISTRO DE FACTURACIÓN (RRSIF)

* Registro obligatorio por cada acción
* Alta / Rectificación / Anulación
* Cadena hash encadenada
* Hash propio + hash anterior

Romper la cadena = incumplimiento legal.

---

## 11. VERI*FACTU (PREPARACIÓN OBLIGATORIA)

* Módulo de envío AEAT desacoplado
* Cola de envíos
* Estados: `pending`, `sent`, `error`
* Activable sin reprogramar

---

## 12. PERMISOS DE GESTOR

El cliente decide los permisos.

Permisos posibles:

* Leer facturas
* Descargar PDF
* Crear borradores
* Editar borradores
* Emitir facturas
* Rectificar / Anular
* Gestionar clientes
* Gestionar series
* Exportar datos

---

## 13. AUDITORÍA

* Todas las acciones se registran
* Quién, qué, cuándo, desde dónde
* Logs inmutables

---

## 14. DOCUMENTACIÓN LEGAL OBLIGATORIA

El sistema debe disponer de:

* Declaración responsable del productor
* Manual de uso
* Identificación del sistema y versión
* Política de conservación

---

## 15. PROHIBICIONES ABSOLUTAS

* ❌ Borrar facturas
* ❌ Editar facturas emitidas
* ❌ Acceder sin pago
* ❌ Registro público de gestores
* ❌ Saltarse numeración

---

## 16. PRIORIDAD NORMATIVA

1. Este documento
2. Normativa AEAT
3. Código
4. Interfaz

---

## 17. USO OBLIGATORIO POR IA / COPILOT

Este archivo:

* Debe leerse antes de generar código
* Es obligatorio para backend, frontend, BD y tests
* No puede ignorarse bajo ningún concepto

---

## FIN DEL DOCUMENTO OBLIGATORIO
