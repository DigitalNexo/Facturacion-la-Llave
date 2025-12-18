# ✅ CHECKLIST DE VERIFICACIÓN - FASE 5.5

## 🎯 OBJETIVO
Verificar que todos los sistemas de la FASE 5.5 funcionan correctamente.

---

## 📋 PASO 1: PREPARACIÓN

### A. Resolver Errores TypeScript
- [ ] Opción 1: Ejecutar `cd /workspaces/Facturacion-la-Llave && ./test-fase-5.5.sh`
- [ ] Opción 2: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- [ ] Opción 3: Recargar ventana de VS Code
- [ ] Verificar que los 3 errores de `passwordResetToken` desaparecieron

### B. Iniciar Servidor
```bash
cd /workspaces/Facturacion-la-Llave/apps/web
npm run dev
```
- [ ] Servidor inicia sin errores
- [ ] Puerto 3000 disponible (o el que uses)
- [ ] No hay errores de compilación

---

## 🧪 PASO 2: PRUEBAS FUNCIONALES

### TEST 1: Sistema de Toasts ✅

#### 1.1 Toast de Éxito
- [ ] Ve a cualquier página con toasts
- [ ] Realiza una acción exitosa
- [ ] ✅ Aparece toast verde en esquina superior derecha
- [ ] ✅ Toast tiene título y mensaje
- [ ] ✅ Toast tiene icono de check (✓)
- [ ] ✅ Toast se auto-cierra después de 5 segundos
- [ ] ✅ Puedes cerrar el toast manualmente con la X

#### 1.2 Toast de Error
- [ ] Realiza una acción que falle (ej: contraseña incorrecta)
- [ ] ✅ Aparece toast rojo
- [ ] ✅ Toast tiene icono de error (✗)
- [ ] ✅ Mensaje de error es descriptivo

#### 1.3 Toast de Advertencia
- [ ] Realiza una acción de advertencia
- [ ] ✅ Aparece toast amarillo
- [ ] ✅ Toast tiene icono de advertencia (⚠)

#### 1.4 Toasts Múltiples
- [ ] Realiza varias acciones rápido
- [ ] ✅ Los toasts se apilan verticalmente
- [ ] ✅ Cada toast es independiente
- [ ] ✅ Se pueden cerrar individualmente

---

### TEST 2: Sistema de Modales de Confirmación ✅

#### 2.1 Modal de Info (Azul)
- [ ] Login como admin
- [ ] Ve a solicitudes de acceso pendientes
- [ ] Click en "Aprobar"
- [ ] ✅ Aparece modal azul con fondo oscuro
- [ ] ✅ Modal tiene icono ℹ️
- [ ] ✅ Tiene título "¿Aprobar solicitud?"
- [ ] ✅ Tiene mensaje explicativo
- [ ] ✅ Botón "Aprobar" es azul
- [ ] ✅ Botón "Cancelar" es gris
- [ ] Click en "Cancelar"
- [ ] ✅ Modal se cierra sin hacer nada
- [ ] Click en "Aprobar" de nuevo
- [ ] Click en "Aprobar" del modal
- [ ] ✅ Modal se cierra
- [ ] ✅ Aparece toast de éxito
- [ ] ✅ Lista se actualiza

#### 2.2 Modal de Danger (Rojo)
- [ ] Ve a panel de gestión de asesores
- [ ] Click en "Eliminar" de un asesor
- [ ] ✅ Aparece modal rojo
- [ ] ✅ Modal tiene icono ⚠️
- [ ] ✅ Fondo del icono es rojo claro
- [ ] ✅ Botón "Eliminar" es rojo
- [ ] ✅ Mensaje incluye el nombre del asesor
- [ ] Click en "Cancelar"
- [ ] ✅ No se elimina nada
- [ ] **NO completar la eliminación** (solo probar el modal)

#### 2.3 Modal de Warning (Amarillo)
- [ ] Ve a panel de asesores verificados
- [ ] Click en "Revocar verificación"
- [ ] ✅ Aparece modal amarillo
- [ ] ✅ Modal tiene icono ⚡
- [ ] ✅ Fondo del icono es amarillo claro
- [ ] ✅ Botón principal es amarillo
- [ ] Click en "Cancelar"

#### 2.4 Modal con Estado de Carga
- [ ] Realiza una acción con modal
- [ ] Mientras procesa:
- [ ] ✅ Botón muestra "Procesando..." o similar
- [ ] ✅ Botón está deshabilitado
- [ ] ✅ No puedes hacer click múltiple

---

### TEST 3: Recuperación de Contraseña (Forgot Password) ✅

#### 3.1 Solicitar Reset
- [ ] Ve a `/login`
- [ ] ✅ Hay link "¿Olvidaste tu contraseña?"
- [ ] Click en el link
- [ ] ✅ Redirige a `/forgot-password`
- [ ] ✅ Página tiene formulario con campo email
- [ ] ✅ Tiene botón "Enviar instrucciones"
- [ ] ✅ Tiene link "Volver a login"

#### 3.2 Email Inexistente
- [ ] Ingresa email que no existe: `noexiste@test.com`
- [ ] Click en "Enviar instrucciones"
- [ ] ✅ Aparece toast verde (mensaje genérico por seguridad)
- [ ] ✅ Página muestra mensaje de éxito
- [ ] ✅ En consola del servidor NO hay token (usuario no existe)

#### 3.3 Email Válido
- [ ] Ingresa email de usuario existente
- [ ] Click en "Enviar instrucciones"
- [ ] ✅ Aparece toast verde "Email enviado"
- [ ] ✅ Mensaje incluye el email ingresado
- [ ] ✅ Aparece mensaje de éxito en la página
- [ ] ✅ Countdown de 5 segundos inicia
- [ ] **IMPORTANTE**: Abre la terminal del servidor
- [ ] ✅ En logs aparece: "Token de reset generado: xxxxxx"
- [ ] **COPIA EL TOKEN** para el siguiente paso
- [ ] ✅ Después de 5 segundos, redirige a `/login`

#### 3.4 Resetear Contraseña - Validaciones
- [ ] Ve a `/reset-password?token=INVALID_TOKEN`
- [ ] ✅ Página carga con formulario
- [ ] Ingresa contraseña de 5 caracteres
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast rojo "Contraseña muy corta"
- [ ] ✅ Aparece mensaje de error en la página
- [ ] Ingresa contraseña de 10 caracteres en "Nueva contraseña"
- [ ] Ingresa contraseña diferente en "Confirmar contraseña"
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast rojo "Las contraseñas no coinciden"

#### 3.5 Resetear Contraseña - Éxito
- [ ] Ve a `/reset-password?token=TOKEN_COPIADO`
- [ ] Ingresa nueva contraseña: `NuevaPassword123`
- [ ] Confirma la misma contraseña
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast verde "Contraseña actualizada"
- [ ] ✅ Aparece mensaje de éxito
- [ ] ✅ Countdown de 3 segundos
- [ ] ✅ Redirige a `/login`

#### 3.6 Verificar Nuevo Password
- [ ] En `/login`, intenta login con contraseña antigua
- [ ] ✅ Login falla (contraseña incorrecta)
- [ ] Intenta login con `NuevaPassword123`
- [ ] ✅ Login exitoso ✅

#### 3.7 Token de Un Solo Uso
- [ ] Intenta usar el mismo token de nuevo
- [ ] Ve a `/reset-password?token=TOKEN_YA_USADO`
- [ ] Ingresa cualquier contraseña
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece error "Token inválido o expirado"
- [ ] ✅ Token ya NO funciona (un solo uso) ✅

---

### TEST 4: Cambiar Contraseña (Usuarios Autenticados) ✅

#### 4.1 Navegación
- [ ] Login como usuario normal
- [ ] Ve a `/dashboard/settings`
- [ ] ✅ Página carga correctamente
- [ ] ✅ Hay tabs: Seguridad, Perfil, Notificaciones
- [ ] ✅ Tab "Seguridad" está activo por defecto
- [ ] ✅ Formulario de cambio de contraseña visible

#### 4.2 Validaciones
- [ ] En "Contraseña actual", ingresa la contraseña correcta
- [ ] En "Nueva contraseña", ingresa `123` (muy corta)
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast rojo "Contraseña muy corta"
- [ ] Ingresa nueva contraseña válida: `Password456`
- [ ] En "Confirmar", ingresa contraseña diferente
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast rojo "Las contraseñas no coinciden"

#### 4.3 Contraseña Actual Incorrecta
- [ ] Ingresa contraseña actual incorrecta
- [ ] Ingresa nueva contraseña válida y confirmación
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast rojo "Contraseña actual incorrecta"

#### 4.4 Cambio Exitoso
- [ ] Ingresa contraseña actual correcta
- [ ] Ingresa nueva contraseña: `NewPassword789`
- [ ] Confirma la misma contraseña
- [ ] Click en "Cambiar contraseña"
- [ ] ✅ Aparece toast verde "Contraseña actualizada"
- [ ] ✅ Formulario se limpia (campos vacíos)
- [ ] ✅ Mensaje de éxito en la página

#### 4.5 Verificar Cambio
- [ ] Cierra sesión
- [ ] Intenta login con contraseña antigua
- [ ] ✅ Login falla
- [ ] Login con `NewPassword789`
- [ ] ✅ Login exitoso ✅

---

### TEST 5: Gestión de Tenants (Empresas) ✅

#### 5.1 Lista de Tenants
- [ ] Login como usuario con empresas
- [ ] Ve a `/dashboard/tenants`
- [ ] ✅ Página carga lista de empresas
- [ ] ✅ Cada empresa muestra:
  - [ ] Nombre comercial
  - [ ] Razón social
  - [ ] CIF/Taxld
  - [ ] Dirección
  - [ ] Estado (Activa/Inactiva)
- [ ] ✅ Hay botón "Editar" en cada empresa
- [ ] ✅ Si hay límite de plan, se muestra correctamente
- [ ] ✅ Contador muestra empresas actuales vs máximo

#### 5.2 Editar Tenant - Navegación
- [ ] Click en "Editar" de cualquier empresa
- [ ] ✅ Redirige a `/dashboard/tenants/[id]/edit`
- [ ] ✅ Formulario carga con datos de la empresa
- [ ] ✅ Todos los campos tienen valores

#### 5.3 Campo CIF/TaxId Protegido
- [ ] Busca el campo "CIF / Identificación Fiscal"
- [ ] ✅ Campo está deshabilitado (no editable)
- [ ] ✅ Tiene atributo `disabled`
- [ ] ✅ Tiene estilo visual de deshabilitado
- [ ] Intenta hacer click en el campo
- [ ] ✅ No puedes editar el CIF ✅

#### 5.4 Editar Datos
- [ ] Modifica "Nombre comercial" a algo diferente
- [ ] Modifica "Dirección"
- [ ] Cambia ciudad, provincia, etc.
- [ ] Toggle el estado "Activa"
- [ ] Click en "Guardar cambios"
- [ ] ✅ Aparece toast verde "Empresa actualizada"
- [ ] ✅ Redirige a `/dashboard/tenants`
- [ ] ✅ Cambios se reflejan en la lista

#### 5.5 Validaciones
- [ ] Edita un tenant
- [ ] Borra el campo "Razón Social" (déjalo vacío)
- [ ] Click en "Guardar cambios"
- [ ] ✅ Aparece error (campo requerido)
- [ ] Completa el campo
- [ ] Guarda correctamente

---

### TEST 6: Componentes Admin con Toasts y Modales ✅

#### 6.1 Access Request Buttons
- [ ] Login como admin
- [ ] Ve a panel de solicitudes de acceso
- [ ] ✅ Hay solicitudes pendientes
- [ ] Click en "Aprobar"
- [ ] ✅ Modal azul aparece
- [ ] Confirma
- [ ] ✅ Toast verde "Solicitud aprobada"
- [ ] Click en "Rechazar" de otra solicitud
- [ ] ✅ Modal rojo aparece
- [ ] ✅ Aparece prompt pidiendo razón
- [ ] Ingresa razón o cancela
- [ ] Si confirmas: ✅ Toast amarillo/rojo aparece

#### 6.2 Verify Advisor Button
- [ ] Ve a panel de asesores
- [ ] Busca un asesor no verificado
- [ ] Click en "Verificar"
- [ ] ✅ Modal azul aparece
- [ ] Confirma
- [ ] ✅ Toast verde "Asesor verificado"
- [ ] ✅ Estado del asesor cambia a verificado
- [ ] Click en "Revocar verificación"
- [ ] ✅ Modal amarillo aparece
- [ ] Confirma
- [ ] ✅ Toast de advertencia aparece

#### 6.3 Delete Advisor Button
- [ ] Click en "Eliminar" de un asesor
- [ ] ✅ Modal rojo aparece
- [ ] ✅ Mensaje incluye nombre del asesor
- [ ] **Cancela** (no elimines realmente)
- [ ] ✅ Modal se cierra sin hacer nada

---

### TEST 7: Request Access Page (Gestor) ✅

- [ ] Login como gestor
- [ ] Ve a `/advisor/request-access`
- [ ] Ingresa CIF de una empresa
- [ ] Click en "Solicitar acceso"
- [ ] ✅ Aparece toast verde "Solicitud enviada"
- [ ] O si hay error: ✅ Toast rojo con mensaje
- [ ] ✅ UI states funcionan (loading, success, error)

---

### TEST 8: Integration Tests ✅

#### 8.1 ToastProvider Global
- [ ] Abre DevTools → React DevTools (si tienes)
- [ ] Busca componente `ToastProvider`
- [ ] ✅ ToastProvider envuelve toda la app
- [ ] ✅ Está en el layout root

#### 8.2 Multiple Toasts Simultáneos
- [ ] Realiza 3 acciones rápidas que generen toasts
- [ ] ✅ Los 3 toasts aparecen apilados
- [ ] ✅ Cada uno tiene su propio timer
- [ ] ✅ Se pueden cerrar independientemente
- [ ] ✅ Auto-dismiss funciona para cada uno

#### 8.3 Modal + Toast Juntos
- [ ] Realiza acción que requiera confirmación
- [ ] ✅ Modal aparece
- [ ] Confirma
- [ ] ✅ Modal se cierra
- [ ] ✅ Inmediatamente aparece toast
- [ ] ✅ No hay conflictos visuales

#### 8.4 Responsive Design
- [ ] Abre DevTools, modo responsive
- [ ] Reduce ancho a 375px (móvil)
- [ ] ✅ Toasts se ven bien en móvil
- [ ] ✅ Modales se ven bien en móvil
- [ ] ✅ Formularios son usables
- [ ] Amplía a 768px (tablet)
- [ ] ✅ Todo se adapta correctamente

---

## 🎯 PASO 3: VERIFICACIÓN FINAL

### Errores TypeScript
- [ ] No hay errores de TypeScript en el editor
- [ ] No hay errores de `passwordResetToken`
- [ ] No hay errores de imports

### Console Logs
- [ ] Abre DevTools → Console
- [ ] Navega por la aplicación
- [ ] ✅ No hay errores en consola (solo warnings permitidos)
- [ ] ✅ No hay "module not found"
- [ ] ✅ No hay "undefined" errors

### Network Tab
- [ ] Abre DevTools → Network
- [ ] Realiza varias acciones
- [ ] ✅ Todas las peticiones API retornan 200 o 201
- [ ] ✅ No hay errores 404 o 500
- [ ] ✅ Responses tienen formato JSON correcto

### Database
- [ ] Abre tu cliente de PostgreSQL
- [ ] Verifica tabla `password_reset_tokens` existe
- [ ] ✅ Tabla tiene columnas: id, token, user_id, expires_at, used_at, created_at
- [ ] Ejecuta reset de contraseña
- [ ] ✅ Se crea registro en la tabla
- [ ] ✅ Campo `used_at` es NULL inicialmente
- [ ] Completa el reset
- [ ] ✅ Campo `used_at` se actualiza con timestamp

---

## ✅ RESUMEN FINAL

### Funcionalidades Testeadas
```
[ ] Sistema de Toasts (4 tipos)
[ ] Sistema de Modales (3 tipos)
[ ] Password Reset Flow (6 sub-tests)
[ ] Change Password (5 sub-tests)
[ ] Tenant Management (5 sub-tests)
[ ] Admin Components (3 componentes)
[ ] Integration Tests (4 tests)
[ ] Final Verification (4 checks)
```

### Contadores
- **Tests completados**: _____ / 35
- **Bugs encontrados**: _____
- **Bugs resueltos**: _____
- **Estado general**: _____

---

## 🐛 REPORTE DE BUGS

Si encuentras algún bug, documenta aquí:

### Bug #1
- **Descripción**: 
- **Archivo afectado**: 
- **Pasos para reproducir**: 
- **Esperado**: 
- **Actual**: 
- **Severidad**: Alta / Media / Baja

### Bug #2
- **Descripción**: 
- **Archivo afectado**: 
- **Pasos para reproducir**: 
- **Esperado**: 
- **Actual**: 
- **Severidad**: Alta / Media / Baja

---

## ✅ FIRMA DE APROBACIÓN

Una vez completados todos los tests:

- **Tester**: _________________
- **Fecha**: _________________
- **Resultado**: Aprobado / Rechazado / Con observaciones
- **Observaciones**: _________________

---

**Versión del checklist**: 1.0  
**Fase**: 5.5  
**Fecha creación**: 18 diciembre 2024
