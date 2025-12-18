'use client';

/**
 * MENÚ DE NAVEGACIÓN LATERAL RETRÁCTIL
 * Se adapta según el tipo de cuenta del usuario
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SignOutButton } from './SignOutButton';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  allowedTypes: ('superadmin' | 'advisor' | 'company' | 'self_employed')[];
}

const navItems: NavItem[] = [
  // Superadmin
  { name: 'Panel Admin', href: '/admin/dashboard', icon: '👑', allowedTypes: ['superadmin'] },
  
  // Gestor - Solo ve sus empresas asignadas
  { name: 'Mis Empresas', href: '/advisor/companies', icon: '🏢', allowedTypes: ['advisor'] },
  { name: 'Solicitar Acceso', href: '/advisor/request-access', icon: '🔑', allowedTypes: ['advisor'] },
  
  // Empresa/Autónomo
  { name: 'Dashboard', href: '/dashboard', icon: '🏠', allowedTypes: ['company', 'self_employed'] },
  { name: 'Mis Gestores', href: '/dashboard/gestores', icon: '👥', allowedTypes: ['company', 'self_employed'] },
  { name: 'Empresas', href: '/dashboard/tenants', icon: '🏢', allowedTypes: ['company', 'self_employed'] },
  { name: 'Facturas', href: '/dashboard/invoices', icon: '📄', allowedTypes: ['company', 'self_employed'] },
  { name: 'Clientes', href: '/dashboard/customers', icon: '👤', allowedTypes: ['company', 'self_employed'] },
  
  // Todos
  { name: 'Configuración', href: '/dashboard/settings', icon: '⚙️', allowedTypes: ['advisor', 'company', 'self_employed'] },
];

interface SidebarNavProps {
  accountType: 'superadmin' | 'advisor' | 'company' | 'self_employed';
  isSuperAdmin?: boolean;
  userEmail: string;
}

export default function SidebarNav({ accountType, isSuperAdmin, userEmail }: SidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filtrar items según tipo de cuenta
  const userType = isSuperAdmin ? 'superadmin' : accountType;
  const filteredItems = navItems.filter(item => 
    item.allowedTypes.includes(userType as any)
  );

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg"
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header con botón colapsar */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <h2 className="text-xl font-bold text-gray-900">
                  La Llave
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {userType === 'superadmin' && 'Superadmin'}
                  {userType === 'advisor' && 'Gestor'}
                  {userType === 'company' && 'Empresa'}
                  {userType === 'self_employed' && 'Autónomo'}
                </p>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isCollapsed ? 'Expandir' : 'Contraer'}
              >
                {isCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center rounded-lg transition-colors
                    ${isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'}
                    ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Usuario y Cerrar Sesión */}
          <div className="p-4 border-t space-y-2">
            {/* Email del usuario */}
            <div className={`px-4 py-2 bg-gray-50 rounded-lg ${isCollapsed ? 'hidden' : 'block'}`}>
              <p className="text-xs text-gray-500">Usuario</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {userEmail}
              </p>
            </div>

            {/* Botón cerrar sesión */}
            <div className={isCollapsed ? 'flex justify-center' : ''}>
              <SignOutButton 
                className={`
                  w-full flex items-center justify-center rounded-lg transition-colors
                  ${isCollapsed ? 'p-3' : 'px-4 py-3'}
                  text-red-600 hover:bg-red-50
                `}
                showText={!isCollapsed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
