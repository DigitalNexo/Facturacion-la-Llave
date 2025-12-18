/**
 * LAYOUT PARA PÁGINAS DEL GESTOR (SIN TENANT ESPECÍFICO)
 * Solo incluye sidebar de navegación
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@fll/db';
import SidebarNav from '@/components/SidebarNav';

const prisma = new PrismaClient();

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Verificar que el usuario es gestor
  const account = await prisma.account.findFirst({
    where: {
      users: {
        some: { email: session.user.email },
      },
    },
  });

  if (!account || account.accountType !== 'advisor') {
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
