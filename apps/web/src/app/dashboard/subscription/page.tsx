import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * PÁGINA DE SUSCRIPCIÓN
 * Muestra el estado de la suscripción y permite gestionarla
 */

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener información de la cuenta
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
    include: {
      subscription: true,
      tenants: true,
    },
  });

  if (!account) {
    redirect('/login');
  }

  const isInTrial = account.trialEndsAt && new Date(account.trialEndsAt) > new Date();
  const trialDaysLeft = isInTrial 
    ? Math.ceil((new Date(account.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center lg:ml-0 ml-12">
              <h1 className="text-xl font-bold text-gray-900">
                Mi suscripción
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Estado de la cuenta */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Estado de la cuenta
              </h2>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Tipo de cuenta</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {account.accountType === 'self_employed' && 'Autónomo'}
                    {account.accountType === 'company' && 'Empresa'}
                    {account.accountType === 'advisor' && 'Gestor'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan actual</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {account.currentPlan || 'Sin plan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="text-lg font-semibold">
                    {account.status === 'active' && (
                      <span className="text-green-600">✓ Activa</span>
                    )}
                    {isInTrial && (
                      <span className="text-blue-600">🎁 En prueba</span>
                    )}
                    {!account.status && (
                      <span className="text-red-600">⚠️ Suspendida</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Empresas activas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {account.tenants.length}
                  </p>
                </div>
              </div>

              {isInTrial && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Período de prueba activo
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Te quedan <strong>{trialDaysLeft} días</strong> de prueba gratuita.
                          {account.trialEndsAt && ` Finaliza el ${new Date(account.trialEndsAt).toLocaleDateString('es-ES')}.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Planes disponibles */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Planes disponibles
              </h2>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan Básico */}
                <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors">
                  <h3 className="text-xl font-bold text-gray-900">Básico</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Para autónomos y pequeñas empresas
                  </p>
                  <p className="mt-4 text-3xl font-bold text-gray-900">
                    29€<span className="text-base text-gray-500">/mes</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Hasta 3 empresas</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Facturas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Gestión de clientes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Soporte por email</span>
                    </li>
                  </ul>
                  <button
                    className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    disabled={account.currentPlan === 'EMPRESA_BASICA'}
                  >
                    {account.currentPlan === 'EMPRESA_BASICA' ? 'Plan actual' : 'Seleccionar'}
                  </button>
                </div>

                {/* Plan Pro */}
                <div className="border-2 border-indigo-500 rounded-lg p-6 relative">
                  <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Para empresas en crecimiento
                  </p>
                  <p className="mt-4 text-3xl font-bold text-gray-900">
                    69€<span className="text-base text-gray-500">/mes</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Hasta 10 empresas</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Facturas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Gestión avanzada</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Multi-gestor</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">Soporte prioritario</span>
                    </li>
                  </ul>
                  <button
                    className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    disabled={account.currentPlan === 'EMPRESA_PRO'}
                  >
                    {account.currentPlan === 'EMPRESA_PRO' ? 'Plan actual' : 'Seleccionar'}
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  ¿Necesitas más información?{' '}
                  <a href="mailto:soporte@lallave.com" className="text-indigo-600 hover:text-indigo-500">
                    Contacta con nosotros
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Información de Stripe */}
          {account.subscription && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalles de suscripción
                </h2>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Estado en Stripe</p>
                    <p className="text-lg font-semibold text-gray-900">
                      Activa
                    </p>
                  </div>
                  {account.subscription.currentPeriodEnd && (
                    <div>
                      <p className="text-sm text-gray-500">Próxima renovación</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(account.subscription.currentPeriodEnd).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Link
                    href="/api/billing/portal"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Gestionar en Stripe →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
