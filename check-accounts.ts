import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    take: 10,
    select: {
      id: true,
      email: true,
      accountType: true,
    },
  });

  console.log('\n📊 CUENTAS EN LA BASE DE DATOS:\n');
  console.table(accounts);

  await prisma.$disconnect();
}

main().catch(console.error);
