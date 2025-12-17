# Facturación La Llave (FLL-SIF)

> Sistema Informático de Facturación 100% preparado para VERI*FACTU

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-development-yellow.svg)]()
[![Compliance](https://img.shields.io/badge/RRSIF-compliant-green.svg)]()
[![VERI*FACTU](https://img.shields.io/badge/VERI*FACTU-ready-blue.svg)]()

---

## 📋 Descripción

**Facturación La Llave** es un Sistema Informático de Facturación (SIF) SaaS desarrollado por **Búfalo Easy Trade, S.L.** que cumple estrictamente con:

- Real Decreto 1007/2023 (Reglamento de los Registros de los Sistemas Informáticos de Facturación - RRSIF)
- Orden HAC/1177/2024
- Especificaciones técnicas VERI*FACTU de la AEAT
- Ley General Tributaria

El sistema garantiza **integridad**, **inalterabilidad**, **trazabilidad**, **conservación**, **legibilidad** y **accesibilidad** de los registros de facturación desde su diseño inicial.

---

## ⚡ Características principales

- ✅ **Cumplimiento legal total**: RRSIF y VERI*FACTU desde el día 1
- 🔒 **Inmutabilidad por diseño**: Las facturas emitidas no se pueden editar ni borrar
- 🔗 **Hash encadenado**: Sistema criptográfico de integridad de registros
- 👥 **Multiempresa y multitenant**: Gestión de múltiples empresas según plan
- 📊 **Gestión de asesores**: Control granular de permisos por tenant
- 💳 **Suscripciones con Stripe**: Trial de 15 días + planes flexibles
- 📝 **Auditoría completa**: Trazabilidad de todas las acciones
- 🚀 **Escalable y modular**: Arquitectura preparada para 2027+

---

## 🛠️ Stack tecnológico

| Componente | Tecnología |
|------------|------------|
| **Framework** | Next.js (App Router) |
| **Lenguaje** | TypeScript (strict mode) |
| **Base de datos** | PostgreSQL |
| **ORM** | Prisma |
| **Autenticación** | NextAuth.js / JWT |
| **Pagos** | Stripe (suscripciones + webhooks) |
| **Testing** | Jest / Vitest |
| **Linting** | ESLint + Prettier |
| **Contenedores** | Docker + Docker Compose |

---

## 📁 Estructura del proyecto

```
facturacion-la-llave/
├── apps/
│   └── web/                    # Next.js app (UI + API Routes)
├── packages/
│   ├── db/                     # Prisma schema + migraciones
│   ├── core/                   # Lógica de negocio (dominio)
│   └── tests/                  # Utilidades de testing
├── docs/
│   ├── manual-usuario.md       # Manual de usuario
│   ├── manual-tecnico.md       # Arquitectura y detalles técnicos
│   └── declaracion-responsable.md
├── FACTURACION_LA_LLAVE_OBLIGATORIO.md  # 🔴 Documento normativo
├── Plan_trabajo_maestro.md     # Plan de desarrollo
└── README.md                   # Este archivo
```

---

## 🚀 Inicio rápido

### Requisitos previos

- Node.js 18+ 
- Docker y Docker Compose
- Cuenta de Stripe (modo test)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DigitalNexo/Facturacion-la-Llave.git
cd Facturacion-la-Llave

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Levantar PostgreSQL
docker-compose up -d

# Ejecutar migraciones
npm run db:migrate

# Sembrar datos iniciales
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

### Scripts disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run lint         # Linter
npm run format       # Formatear código
npm run db:migrate   # Aplicar migraciones
npm run db:seed      # Sembrar datos
npm run db:studio    # Prisma Studio (UI para BD)
```

---

## 🔐 Modelo de usuarios y planes

### Tipos de cuenta

| Tipo | Descripción | Registro público |
|------|-------------|------------------|
| **Autónomo** (`self_employed`) | Trabajador por cuenta propia | ✅ Sí |
| **Empresa** (`company`) | Empresas y sociedades | ✅ Sí |
| **Asesor/Gestor** (`advisor`) | Gestorías y asesorías | ❌ Solo admin interno |

### Planes de suscripción

| Plan | Precio | Empresas | Usuarios | Facturas/mes |
|------|--------|----------|----------|--------------|
| **Autónomo** | 15 €/mes | 1 | 1 | 150 |
| **Empresa Basic** | 29 €/mes | 1 | 3 | 500 |
| **Empresa Pro** | 49 €/mes | 5 | 10 | Ilimitadas |
| **Asesorías** | 79 €/mes | Ilimitadas | Ilimitadas | Ilimitadas |

**Trial:** 15 días exactos. Tras expirar sin pago activo, el acceso se bloquea completamente.

---

## 📜 Cumplimiento normativo

### Principios garantizados

El sistema cumple obligatoriamente con:

- ✅ **Integridad**: Los registros no pueden ser alterados sin detección
- ✅ **Inalterabilidad**: Las facturas emitidas están bloqueadas
- ✅ **Trazabilidad**: Auditoría completa de todas las acciones
- ✅ **Conservación**: Sistema de backups y recuperación
- ✅ **Legibilidad**: Formatos estándar y exportables
- ✅ **Accesibilidad**: Preparado para inspección de la AEAT

### Sistema de registros (RRSIF)

Cada acción de facturación genera un registro legal (`invoice_records`) que incluye:

- Hash criptográfico encadenado (SHA-256)
- Enlace al registro anterior (`prev_hash`)
- Metadatos completos del evento
- Identificación del sistema y versión
- Datos del obligado tributario

**Romper la cadena de hash = incumplimiento legal detectable**

### VERI*FACTU (preparación 2027)

El sistema incluye desde el inicio:

- Módulo de envío a AEAT (desacoplado y activable)
- Cola de envíos con reintentos (`vf_submissions`)
- Feature flag por tenant (`verifactu_mode`)
- Estructura de `record_payload` conforme a especificaciones

**Puede activarse sin reescribir código cuando entre en vigor.**

---

## 🔑 Permisos y gestores

### Sistema de permisos granulares

Los gestores externos pueden tener permisos configurables por tenant:

- `invoices.read` - Ver facturas
- `invoices.download_pdf` - Descargar PDF
- `invoices.create_draft` - Crear borradores
- `invoices.edit_draft` - Editar borradores
- `invoices.issue_lock` - Emitir y bloquear
- `invoices.rectify` - Crear rectificativas
- `invoices.void` - Anular facturas
- `customers.manage` - Gestionar clientes
- `series.manage` - Gestionar series
- `exports.read` - Exportar datos
- `records.read` - Ver registros legales

### Flujo de acceso para gestores

1. Gestor solicita acceso a un tenant cliente
2. Cliente recibe notificación
3. Cliente aprueba/rechaza y asigna permisos
4. Sistema audita toda la operación

---

## 🧪 Testing

El proyecto sigue **Test-Driven Development (TDD)** para funcionalidades críticas:

```bash
# Tests completos
npm run test

# Tests con cobertura
npm run test:coverage

# Tests de núcleo legal (obligatorios)
npm run test:legal

# Tests de integración Stripe
npm run test:stripe
```

### Tests obligatorios por funcionalidad

- ✅ Bloqueo de login tras trial expirado
- ✅ Numeración correlativa de facturas
- ✅ Prohibición de editar facturas emitidas
- ✅ Integridad de hash encadenado
- ✅ Enforcement de permisos
- ✅ Webhooks de Stripe

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [`FACTURACION_LA_LLAVE_OBLIGATORIO.md`]( FACTURACION_LA_LLAVE_OBLIGATORIO.md) | 🔴 **Documento constitucional del proyecto** |
| [`Plan_trabajo_maestro.md`](Plan_trabajo_maestro.md) | Plan de desarrollo por fases |
| `docs/manual-usuario.md` | Guía para usuarios finales |
| `docs/manual-tecnico.md` | Arquitectura y detalles técnicos |
| `docs/declaracion-responsable.md` | DR del productor de software |

---

## ⚠️ Prohibiciones absolutas

El sistema **NUNCA** permite:

- ❌ Borrar facturas emitidas
- ❌ Editar facturas emitidas (solo rectificación)
- ❌ Acceder sin pago activo o trial válido
- ❌ Registro público de gestores
- ❌ Saltarse numeración correlativa
- ❌ Activar cuentas sin webhook de Stripe
- ❌ Romper la cadena de hash de registros

**Cualquier código que intente estas acciones debe ser rechazado.**

---

## 🏢 Información legal

**Productor del software:**
- Empresa: Búfalo Easy Trade, S.L.
- CIF: B86634235
- Rol: Productor y responsable legal ante la AEAT

**Identificación del sistema:**
- Nombre comercial: Facturación La Llave
- ID técnico: `FLL-SIF`
- Versión: [ver releases]
- Estado: 100% preparado para VERI*FACTU

---

## 🤝 Contribución

Este es un proyecto propietario de Búfalo Easy Trade, S.L.

Para desarrollo interno:
1. Lee **obligatoriamente** [`FACTURACION_LA_LLAVE_OBLIGATORIO.md`]( FACTURACION_LA_LLAVE_OBLIGATORIO.md)
2. Sigue el [`Plan_trabajo_maestro.md`](Plan_trabajo_maestro.md)
3. Todo cambio requiere tests
4. Todo código debe pasar lint + format
5. Las PR requieren revisión de cumplimiento

---

## 📞 Soporte

Para soporte técnico o consultas comerciales:
- Web: [próximamente]
- Email: [próximamente]

---

## 📄 Licencia

Copyright © 2025 Búfalo Easy Trade, S.L. Todos los derechos reservados.

Este software es propietario y está protegido por las leyes de propiedad intelectual.

---

<p align="center">
  <strong>Desarrollado con ❤️ en España</strong><br>
  100% compliant con normativa española de facturación
</p>