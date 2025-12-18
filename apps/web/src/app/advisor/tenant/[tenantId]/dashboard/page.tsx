/**
 * DASHBOARD DEL GESTOR PARA UNA EMPRESA ESPECÍFICA
 * /advisor/tenant/[tenantId]/dashboard
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdvisorTenantDashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Verificar que el usuario es gestor
  const account = await prisma.account.findFirst({
    where: {
      users: {
        some: { email: session.user.email },
      },
    },
    include: {
      users: true,
    },
  });

  if (!account || account.accountType !== 'advisor') {
    redirect('/dashboard');
  }

  const user = account.users[0];
  if (!user) {
    redirect('/dashboard');
  }

  // Verificar que tiene acceso activo a este tenant
  const tenantAccess = await prisma.tenantAccess.findFirst({
    where: {
      tenantId,
      userId: user.id,
      isActive: true,
    },
    include: {
      tenant: {
        include: {
          account: true,
        },
      },
    },
  });

  if (!tenantAccess) {
    redirect('/advisor/companies');
  }

  const { tenant } = tenantAccess;

  // Obtener estadísticas del tenant
  const [invoiceCount, customerCount] = await Promise.all([
    prisma.invoice.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Botón volver */}
      <div className="mb-6">
        <Link
          href="/advisor/companies"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Volver a Mis Empresas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">👤</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{customerCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href={`/advisor/tenant/${tenantId}/invoices`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">📄</span>
              <div>
                <p className="font-medium text-gray-900">Facturas</p>
                <p className="text-sm text-gray-500">Gestionar facturas</p>
              </div>
            </Link>

            <Link
              href={`/advisor/tenant/${tenantId}/customers`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">👤</span>
              <div>
                <p className="font-medium text-gray-900">Clientes</p>
                <p className="text-sm text-gray-500">Ver clientes</p>
              </div>
            </Link>

            <Link
              href={`/advisor/tenant/${tenantId}/settings`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">⚙️</span>
              <div>
                <p className="font-medium text-gray-900">Configuración</p>
                <p className="text-sm text-gray-500">Ajustes de la empresa</p>
              </div>
            </Link>
          </div>
      </div>
    </div>
  );
}
