import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * PÁGINA DE FACTURAS CONSOLIDADA
 * Muestra todas las facturas de todos los tenants del usuario
 */

export default async function InvoicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener tenants del usuario
  const tenants = await prisma.tenant.findMany({
    where: {
      accountId: session.user.accountId,
    },
    include: {
      invoices: {
        include: {
          customer: true,
          series: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limitar a las últimas 50
      },
    },
  });

  // Si solo tiene un tenant, redirigir directamente
  if (tenants.length === 1) {
    redirect(`/dashboard/tenants/${tenants[0].id}/invoices`);
  }

  // Consolidar todas las facturas
  const allInvoices = tenants.flatMap(tenant => 
    tenant.invoices.map(invoice => ({
      ...invoice,
      tenantName: tenant.name,
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
                Todas las facturas
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
                  Todas las facturas
                </h1>
                <Link
                  href="/dashboard/tenants"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Seleccionar empresa
                </Link>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Mostrando facturas de {tenants.length} empresas
              </p>
            </div>

            {allInvoices.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay facturas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona una empresa para crear tu primera factura
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
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.tenantName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.series?.code}-{invoice.currentNumber || '---'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.customer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.date ? new Date(invoice.date).toLocaleDateString('es-ES') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {invoice.totalAmount ? `${Number(invoice.totalAmount).toFixed(2)} €` : '0.00 €'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              invoice.status === 'emitted'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : invoice.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {invoice.status === 'emitted' && 'Emitida'}
                            {invoice.status === 'draft' && 'Borrador'}
                            {invoice.status === 'cancelled' && 'Cancelada'}
                            {invoice.status === 'rectified' && 'Rectificada'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/tenants/${invoice.tenantId}/invoices`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Ver detalles
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
                      {tenant.name}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{tenant.invoices.length} facturas</p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/tenants/${tenant.id}/invoices`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Ver facturas →
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
