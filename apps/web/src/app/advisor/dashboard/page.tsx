import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * DASHBOARD DEL GESTOR
 * Vista principal para usuarios con rol advisor
 */

export default async function AdvisorDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener cuenta del gestor
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
  });

  if (!account || account.accountType !== 'advisor') {
    redirect('/dashboard');
  }

  // Obtener empresas asignadas al gestor
  const tenantAccess = await prisma.tenantAccess.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      tenant: {
        include: {
          invoices: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
          customers: true,
        },
      },
    },
  });

  // Solicitudes pendientes
  const pendingRequests = await prisma.accessRequest.findMany({
    where: {
      requesterId: session.user.id,
      status: 'pending',
    },
    include: {
      tenant: true,
    },
  });

  return (
    <>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center lg:ml-0 ml-12">
              <h1 className="text-xl font-bold text-gray-900">
                Dashboard del Gestor
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <span className="text-white text-2xl">🏢</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Empresas gestionadas
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {tenantAccess.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <span className="text-white text-2xl">⏳</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Solicitudes pendientes
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {pendingRequests.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <span className="text-white text-2xl">📄</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Facturas totales
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {tenantAccess.reduce((acc, ta) => acc + ta.tenant.invoices.length, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solicitudes pendientes */}
          {pendingRequests.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  Solicitudes pendientes
                </h2>
              </div>
              <div className="px-6 py-4">
                <ul className="divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                    <li key={request.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.tenant.businessName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Solicitado el {new Date(request.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Empresas gestionadas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">
                  Mis empresas
                </h2>
                <Link
                  href="/advisor/request-access"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Solicitar nuevo acceso
                </Link>
              </div>
            </div>

            {tenantAccess.length === 0 ? (
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No gestionas ninguna empresa
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Solicita acceso a una empresa para comenzar
                </p>
                <div className="mt-6">
                  <Link
                    href="/advisor/request-access"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Solicitar acceso
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tenantAccess.map((access) => (
                    <div
                      key={access.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        {access.tenant.businessName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        NIF: {access.tenant.taxId}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Facturas</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {access.tenant.invoices.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Clientes</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {access.tenant.customers.length}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/advisor/tenant/${access.tenant.id}/invoices`}
                          className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          Facturas
                        </Link>
                        <Link
                          href={`/advisor/tenant/${access.tenant.id}/customers`}
                          className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                          Clientes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
