import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import { VerifyAdvisorButton, RevokeVerificationButton } from '@/components/admin/VerifyAdvisorButton';
import { ApproveRequestButton, RejectRequestButton } from '@/components/admin/AccessRequestButtons';
import { DeleteAdvisorButton, ChangePasswordButton } from '@/components/admin/AdvisorActionButtons';
import { AdvisorSearchBar } from '@/components/admin/AdvisorSearchBar';

const prisma = new PrismaClient();

/**
 * PANEL DE ADMINISTRACIÓN
 * Solo accesible para superadmins
 */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Verificar que es superadmin
  if (!isSuperAdmin(session.user.email)) {
    redirect('/dashboard');
  }

  // Filtros y búsqueda
  const search = params.search || '';
  const filter = params.filter || 'all';

  // Construir where para advisors
  const advisorWhere: any = { accountType: 'advisor' };
  
  if (search) {
    advisorWhere.OR = [
      { users: { some: { email: { contains: search, mode: 'insensitive' } } } },
      { users: { some: { name: { contains: search, mode: 'insensitive' } } } },
      { advisorProfile: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (filter === 'verified') {
    advisorWhere.advisorProfile = { isVerified: true };
  } else if (filter === 'pending') {
    advisorWhere.advisorProfile = { isVerified: false };
  }

  // Obtener estadísticas
  const [advisors, pendingRequests, totalAccounts] = await Promise.all([
    prisma.account.findMany({
      where: advisorWhere,
      include: {
        users: { select: { email: true, name: true } },
        advisorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.accessRequest.findMany({
      where: { status: 'pending' },
      include: {
        requester: { select: { email: true, name: true } },
        tenant: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.account.count(),
  ]);

  const stats = {
    totalAdvisors: await prisma.account.count({ where: { accountType: 'advisor' } }),
    verifiedAdvisors: await prisma.advisorProfile.count({ where: { isVerified: true } }),
    pendingRequests: pendingRequests.length,
    totalAccounts,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-indigo-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                🔧 Panel de Administración
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-indigo-100">
                {session.user.email} (Superadmin)
              </span>
              <Link
                href="/dashboard"
                className="text-sm text-indigo-100 hover:text-white"
              >
                Volver al Dashboard
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Cuentas</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalAccounts}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Gestores</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.totalAdvisors}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Gestores Verificados</div>
            <div className="text-3xl font-bold text-green-600">{stats.verifiedAdvisors}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Solicitudes Pendientes</div>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</div>
          </div>
        </div>

        {/* Solicitudes Pendientes */}
        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Solicitudes de Acceso Pendientes
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((request) => (
                <div key={request.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {request.requester.name || request.requester.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        Solicita acceso a: {request.tenant.businessName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleString('es-ES')}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <ApproveRequestButton requestId={request.id} />
                      <RejectRequestButton requestId={request.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buscador */}
        <AdvisorSearchBar />

        {/* Lista de Advisors */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Gestores Registrados ({advisors.length})
            </h2>
            <Link
              href="/admin/advisors/new"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              + Crear Gestor
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {advisors.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay gestores registrados
              </div>
            ) : (
              advisors.map((advisor) => {
                const user = advisor.users[0];
                const profile = advisor.advisorProfile;
                
                return (
                  <div key={advisor.id} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {user?.name || user?.email}
                          </span>
                          {profile?.isVerified ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              ✓ Verificado
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Pendiente verificación
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.email}
                        </div>
                        {profile?.companyName && (
                          <div className="text-sm text-gray-500">
                            {profile.companyName}
                            {profile.taxId && ` - ${profile.taxId}`}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/advisors/${advisor.id}/edit`}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Editar
                        </Link>
                        {!profile?.isVerified ? (
                          <VerifyAdvisorButton advisorId={advisor.id} />
                        ) : (
                          <RevokeVerificationButton advisorId={advisor.id} />
                        )}
                        <ChangePasswordButton advisorId={advisor.id} />
                        <DeleteAdvisorButton 
                          advisorId={advisor.id} 
                          advisorName={user?.name || user?.email || 'Gestor'} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
