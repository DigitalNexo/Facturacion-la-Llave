#!/bin/bash
set -e

echo "🗄️  Aplicando migración para agregar invitationCode..."
npx prisma migrate dev --name add_invitation_code_to_accounts --schema=./packages/db/prisma/schema.prisma

echo "✨ Generando cliente de Prisma..."
npx prisma generate --schema=./packages/db/prisma/schema.prisma

echo "🔄 Generando códigos para cuentas existentes..."
npx ts-node -e "
import { PrismaClient } from '@fll/db';
import { generateInvitationCode } from '@fll/core';

const prisma = new PrismaClient();

async function generateCodes() {
  const accounts = await prisma.account.findMany({
    where: {
      invitationCode: null,
      accountType: { in: ['company', 'self_employed'] },
    },
  });

  console.log(\`Generando códigos para \${accounts.length} cuentas...\`);

  for (const account of accounts) {
    let code = generateInvitationCode();
    let exists = await prisma.account.findUnique({ where: { invitationCode: code } });
    
    while (exists) {
      code = generateInvitationCode();
      exists = await prisma.account.findUnique({ where: { invitationCode: code } });
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { invitationCode: code },
    });

    console.log(\`✓ Cuenta \${account.id}: \${code}\`);
  }

  console.log('✅ Códigos generados correctamente');
  await prisma.\$disconnect();
}

generateCodes().catch(console.error);
"

echo "✅ ¡Migración completada!"
echo ""
echo "📝 Siguiente paso: Eliminar sistema antiguo de invitaciones"
echo "   - Eliminar modelo Invitation del schema"
echo "   - Eliminar páginas /advisor/invitations/*"
echo "   - Eliminar páginas /onboarding/*"
echo "   - Eliminar APIs relacionadas"
