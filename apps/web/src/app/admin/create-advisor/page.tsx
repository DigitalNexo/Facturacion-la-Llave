import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * PÁGINA DE CREAR GESTOR (ADMIN)
 * Solo accesible por superadmin
 */

export default async function CreateAdvisorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.email === process.env.SUPERADMIN_EMAILS?.split(',')[0];

  if (!isSuperAdmin) {
    redirect('/dashboard');
  }

  return (
    <>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center lg:ml-0 ml-12">
              <h1 className="text-xl font-bold text-gray-900">
                Crear Gestor
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">
                Crear nuevo gestor
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Los gestores pueden solicitar acceso a empresas para gestionarlas
              </p>
            </div>

            <form action="/api/admin/create-advisor" method="POST" className="px-6 py-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña temporal
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    minLength={8}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    El gestor deberá cambiarla en su primer acceso
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <Link
                    href="/admin/dashboard"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    ← Volver
                  </Link>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Crear gestor
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Información adicional */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                  Sobre los gestores
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Los gestores NO pueden auto-registrarse</li>
                    <li>Solo pueden gestionar empresas que les aprueben el acceso</li>
                    <li>No tienen acceso a facturación ni suscripciones</li>
                    <li>Pueden crear facturas y gestionar clientes de las empresas asignadas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
