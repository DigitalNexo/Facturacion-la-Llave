import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

export default async function DebugPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
    include: {
      tenants: true,
      subscription: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">🔍 Información de Debug</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Sesión</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Account</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(account, null, 2)}
              </pre>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Variables de entorno relevantes</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({
                  SUPERADMIN_EMAILS: process.env.SUPERADMIN_EMAILS,
                  NODE_ENV: process.env.NODE_ENV,
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
