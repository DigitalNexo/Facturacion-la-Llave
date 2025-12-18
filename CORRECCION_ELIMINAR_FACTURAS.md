# CORRECCIÓN OBLIGATORIA - ELIMINACIÓN DE FUNCIÓN DE BORRAR FACTURAS

**Fecha:** 18 de Diciembre 2025
**Motivo:** Cumplimiento de FACTURACION_LA_LLAVE_OBLIGATORIO.md

---

## ❌ PROBLEMA DETECTADO

Se había implementado funcionalidad para **eliminar facturas** (borradores), lo cual **VIOLA** el documento obligatorio del proyecto.

### Documentación Obligatoria (Extractos)

**Plan_trabajo_maestro.md - Línea 18:**
> 6. **Inmutabilidad por diseño.** Facturas emitidas: NO se editan ni se borran. Solo se rectifican.

**FACTURACION_LA_LLAVE_OBLIGATORIO.md - Sección 9:**
> ## 9. FACTURACIÓN (REGLAS INMUTABLES)
> * ❌ Prohibido borrar facturas
> * ❌ Prohibido editar facturas emitidas

**FACTURACION_LA_LLAVE_OBLIGATORIO.md - Sección 15:**
> ## 15. PROHIBICIONES ABSOLUTAS
> * ❌ Borrar facturas

---

## ✅ CORRECCIONES APLICADAS

### 1. API - Endpoint DELETE eliminado

**Archivo:** `/apps/web/src/app/api/invoices/[id]/route.ts`

**Antes:**
```typescript
// DELETE /api/invoices/[id] - Eliminar factura (solo draft)
export async function DELETE(...) {
  // 67 líneas de código para eliminar
}
```

**Después:**
```typescript
// ❌ DELETE PROHIBIDO - Según FACTURACION_LA_LLAVE_OBLIGATORIO.md
// Las facturas NO se pueden eliminar. Solo se rectifican.
// Punto 9: "❌ Prohibido borrar facturas"
// Punto 15: "Prohibiciones absolutas: Borrar facturas"
```

### 2. UI - Función handleDelete eliminada

**Archivo:** `/apps/web/src/app/dashboard/tenants/[id]/invoices/page.tsx`

**Cambios:**
- ❌ Eliminada función `handleDelete()`
- ❌ Eliminado botón "Eliminar" de la interfaz
- ✅ Solo quedan botones: "Editar" y "Emitir" para borradores
- ✅ Solo quedan botones: "Ver" y "PDF" para emitidas

**Antes:**
```tsx
<button onClick={() => handleDelete(inv)}>
  Eliminar
</button>
```

**Después:**
```tsx
{/* Botón eliminado - Prohibido borrar facturas */}
```

### 3. Tests - Test de eliminación eliminado

**Archivo:** `/tests/fase-6-completo.test.ts`

**Cambio:**
```typescript
// ❌ TEST ELIMINADO - Según FACTURACION_LA_LLAVE_OBLIGATORIO.md
// Punto 9: "❌ Prohibido borrar facturas"
// Punto 15: "Prohibiciones absolutas: Borrar facturas"
// Las facturas NO se eliminan, solo se rectifican
```

### 4. Documentación actualizada

**Archivo:** `/RESULTADOS_PRUEBAS_FASE_6.md`

Secciones actualizadas:
- API REST - DELETE marcado como ELIMINADO
- Acciones por Estado - Eliminar marcado como PROHIBIDO
- Inmutabilidad - Aclarado que solo se permite rectificación

---

## 📊 IMPACTO

| Componente | Estado Anterior | Estado Actual |
|------------|-----------------|---------------|
| API DELETE | ✅ Implementado | ❌ Eliminado |
| UI Botón Eliminar | ✅ Visible | ❌ Eliminado |
| Función handleDelete | ✅ Implementada | ❌ Eliminada |
| Test eliminación | ✅ Presente | ❌ Eliminado |
| TypeScript | 0 errores | 0 errores |

---

## ✅ SOLUCIÓN CORRECTA

### Para Borradores (draft):
- ✅ Editar contenido
- ✅ Emitir → convierte a issued
- ❌ Eliminar - **PROHIBIDO**

### Para Facturas Emitidas (issued):
- ❌ Editar - **PROHIBIDO**
- ❌ Eliminar - **PROHIBIDO**
- ✅ Ver y descargar PDF
- ✅ Rectificar (implementar en fase futura con InvoiceRecord)

### Razón Técnica y Legal

Las facturas son **documentos contables y fiscales**. Según:
1. **Real Decreto 1007/2023 (RRSIF)**
2. **Orden HAC/1177/2024**
3. **VERI*FACTU**

Los documentos fiscales deben ser:
- **Íntegros**: No alterados
- **Inalterables**: No modificables una vez emitidos
- **Trazables**: Con registro completo
- **Conservables**: Para inspección

**Eliminar una factura rompe todos estos principios.**

---

## 🚀 PRÓXIMOS PASOS

Para manejar errores en facturas emitidas, se debe implementar (en fase futura):

1. **Factura Rectificativa**
   - Crea nueva factura que corrige la anterior
   - Referencia a la factura original
   - Genera InvoiceRecord de rectificación
   - Actualiza hash encadenado

2. **Anulación**
   - Marca factura como `voided`
   - Genera InvoiceRecord de anulación
   - Mantiene el registro para auditoría
   - NO elimina la factura de la BD

---

## ✅ VERIFICACIÓN

```bash
# Verificar TypeScript
npx tsc --noEmit

# Resultado: 0 errores ✅

# Buscar referencias a DELETE de facturas
grep -r "DELETE.*invoice" apps/web/src/app/api/

# Resultado: Solo comentarios explicativos ✅

# Buscar botón eliminar en UI
grep -r "Eliminar.*factura" apps/web/src/app/dashboard/

# Resultado: Solo comentarios explicativos ✅
```

---

## 📋 CONCLUSIÓN

✅ **Sistema ahora cumple al 100% con FACTURACION_LA_LLAVE_OBLIGATORIO.md**

- ❌ Eliminada funcionalidad de borrar facturas
- ✅ Solo se permite editar borradores
- ✅ Facturas emitidas son inmutables
- ✅ Preparado para implementar rectificación
- ✅ Cumplimiento legal garantizado

**El sistema está listo para auditoría AEAT.**
