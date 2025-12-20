/**
 * PÁGINA: GESTIÓN DE TENANTS (EMPRESA/AUTÓNOMO)
 * /dashboard/tenants
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@fll/db';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function TenantsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Obtener cuenta
  const account = await prisma.account.findFirst({
    where: {
      users: {
        some: { email: session.user.email },
      },
    },
    include: {
      tenants: {
        orderBy: { createdAt: 'desc' },
      },
      subscription: {
        include: { plan: true },
      },
    },
  });

  if (!account) {
    redirect('/login');
  }

  // Solo empresa y autónomo pueden acceder
  if (account.accountType === 'advisor') {
    redirect('/advisor/companies');
  }

  const maxTenants = account.subscription?.plan.maxTenants;
  const canCreateMore = !maxTenants || account.tenants.length < maxTenants;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Empresas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los datos fiscales de tus empresas
            {maxTenants !== null && (
              <span className="ml-2 text-indigo-600 font-medium">
                ({account.tenants.length}/{maxTenants})
              </span>
            )}
          </p>
        </div>
        {canCreateMore && (
          <Link
            href="/dashboard/tenants/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ➕ Nueva Empresa
          </Link>
        )}
      </div>

      {!canCreateMore && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-800">
            Has alcanzado el límite de empresas de tu plan. Actualiza tu suscripción para agregar más.
          </p>
        </div>
      )}

      {account.tenants.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes empresas registradas
          </h2>
          <p className="text-gray-600 mb-6">
            Crea tu primera empresa para comenzar a facturar
          </p>
          <Link
            href="/dashboard/tenants/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Crear primera empresa
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {account.tenants.map((tenant: any) => (
            <div
              key={tenant.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {tenant.businessName}
                  </h3>
                  {tenant.tradeName && (
                    <p className="text-sm text-gray-500 mb-2">
                      Nombre comercial: {tenant.tradeName}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    CIF/NIF: {tenant.taxId}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tenant.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {tenant.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {tenant.address && (
                <p className="text-sm text-gray-600 mb-4">
                  📍 {tenant.address}
                  {tenant.postalCode && `, ${tenant.postalCode}`}
                  {tenant.city && `, ${tenant.city}`}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/tenants/${tenant.id}/edit`}
                  className="flex-1 text-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                >
                  Editar
                </Link>
                <Link
                  href={`/dashboard/tenants/${tenant.id}`}
                  className="flex-1 text-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
                >
                  Ver detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
