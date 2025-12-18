/**
 * CLIENTES DE UN TENANT (VISTA GESTOR)
 * /advisor/tenant/[tenantId]/customers
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdvisorTenantCustomersPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Verificar acceso del gestor
  const account = await prisma.account.findFirst({
    where: {
      users: { some: { email: session.user.email } },
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

  const tenantAccess = await prisma.tenantAccess.findFirst({
    where: {
      tenantId,
      userId: user.id,
      isActive: true,
    },
    include: {
      tenant: true,
    },
  });

  if (!tenantAccess) {
    redirect('/advisor/companies');
  }

  // Obtener clientes del tenant
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/advisor/tenant/${tenantId}/dashboard`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Volver al Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="mt-2 text-sm text-gray-600">
          Lista de clientes de la empresa
        </p>
      </div>

        {customers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No hay clientes
            </h2>
            <p className="text-gray-600">
              Esta empresa aún no tiene clientes registrados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {customer.name}
                </h3>
                {customer.taxId && (
                  <p className="text-sm text-gray-500 mb-1">
                    CIF/NIF: {customer.taxId}
                  </p>
                )}
                {customer.email && (
                  <p className="text-sm text-gray-500 mb-1">
                    📧 {customer.email}
                  </p>
                )}
                {customer.phone && (
                  <p className="text-sm text-gray-500 mb-1">
                    📞 {customer.phone}
                  </p>
                )}
                {customer.address && (
                  <p className="text-sm text-gray-500 mt-2">
                    📍 {customer.address}
                  </p>
                )}
              </div>
            ))}
        </div>
        )}
    </div>
  );
}
