-- Facturación La Llave - PostgreSQL init script
-- Este script se ejecuta al crear el contenedor Docker

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comentario de auditoría
COMMENT ON DATABASE facturacion_la_llave IS 'Sistema Informático de Facturación - FLL-SIF - Búfalo Easy Trade, S.L. (B86634235)';
