import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  // ========================================
  // 1. PLANES DE SUSCRIPCIÓN
  // ========================================
  console.log('📦 Creando planes de suscripción...');

  const planAutonomo = await prisma.plan.upsert({
    where: { code: 'AUTONOMO' },
    update: {},
    create: {
      name: 'Autónomo',
      code: 'AUTONOMO',
      description: 'Plan para trabajadores autónomos',
      maxTenants: 1,
      maxUsers: 1,
      maxInvoicesPerMonth: 150,
      maxStorageMb: 1024,
      priceMonthly: 15.0,
      isActive: true,
    },
  });

  const planEmpresaBasic = await prisma.plan.upsert({
    where: { code: 'EMPRESA_BASIC' },
    update: {},
    create: {
      name: 'Empresa Basic',
      code: 'EMPRESA_BASIC',
      description: 'Plan básico para pequeñas empresas',
      maxTenants: 1,
      maxUsers: 3,
      maxInvoicesPerMonth: 500,
      maxStorageMb: 4096,
      priceMonthly: 29.0,
      isActive: true,
    },
  });

  const planEmpresaPro = await prisma.plan.upsert({
    where: { code: 'EMPRESA_PRO' },
    update: {},
    create: {
      name: 'Empresa Pro',
      code: 'EMPRESA_PRO',
      description: 'Plan profesional para empresas en crecimiento',
      maxTenants: 5,
      maxUsers: 10,
      maxInvoicesPerMonth: null, // ilimitado
      maxStorageMb: 20480,
      priceMonthly: 49.0,
      isActive: true,
    },
  });

  const planAsesorias = await prisma.plan.upsert({
    where: { code: 'ASESORIAS' },
    update: {},
    create: {
      name: 'Asesorías / Agencias',
      code: 'ASESORIAS',
      description: 'Plan ilimitado para gestorías y asesorías',
      maxTenants: null, // ilimitado
      maxUsers: null, // ilimitado
      maxInvoicesPerMonth: null, // ilimitado
      maxStorageMb: null, // ilimitado
      priceMonthly: 79.0,
      isActive: true,
    },
  });

  console.log('✅ Planes creados:', {
    autonomo: planAutonomo.id,
    empresaBasic: planEmpresaBasic.id,
    empresaPro: planEmpresaPro.id,
    asesorias: planAsesorias.id,
  });

  // ========================================
  // 2. PERMISSION SETS (CONJUNTOS DE PERMISOS)
  // ========================================
  console.log('🔐 Creando permission sets...');

  const permReadOnly = await prisma.permissionSet.upsert({
    where: { id: 'readonly-default' },
    update: {},
    create: {
      id: 'readonly-default',
      name: 'Solo lectura',
      permissions: ['invoices.read', 'invoices.download_pdf', 'customers.read', 'exports.read'],
    },
  });

  const permFacturador = await prisma.permissionSet.upsert({
    where: { id: 'facturador-default' },
    update: {},
    create: {
      id: 'facturador-default',
      name: 'Facturador',
      permissions: [
        'invoices.read',
        'invoices.download_pdf',
        'invoices.create_draft',
        'invoices.edit_draft',
        'invoices.issue_lock',
        'customers.manage',
        'series.manage',
      ],
    },
  });

  const permCompleto = await prisma.permissionSet.upsert({
    where: { id: 'completo-default' },
    update: {},
    create: {
      id: 'completo-default',
      name: 'Acceso completo',
      permissions: [
        'invoices.read',
        'invoices.download_pdf',
        'invoices.create_draft',
        'invoices.edit_draft',
        'invoices.issue_lock',
        'invoices.rectify',
        'invoices.void',
        'customers.manage',
        'series.manage',
        'exports.read',
        'records.read',
      ],
    },
  });

  console.log('✅ Permission sets creados:', {
    readonly: permReadOnly.id,
    facturador: permFacturador.id,
    completo: permCompleto.id,
  });

  console.log('');
  console.log('✅ ¡Seed completado exitosamente!');
  console.log('');
  console.log('📊 Resumen:');
  console.log('   - 4 planes de suscripción');
  console.log('   - 3 permission sets');
  console.log('');
  console.log('🚀 Siguiente paso: npm run dev');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
