/**
 * GESTORES - PANEL DE CONTROL
 * Empresas/Autónomos gestionan acceso de sus gestores
 */

import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@fll/db';
import Link from 'next/link';
import CopyButton from '@/components/advisor/CopyButton';
import RevokeAdvisorButton from '@/components/company/RevokeAdvisorButton';

const prisma = new PrismaClient();

export default async function AdvisorsManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener cuenta del usuario
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
    select: {
      id: true,
      accountType: true,
      invitationCode: true,
    },
  });

  // Solo empresas y autónomos pueden ver esta página
  if (!account || account.accountType === 'advisor') {
    redirect('/dashboard');
  }

  // Obtener tenant del usuario
  const userTenant = await prisma.tenantAccess.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    include: {
      tenant: true,
    },
  });

  if (!userTenant) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-red-600">No tienes una empresa asociada</p>
        </div>
      </div>
    );
  }

  // Obtener gestores con acceso a este tenant
  const advisorAccesses = await prisma.tenantAccess.findMany({
    where: {
      tenantId: userTenant.tenantId,
      user: {
        account: {
          accountType: 'advisor',
        },
      },
      isActive: true,
    },
    include: {
      user: {
        include: {
          account: {
            include: {
              advisorProfile: true,
            },
          },
        },
      },
    },
    orderBy: {
      grantedAt: 'desc',
    },
  });

  // Obtener solicitudes pendientes
  const pendingRequests = await prisma.accessRequest.findMany({
    where: {
      tenantId: userTenant.tenantId,
      status: 'pending',
    },
    include: {
      requester: {
        include: {
          account: {
            include: {
              advisorProfile: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Gestores</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona quién tiene acceso a tu empresa
          </p>
        </div>

        {/* Código de invitación */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Código de Invitación
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Comparte este código con tu gestor para que pueda solicitar acceso a tu empresa
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                readOnly
                value={account.invitationCode || 'Generando...'}
                className="w-full px-4 py-3 text-2xl font-mono font-bold text-center bg-gray-50 border-2 border-gray-300 rounded-lg"
              />
            </div>
            {account.invitationCode && (
              <CopyButton text={account.invitationCode} />
            )}
          </div>
        </div>

        {/* Solicitudes pendientes */}
        {pendingRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Solicitudes Pendientes ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.requester.name || request.requester.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.requester.account.advisorProfile?.companyName || 'Gestor'}
                    </p>
                    {request.message && (
                      <p className="text-sm text-gray-500 mt-1">{request.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Solicitado el{' '}
                      {new Date(request.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form
                      action={`/api/company/access-requests/${request.id}/approve`}
                      method="POST"
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Aprobar
                      </button>
                    </form>
                    <form
                      action={`/api/company/access-requests/${request.id}/reject`}
                      method="POST"
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de gestores con acceso */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Gestores con Acceso ({advisorAccesses.length})
            </h2>
          </div>

          {advisorAccesses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No hay gestores con acceso a tu empresa
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Comparte tu código de invitación con tu gestor para empezar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Gestor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acceso desde
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {advisorAccesses.map((access: any) => (
                    <tr key={access.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {access.user.name || access.user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {access.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {access.user.account.advisorProfile?.companyName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(access.grantedAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <RevokeAdvisorButton
                          accessId={access.id}
                          advisorName={access.user.name || access.user.email}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500"
          >
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
