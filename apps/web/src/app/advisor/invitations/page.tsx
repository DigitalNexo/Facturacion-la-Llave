/**
 * DASHBOARD DE INVITACIONES
 * Lista de invitaciones creadas por el gestor
 */

import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();
import CopyButton from '@/components/advisor/CopyButton';

export default async function InvitationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Verificar que es advisor
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
    select: { accountType: true },
  });

  if (account?.accountType !== 'advisor') {
    redirect('/dashboard');
  }

  // Obtener invitaciones
  const invitations = await prisma.invitation.findMany({
    where: { invitedBy: session.user.id },
    include: {
      inviter: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Estadísticas
  const stats = {
    total: invitations.length,
    pending: invitations.filter((inv: any) => inv.status === 'pending' && new Date(inv.expiresAt) > new Date()).length,
    accepted: invitations.filter((inv: any) => inv.status === 'accepted').length,
    expired: invitations.filter((inv: any) => inv.status === 'pending' && new Date(inv.expiresAt) <= new Date()).length,
  };

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Invitaciones</h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestiona las invitaciones enviadas a nuevas empresas
            </p>
          </div>
          <Link
            href="/advisor/invitations/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Nueva Invitación
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Pendientes</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Aceptadas</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.accepted}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Expiradas</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{stats.expired}</div>
          </div>
        </div>

        {/* Lista de invitaciones */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No has enviado ninguna invitación aún</p>
              <Link
                href="/advisor/invitations/new"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
              >
                Crear primera invitación →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email / Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Envío
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expira
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enlace
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invitation: any) => {
                    const isExpired =
                      invitation.status === 'pending' &&
                      new Date(invitation.expiresAt) <= new Date();
                    const metadata = invitation.metadata as any;
                    const invitationUrl = `${baseUrl}/onboarding?token=${invitation.token}`;

                    return (
                      <tr key={invitation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {metadata?.businessName || 'Sin nombre'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {invitation.status === 'accepted' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Aceptada
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Expirada
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invitation.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invitation.expiresAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {invitation.status === 'pending' && !isExpired ? (
                            <CopyButton text={invitationUrl} />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
