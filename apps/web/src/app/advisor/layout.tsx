import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@fll/db';
import SidebarNav from '@/components/SidebarNav';

const prisma = new PrismaClient();

/**
 * LAYOUT DEL ADVISOR
 * Incluye el SidebarNav en todas las páginas del advisor
 */

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Obtener información de la cuenta
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
  });

  if (!account) {
    redirect('/login');
  }

  // Verificar que es advisor
  if (account.accountType !== 'advisor') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegación */}
      <SidebarNav 
        accountType="advisor" 
        isSuperAdmin={false}
        userEmail={session.user.email}
      />

      {/* Contenido principal */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
