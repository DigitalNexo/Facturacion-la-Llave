import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';
import { SignOutButton } from '@/components/SignOutButton';
import SidebarNav from '@/components/SidebarNav';

const prisma = new PrismaClient();

/**
 * DASHBOARD PRINCIPAL
 * Página protegida que requiere autenticación
 */

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener información de la cuenta
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });

  // Calcular días restantes de trial
  let daysLeft = null;
  if (account?.status === 'trialing' && account.trialEndsAt) {
    const now = new Date();
    const diff = account.trialEndsAt.getTime() - now.getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Determinar si es superadmin
  const isSuperAdmin = session.user.email === process.env.SUPERADMIN_EMAILS?.split(',')[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegación */}
      <SidebarNav 
        accountType={account?.accountType || 'company'} 
        isSuperAdmin={isSuperAdmin}
        userEmail={session.user.email}
      />

      {/* Contenido principal */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center lg:ml-0 ml-12">
                <h1 className="text-xl font-bold text-gray-900">
                  Dashboard
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Banner de trial */}
        {account?.status === 'trialing' && daysLeft !== null && (
          <div className={`mb-6 p-4 rounded-lg ${
            daysLeft <= 3 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${
                  daysLeft <= 3 ? 'text-red-800' : 'text-blue-800'
                }`}>
                  Periodo de prueba
                </h3>
                <p className={`text-sm ${
                  daysLeft <= 3 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {daysLeft > 0 
                    ? `Te quedan ${daysLeft} días de prueba gratuita` 
                    : 'Tu periodo de prueba ha terminado'
                  }
                </p>
              </div>
              <Link
                href="/billing"
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  daysLeft <= 3 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Activar suscripción
              </Link>
            </div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bienvenido, {session.user.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Tipo de cuenta</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {session.user.accountType === 'self_employed' && 'Autónomo'}
                  {session.user.accountType === 'company' && 'Empresa'}
                  {session.user.accountType === 'advisor' && 'Gestor'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {account?.status === 'trialing' && 'En prueba'}
                  {account?.status === 'active' && 'Activa'}
                  {account?.status === 'blocked' && 'Bloqueada'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {account?.subscription?.plan?.name || 'Sin plan'}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Acciones rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Empresas/Autónomos: Gestionar gestores */}
                {(account?.accountType === 'company' || account?.accountType === 'self_employed') && (
                  <Link
                    href="/dashboard/gestores"
                    className="p-4 border-2 border-indigo-300 bg-indigo-50 rounded-lg hover:border-indigo-500 hover:shadow-lg transition"
                  >
                    <h4 className="font-medium text-indigo-900">👥 Mis Gestores</h4>
                    <p className="text-sm text-indigo-700 mt-1">Código y permisos</p>
                  </Link>
                )}

                {/* Gestores: Solicitar acceso */}
                {account?.accountType === 'advisor' && (
                  <Link
                    href="/advisor/request-access"
                    className="p-4 border-2 border-green-300 bg-green-50 rounded-lg hover:border-green-500 hover:shadow-lg transition"
                  >
                    <h4 className="font-medium text-green-900">🔑 Solicitar Acceso</h4>
                    <p className="text-sm text-green-700 mt-1">Introducir código</p>
                  </Link>
                )}

                <Link
                  href="/dashboard/tenants"
                  className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow transition"
                >
                  <h4 className="font-medium text-gray-900">Mis empresas</h4>
                  <p className="text-sm text-gray-500 mt-1">Gestionar empresas</p>
                </Link>

                <Link
                  href="/dashboard/invoices"
                  className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow transition"
                >
                  <h4 className="font-medium text-gray-900">Facturas</h4>
                  <p className="text-sm text-gray-500 mt-1">Ver y crear facturas</p>
                </Link>

                <Link
                  href="/dashboard/customers"
                  className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow transition"
                >
                  <h4 className="font-medium text-gray-900">Clientes</h4>
                  <p className="text-sm text-gray-500 mt-1">Gestionar clientes</p>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow transition"
                >
                  <h4 className="font-medium text-gray-900">Configuración</h4>
                  <p className="text-sm text-gray-500 mt-1">Ajustes de cuenta</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
