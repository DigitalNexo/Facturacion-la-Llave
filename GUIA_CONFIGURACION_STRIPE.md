# 🔥 GUÍA COMPLETA DE CONFIGURACIÓN DE STRIPE
## Sistema de Suscripciones Facturación La Llave

---

## 📋 ÍNDICE

1. [Creación de Cuenta Stripe](#1-creación-de-cuenta-stripe)
2. [Configuración de Productos y Precios](#2-configuración-de-productos-y-precios)
3. [Obtención de API Keys](#3-obtención-de-api-keys)
4. [Configuración de Webhooks](#4-configuración-de-webhooks)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Testing con Stripe CLI](#6-testing-con-stripe-cli)
7. [Verificación Final](#7-verificación-final)
8. [Modo Producción](#8-modo-producción)

---

## 1. CREACIÓN DE CUENTA STRIPE

### Paso 1.1: Registro
1. Ve a: https://dashboard.stripe.com/register
2. Regístrate con tu email empresarial
3. Completa la información de tu empresa:
   - Nombre de la empresa: **Búfalo Easy Trade, S.L.**
   - CIF: **B86634235**
   - País: **España**
   - Tipo de negocio: **SaaS / Software**

### Paso 1.2: Activar Cuenta
1. Completa la verificación de identidad
2. Añade datos bancarios para recibir pagos
3. Acepta los términos de servicio

⚠️ **IMPORTANTE**: Stripe tiene dos modos:
- **Test Mode**: Para desarrollo (usa tarjetas de prueba)
- **Live Mode**: Para producción (dinero real)

---

## 2. CONFIGURACIÓN DE PRODUCTOS Y PRECIOS

### Paso 2.1: Crear Productos
1. Ve a: **Dashboard → Products**
2. Click en **+ Add product**

Crea **4 productos** con esta información:

#### Producto 1: Plan Autónomo
- **Name**: Plan Autónomo
- **Description**: Para autónomos y freelancers
- **Pricing model**: Recurring
- **Price**: 29€ / mes (o el precio que definas)
- **Billing period**: Monthly
- **Currency**: EUR
- Click **Save product**
- ✅ **Copia el Price ID** (empieza con `price_...`)

#### Producto 2: Plan Empresa Basic
- **Name**: Plan Empresa Basic
- **Description**: Para pequeñas empresas
- **Pricing model**: Recurring
- **Price**: 49€ / mes
- **Billing period**: Monthly
- **Currency**: EUR
- Click **Save product**
- ✅ **Copia el Price ID**

#### Producto 3: Plan Empresa Pro
- **Name**: Plan Empresa Pro
- **Description**: Para empresas con alto volumen
- **Pricing model**: Recurring
- **Price**: 99€ / mes
- **Billing period**: Monthly
- **Currency**: EUR
- Click **Save product**
- ✅ **Copia el Price ID**

#### Producto 4: Plan Asesoría
- **Name**: Plan Asesoría
- **Description**: Para asesorías y gestorías
- **Pricing model**: Recurring
- **Price**: 199€ / mes
- **Billing period**: Monthly
- **Currency**: EUR
- Click **Save product**
- ✅ **Copia el Price ID**

### Paso 2.2: Configurar Trial
Para cada producto:
1. Click en el producto
2. Ve a **Pricing**
3. Click en el precio creado
4. **Add trial period**: 15 días
5. Click **Save**

---

## 3. OBTENCIÓN DE API KEYS

### Paso 3.1: API Keys de Test
1. Ve a: **Dashboard → Developers → API keys**
2. Asegúrate de estar en **Test mode** (toggle arriba a la derecha)
3. Verás dos claves:

#### Publishable Key (pk_test_...)
- ✅ **Copia esta clave** (empieza con `pk_test_...`)
- Esta clave va en el **frontend** (es pública)

#### Secret Key (sk_test_...)
- ✅ **Copia esta clave** (empieza con `sk_test_...`)
- Esta clave va en el **backend** (.env) - ⚠️ **NUNCA la expongas**

### Paso 3.2: API Keys de Producción
1. Cambia a **Live mode** (toggle arriba a la derecha)
2. Repite el proceso:
   - ✅ Copia la **Publishable Key** (pk_live_...)
   - ✅ Copia la **Secret Key** (sk_live_...)

⚠️ **CRÍTICO**: Guarda estas claves en un lugar seguro (1Password, Bitwarden, etc.)

---

## 4. CONFIGURACIÓN DE WEBHOOKS

Los webhooks son **CRÍTICOS** para que el sistema funcione. Stripe enviará eventos cuando:
- Un pago se complete
- Una suscripción se cree/actualice/cancele
- Un pago falle

### Paso 4.1: Crear Endpoint de Webhook
1. Ve a: **Dashboard → Developers → Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: 
   - Test: `https://tu-dominio-test.com/api/stripe/webhook`
   - Producción: `https://facturacion-la-llave.com/api/stripe/webhook`

### Paso 4.2: Seleccionar Eventos
Click en **Select events** y añade estos **6 eventos CRÍTICOS**:

```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

### Paso 4.3: Obtener Webhook Secret
1. Después de crear el webhook, verás un **Signing secret**
2. Click en **Reveal** para ver el secret
3. ✅ **Copia el secret** (empieza con `whsec_...`)

⚠️ **MUY IMPORTANTE**: 
- Sin el webhook secret, cualquiera podría enviar eventos falsos
- El sistema verifica la firma criptográfica de cada webhook
- **NUNCA** proceses webhooks sin verificar la firma

---

## 5. VARIABLES DE ENTORNO

### Paso 5.1: Editar .env
Abre el archivo `.env` (copia de `.env.example`) y añade:

```env
# ========================================
# STRIPE CONFIGURACIÓN
# ========================================

# Mode: test o live
STRIPE_MODE="test"

# API Keys (usar test o live según corresponda)
STRIPE_SECRET_KEY="sk_test_51XxXxXx..."
STRIPE_PUBLISHABLE_KEY="pk_test_51XxXxXx..."

# Webhook Secret
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs de productos (copiar del Dashboard)
STRIPE_PLAN_AUTONOMO_PRICE_ID="price_1XxXxXx..."
STRIPE_PLAN_EMPRESA_BASIC_PRICE_ID="price_1XxXxXx..."
STRIPE_PLAN_EMPRESA_PRO_PRICE_ID="price_1XxXxXx..."
STRIPE_PLAN_ASESORIAS_PRICE_ID="price_1XxXxXx..."
```

### Paso 5.2: Verificar Configuración
Ejecuta:
```bash
npx tsx verificar-todas-fases.ts
```

Debe pasar todas las verificaciones de FASE 9.

---

## 6. TESTING CON STRIPE CLI

### Paso 6.1: Instalar Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Windows
scoop install stripe
```

### Paso 6.2: Login
```bash
stripe login
```

Esto abrirá el navegador para autorizar.

### Paso 6.3: Reenviar Webhooks Localmente
Mientras desarrollas en local:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Esto te dará un **webhook secret temporal** (whsec_...) que usarás en `.env.local`.

### Paso 6.4: Probar Eventos
```bash
# Simular checkout completado
stripe trigger checkout.session.completed

# Simular pago exitoso
stripe trigger invoice.payment_succeeded

# Simular pago fallido
stripe trigger invoice.payment_failed
```

### Paso 6.5: Tarjetas de Prueba
En **test mode**, usa estas tarjetas:

```
✅ Pago exitoso:
   4242 4242 4242 4242

❌ Pago rechazado:
   4000 0000 0000 0002

🔄 Requiere autenticación 3D:
   4000 0027 6000 3184
```

**Cualquier CVC**: 3 dígitos cualquiera
**Cualquier fecha**: Futura

---

## 7. VERIFICACIÓN FINAL

### Paso 7.1: Tests Automáticos
```bash
# Test de FASE 9
npx tsx test-fase9.ts
```

Debe pasar **todos los tests** (7/7).

### Paso 7.2: Test Manual de Flujo
1. Inicia la app: `npm run dev`
2. Ve a la página de pricing
3. Click en "Suscribirse"
4. Usa tarjeta: `4242 4242 4242 4242`
5. Completa el pago
6. Verifica que:
   - Dashboard muestra "Trial activo (15 días)"
   - Puedes emitir facturas
   - Timer de trial aparece
   - Puedes acceder al portal del cliente

### Paso 7.3: Test de Webhook
1. En Stripe Dashboard: **Developers → Webhooks**
2. Click en tu webhook
3. Pestaña **Recent Events**
4. Verifica que los eventos se reciben con status **200 OK**

---

## 8. MODO PRODUCCIÓN

### Paso 8.1: Checklist Previo
- ✅ Cuenta Stripe activada y verificada
- ✅ Productos creados en **Live mode**
- ✅ Webhook configurado con URL de producción
- ✅ Variables de entorno actualizadas con claves **live**
- ✅ SSL/HTTPS activo en tu dominio
- ✅ Tests pasados en test mode

### Paso 8.2: Cambiar a Live Mode
En `.env.production`:
```env
STRIPE_MODE="live"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Del webhook LIVE
```

### Paso 8.3: Configurar Webhook de Producción
1. Dashboard → **Live mode** (toggle)
2. Developers → Webhooks → + Add endpoint
3. URL: `https://facturacion-la-llave.com/api/stripe/webhook`
4. Añadir los 6 eventos críticos
5. Copiar webhook secret

### Paso 8.4: Desplegar
```bash
# Build de producción
npm run build

# Deploy (según tu hosting)
# Vercel, Railway, AWS, etc.
```

### Paso 8.5: Primer Pago Real
⚠️ **IMPORTANTE**: Haz una suscripción de prueba con dinero real:
1. Usa tu propia tarjeta
2. Suscríbete al plan más barato
3. Verifica que todo funciona
4. Cancela la suscripción si quieres

---

## 🎯 RESUMEN RÁPIDO

| Paso | Acción | Dónde |
|------|--------|-------|
| 1 | Crear cuenta | stripe.com/register |
| 2 | Crear 4 productos | Dashboard → Products |
| 3 | Copiar API keys | Dashboard → Developers → API keys |
| 4 | Crear webhook | Dashboard → Developers → Webhooks |
| 5 | Copiar webhook secret | Dentro del webhook creado |
| 6 | Añadir a .env | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc. |
| 7 | Test | `npx tsx test-fase9.ts` |
| 8 | Desplegar | Vercel/Railway/AWS |

---

## 🆘 PROBLEMAS COMUNES

### 1. "Webhook signature verification failed"
**Causa**: Webhook secret incorrecto o no configurado
**Solución**: Verifica que `STRIPE_WEBHOOK_SECRET` en `.env` coincida con el del Dashboard

### 2. "No Price ID found"
**Causa**: Price IDs no configurados en `.env`
**Solución**: Copia los Price IDs del Dashboard de cada producto

### 3. "Webhook eventos no llegan"
**Causa**: URL incorrecta o firewall bloqueando
**Solución**: 
- Verifica URL en Dashboard → Webhooks
- Asegúrate que `POST /api/stripe/webhook` sea público (sin auth)
- Verifica que SSL/HTTPS funcione

### 4. "Payment requires authentication"
**Causa**: 3D Secure activado
**Solución**: Normal en algunos pagos. Stripe redirige al banco para verificar.

### 5. "Trial no se activa"
**Causa**: `handleSubscriptionCreated` no se ejecuta
**Solución**: Verifica que webhook `customer.subscription.created` esté configurado

---

## 📞 SOPORTE

- **Documentación Stripe**: https://stripe.com/docs
- **Dashboard**: https://dashboard.stripe.com
- **Status**: https://status.stripe.com
- **Soporte**: https://support.stripe.com

---

## ✅ CHECKLIST FINAL

Antes de lanzar, verifica:

```
[ ] Cuenta Stripe activada
[ ] 4 productos creados con precios en EUR
[ ] Trial de 15 días configurado
[ ] API keys (test y live) copiadas
[ ] Webhook configurado con 6 eventos
[ ] Webhook secret copiado
[ ] Variables en .env configuradas
[ ] Tests pasados (npx tsx test-fase9.ts)
[ ] Webhook recibe eventos (Dashboard → Recent events)
[ ] Flujo completo probado manualmente
[ ] Modo producción configurado
[ ] SSL/HTTPS activo
[ ] Primer pago real de prueba realizado
```

---

## 🚀 ¡LISTO!

Tu sistema de suscripciones Stripe está **100% operativo**.

Los usuarios pueden:
- ✅ Suscribirse con trial de 15 días
- ✅ Pagar mensualmente
- ✅ Gestionar su suscripción (portal)
- ✅ Recibir facturas de Stripe
- ✅ Cancelar cuando quieran

El sistema automáticamente:
- ✅ Activa cuentas al pagar
- ✅ Bloquea cuentas si fallan pagos
- ✅ Bloquea trials expirados (cron diario)
- ✅ Reactiva cuentas al pagar
- ✅ Sincroniza estados en tiempo real

**¡A facturar! 💰**
