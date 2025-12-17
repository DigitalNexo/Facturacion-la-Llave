# Facturación La Llave - Guía de Inicio

## 🚀 Primeros pasos

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus configuraciones
```

### 3. Levantar PostgreSQL

```bash
docker-compose up -d
```

### 4. Aplicar migraciones de base de datos

```bash
npm run db:generate
npm run db:migrate
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Comandos útiles

```bash
# Desarrollo
npm run dev              # Iniciar Next.js en modo desarrollo
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción

# Base de datos
npm run db:migrate       # Aplicar migraciones
npm run db:seed          # Sembrar datos de prueba
npm run db:studio        # Abrir Prisma Studio (UI para BD)
npm run db:generate      # Generar cliente de Prisma

# Testing
npm run test             # Ejecutar todos los tests
npm run test:watch       # Tests en modo watch

# Calidad de código
npm run lint             # Verificar errores de linting
npm run format           # Formatear código
npm run format:check     # Verificar formato sin cambios
```

## 🏗️ Próximos pasos de desarrollo

Según el Plan de Trabajo Maestro:

- [ ] Completar esquema de base de datos (facturas, registros, auditoría)
- [ ] Configurar autenticación
- [ ] Implementar registro y trial de 15 días
- [ ] Configurar Stripe
- [ ] Desarrollar núcleo de facturación

Consulta [Plan_trabajo_maestro.md](../Plan_trabajo_maestro.md) para el plan completo.
