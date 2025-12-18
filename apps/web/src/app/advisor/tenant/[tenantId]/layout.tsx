/**
 * LAYOUT PARA PÁGINAS DE GESTIÓN DE TENANT (GESTOR)
 * Incluye sidebar de navegación y banner de empresa activa
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import SidebarNav from '@/components/SidebarNav';
import TenantBanner from '@/components/TenantBanner';
import CompanySelector from '@/components/CompanySelector';

const prisma = new PrismaClient();

export default async function AdvisorTenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
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
    include: {
      users: true,
    },
  });

  if (!account || account.accountType !== 'advisor') {
    redirect('/dashboard');
  }

  const user = account.users[0];
  if (!user) {
    redirect('/dashboard');
  }

  // Obtener todas las empresas del gestor para el selector
  const allTenantAccesses = await prisma.tenantAccess.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      tenant: true,
    },
  });

  const companies = allTenantAccesses.map(ta => ({
    id: ta.tenant.id,
    name: ta.tenant.businessName,
  }));

  // Verificar que tiene acceso activo a este tenant
  const tenantAccess = await prisma.tenantAccess.findFirst({
    where: {
      tenantId,
      userId: user.id,
      isActive: true,
    },
    include: {
      tenant: true,
    },
  });

  if (!tenantAccess) {
    redirect('/advisor/companies');
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
        {/* Banner de empresa activa */}
        <TenantBanner 
          tenantName={tenantAccess.tenant.businessName}
          tenantTaxId={tenantAccess.tenant.taxId}
        />

        {/* Selector de empresa (si tiene más de una) */}
        {companies.length > 1 && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="text-sm text-gray-600">Cambiar de empresa:</span>
              <CompanySelector companies={companies} currentTenantId={tenantId} />
            </div>
          </div>
        )}

        {/* Contenido de la página */}
        {children}
      </div>
    </div>
  );
}
