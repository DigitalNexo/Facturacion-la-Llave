import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * PÁGINA DE SERIES CONSOLIDADA
 * Muestra todas las series de facturación de todos los tenants
 */

export default async function SeriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener tenants con sus series
  const tenants = await prisma.tenant.findMany({
    where: {
      accountId: session.user.accountId,
    },
    include: {
      invoiceSeries: {
        orderBy: {
          code: 'asc',
        },
      },
    },
  });

  // Si solo tiene un tenant, redirigir directamente
  if (tenants.length === 1) {
    redirect(`/dashboard/tenants/${tenants[0].id}/series`);
  }

  // Consolidar todas las series
  const allSeries = tenants.flatMap(tenant => 
    tenant.invoiceSeries.map(series => ({
      ...series,
      tenantName: tenant.businessName,
      tenantId: tenant.id,
    }))
  );

  return (
    <>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center lg:ml-0 ml-12">
              <h1 className="text-xl font-bold text-gray-900">
                Series de facturación
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Todas las series
                </h1>
                <Link
                  href="/dashboard/tenants"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Seleccionar empresa
                </Link>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Mostrando series de {tenants.length} empresas
              </p>
            </div>

            {allSeries.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay series
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona una empresa para crear tu primera serie
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/tenants"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Ver empresas
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Siguiente número
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allSeries.map((series) => (
                      <tr key={series.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {series.tenantName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {series.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {series.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {series.currentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/tenants/${series.tenantId}/series`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Gestionar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumen por empresa */}
          {tenants.length > 1 && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {tenant.businessName}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{tenant.invoiceSeries.length} series</p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/tenants/${tenant.id}/series`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Gestionar series →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
