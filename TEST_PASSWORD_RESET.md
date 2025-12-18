# Test del Sistema de Recuperación de Contraseña

## ✅ Migración Completada

La migración `20251218155312_add_password_reset_tokens` fue aplicada exitosamente.

Tabla creada: `password_reset_tokens`
Campos:
- `id` (UUID, PK)
- `token` (TEXT, UNIQUE)
- `user_id` (FK a users.id)
- `expires_at` (TIMESTAMP)
- `used_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP, default NOW())

## 🔧 Reiniciar TypeScript

Los errores de TypeScript sobre `passwordResetToken` desaparecerán después de:

1. **Opción 1 - Recargar VS Code:**
   - `Cmd/Ctrl + Shift + P`
   - Escribir "Reload Window"
   - Presionar Enter

2. **Opción 2 - Reiniciar TypeScript Server:**
   - `Cmd/Ctrl + Shift + P`
   - Escribir "TypeScript: Restart TS Server"
   - Presionar Enter

3. **Opción 3 - Cerrar y abrir VS Code**

## 🧪 Cómo probar manualmente

### 1. Iniciar el servidor
```bash
cd /workspaces/Facturacion-la-Llave/apps/web
npm run dev
```

### 2. Crear un usuario de prueba (si no existe)
```bash
# Desde psql o cualquier cliente de PostgreSQL
psql facturacion_la_llave -c "
INSERT INTO accounts (id, account_type, status) 
VALUES ('test-account-id', 'self_employed', 'active');

INSERT INTO users (id, email, password_hash, account_id) 
VALUES (
  'test-user-id', 
  'test@example.com',
  '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIbYK0Ubby', -- password: "password123"
  'test-account-id'
);
"
```

### 3. Flujo de prueba

#### A. Solicitar reset de contraseña
1. Ir a http://localhost:3000/login
2. Hacer clic en "¿Olvidaste tu contraseña?"
3. Ingresar: `test@example.com`
4. Verificar mensaje de éxito
5. **En desarrollo:** Copiar el token de la consola del servidor

Ejemplo de salida en consola:
```
🔐 Token de reset generado: a1b2c3d4e5f6...
🔗 URL de reset: http://localhost:3000/reset-password?token=a1b2c3d4e5f6...
```

#### B. Resetear contraseña
1. Usar la URL de reset de la consola
2. Ingresar nueva contraseña (mínimo 8 caracteres)
3. Confirmar contraseña
4. Verificar mensaje de éxito
5. Redirección automática a login después de 3 segundos

#### C. Verificar nueva contraseña
1. Ir a login
2. Usar email: `test@example.com`
3. Usar la nueva contraseña
4. Debe iniciar sesión correctamente

### 4. Verificar en base de datos

```sql
-- Ver tokens creados
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5;

-- Ver tokens usados
SELECT * FROM password_reset_tokens WHERE used_at IS NOT NULL;

-- Ver tokens expirados
SELECT * FROM password_reset_tokens WHERE expires_at < NOW();

-- Limpiar tokens de prueba
DELETE FROM password_reset_tokens WHERE user_id = 'test-user-id';
```

## 📧 Pendiente: Envío de emails

Actualmente el sistema genera el token pero NO envía emails.

Para producción, necesitas configurar un servicio de email:

### Opciones recomendadas:
1. **SendGrid** (12,000 emails gratis/mes)
2. **AWS SES** (62,000 emails gratis primer año)
3. **Resend** (3,000 emails gratis/mes)

### Implementar envío:

1. Instalar dependencia (ejemplo con Resend):
```bash
npm install resend --workspace=apps/web
```

2. Configurar en `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxx
```

3. Crear servicio de email:
```typescript
// apps/web/src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: 'Facturación La Llave <noreply@tudominio.com>',
    to: email,
    subject: 'Recuperar contraseña',
    html: `
      <h2>Recuperar contraseña</h2>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Este enlace expira en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `,
  });
}
```

4. Descomentar en `forgot-password/route.ts`:
```typescript
import { sendPasswordResetEmail } from '@/lib/email';

// Después de crear el token:
await sendPasswordResetEmail(user.email, token);
```

## ✅ Completado

- [x] Modelo `PasswordResetToken` en schema.prisma
- [x] Migración aplicada
- [x] API `/api/auth/forgot-password` funcional
- [x] API `/api/auth/reset-password` funcional
- [x] Página `/forgot-password` con formulario
- [x] Página `/reset-password` con validación
- [x] Enlace en página de login
- [x] Seguridad: prevención de email enumeration
- [x] Seguridad: tokens de un solo uso
- [x] Seguridad: expiración de 1 hora
- [x] Integración con bcrypt para hash de contraseñas

## ⏭️ Siguiente paso recomendado

Implementar el sistema de emails transaccionales para que los usuarios reciban el enlace de recuperación por correo electrónico en lugar de solo en la consola.
