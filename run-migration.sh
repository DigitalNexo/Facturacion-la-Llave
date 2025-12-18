#!/bin/bash
cd /workspaces/Facturacion-la-Llave
npx prisma generate --schema=./packages/db/prisma/schema.prisma
npx prisma migrate dev --name add_invitation_model --schema=./packages/db/prisma/schema.prisma
