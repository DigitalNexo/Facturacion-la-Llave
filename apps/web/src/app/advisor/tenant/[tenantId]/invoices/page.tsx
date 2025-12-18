/**
 * FACTURAS DE UN TENANT (VISTA GESTOR)
 * /advisor/tenant/[tenantId]/invoices
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdvisorTenantInvoicesPage({
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

  // Obtener facturas del tenant
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: {
      customer: true,
      series: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
    take: 50,
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
        <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestión de facturas de la empresa
        </p>
      </div>

        {invoices.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No hay facturas
            </h2>
            <p className="text-gray-600">
              Esta empresa aún no tiene facturas registradas
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.series?.prefix || ''}{invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.customer?.name || invoice.customer?.businessName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.total.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'issued'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.status === 'issued' ? 'Emitida' : invoice.status === 'draft' ? 'Borrador' : invoice.status === 'voided' ? 'Anulada' : 'Rectificada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        )}
    </div>
  );
}
