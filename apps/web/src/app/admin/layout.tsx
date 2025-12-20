import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@fll/db';
import SidebarNav from '@/components/SidebarNav';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

/**
 * LAYOUT DEL ADMIN
 * Incluye el SidebarNav en todas las páginas del admin
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Verificar que es superadmin
  if (!isSuperAdmin(session.user.email)) {
    redirect('/dashboard');
  }

  // Obtener información de la cuenta
  const account = await prisma.account.findUnique({
    where: { id: session.user.accountId },
  });

  if (!account) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegación */}
      <SidebarNav 
        accountType={account.accountType || 'company'} 
        isSuperAdmin={true}
        userEmail={session.user.email}
      />

      {/* Contenido principal */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
