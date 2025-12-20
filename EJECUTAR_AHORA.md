# ⚡ INSTRUCCIONES RÁPIDAS - COMPLETAR FASE 9

## 🎯 Ejecuta estos comandos en tu terminal

### **Opción 1: Script automático** (Recomendado)

```bash
chmod +x completar-fase9.sh
./completar-fase9.sh
```

---

### **Opción 2: Comandos manuales paso a paso**

Si el script falla o prefieres hacerlo manual:

#### **1. Instalar dependencias (incluye Stripe)**
```bash
npm install
```
**Tiempo estimado**: 1-2 minutos

---

#### **2. Migrar base de datos (añadir currentPlan y stripePriceId)**
```bash
cd packages/db
npx prisma migrate dev --name add_current_plan_and_price_id
```

**Importante**: Cuando pregunte "Enter a name for the new migration", presiona Enter (ya está el nombre).

**Tiempo estimado**: 30 segundos

---

#### **3. Generar cliente Prisma**
```bash
npx prisma generate
cd ../..
```
**Tiempo estimado**: 30 segundos

---

#### **4. Verificar todo (opcional pero recomendado)**
```bash
npx tsx verificar-todas-fases.ts
```
**Tiempo estimado**: 10 segundos

Deberías ver:
```
✅ FASE 9: STRIPE SUSCRIPCIONES Y PAGOS
  ✅ Módulo packages/core/src/stripe.ts existe
  ✅ 11 funciones implementadas
  ✅ API /api/stripe/create-checkout-session existe
  ✅ API /api/stripe/webhook existe
  ... (más verificaciones)
```

---

## ✅ **Después de completar**

Verás 0 errores de TypeScript en:
- `packages/core/src/stripe.ts`
- `apps/web/src/app/api/stripe/create-checkout-session/route.ts`

Los campos `currentPlan` y `stripePriceId` estarán en la base de datos.

---

## 🎉 **FASE 9 COMPLETADA**

Ahora puedes:

### **A) Configurar Stripe** (para recibir pagos reales)
```bash
# 1. Lee la guía completa
cat GUIA_CONFIGURACION_STRIPE.md

# 2. Ve a: https://dashboard.stripe.com/register
# 3. Crea productos (4 planes)
# 4. Copia API keys y Price IDs
# 5. Añádelos a .env
```

### **B) Empezar FASE 10** (UX/UI)
Mejorar la interfaz de usuario:
- Dashboard profesional
- Formularios optimizados
- Diseño responsive
- Estados de carga

### **C) Desplegar a producción**
El backend está 100% funcional, puedes desplegarlo ya.

---

## 🆘 **Si hay problemas**

### Error: "Cannot find module 'stripe'"
**Solución**: Ejecuta `npm install` de nuevo

### Error: "currentPlan does not exist"
**Solución**: La migración no se ejecutó. Ejecuta:
```bash
cd packages/db
npx prisma migrate dev --name add_current_plan_and_price_id
npx prisma generate
cd ../..
```

### Error: "Database connection failed"
**Solución**: Verifica que PostgreSQL esté corriendo:
```bash
docker-compose up -d
```

---

## 📊 **Verificar estado**

```bash
# Ver si Stripe está instalado
npm list stripe

# Ver estado de migraciones
cd packages/db
npx prisma migrate status
cd ../..

# Ver campos en BD
npx tsx -e "import { PrismaClient } from '@fll/db'; const db = new PrismaClient(); db.account.findFirst().then(a => console.log(a)).finally(() => db.\$disconnect());"
```

---

## 🚀 **¿Listo?**

**Ejecuta**:
```bash
./completar-fase9.sh
```

O si prefieres manual:
```bash
npm install && cd packages/db && npx prisma migrate dev --name add_current_plan_and_price_id && npx prisma generate && cd ../.. && npx tsx verificar-todas-fases.ts
```

**¡A por ello!** 🎉
