/**
 * PÁGINA: MIS EMPRESAS (GESTOR)
 * Lista todas las empresas a las que el gestor tiene acceso
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@fll/db';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdvisorCompaniesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Buscar cuenta del gestor
  const account = await prisma.account.findFirst({
    where: {
      users: {
        some: {
          email: session.user.email,
        },
      },
    },
    include: {
      users: true,
    },
  });

  if (!account || account.accountType !== 'advisor') {
    redirect('/dashboard');
  }

  // Obtener el userId del primer usuario de la cuenta
  const user = account.users[0];
  if (!user) {
    redirect('/dashboard');
  }

  // Buscar todas las empresas a las que tiene acceso activo
  const tenantAccesses = await prisma.tenantAccess.findMany({
    where: {
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
    orderBy: {
      grantedAt: 'desc',
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Empresas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Empresas a las que tienes acceso como gestor
        </p>
      </div>

        {tenantAccesses.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes empresas asignadas
            </h2>
            <p className="text-gray-600 mb-6">
              Solicita acceso a una empresa usando su código de invitación
            </p>
            <Link
              href="/advisor/request-access"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              🔑 Solicitar Acceso
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenantAccesses.map((access: any) => (
              <div
                key={access.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {access.tenant.businessName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {access.tenant.account.accountType === 'company' ? 'Empresa' : 'Autónomo'}
                    </p>
                    {access.tenant.taxId && (
                      <p className="text-sm text-gray-500">
                        CIF/NIF: {access.tenant.taxId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4 text-xs text-gray-500">
                  <p>Acceso desde: {new Date(access.grantedAt).toLocaleDateString('es-ES')}</p>
                </div>

                <Link
                  href={`/advisor/tenant/${access.tenant.id}/dashboard`}
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Acceder →
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/advisor/request-access"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            ➕ Solicitar acceso a otra empresa
          </Link>
      </div>
    </div>
  );
}
