'use client';

/**
 * SELECTOR DE EMPRESA PARA GESTOR
 * Dropdown para cambiar rápidamente entre empresas asignadas
 */

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface Company {
  id: string;
  name: string;
}

interface CompanySelectorProps {
  companies: Company[];
  currentTenantId?: string;
}

export default function CompanySelector({ companies, currentTenantId }: CompanySelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentCompany = companies.find(c => c.id === currentTenantId);

  const handleSelectCompany = (tenantId: string) => {
    setIsOpen(false);
    router.push(`/advisor/tenant/${tenantId}/dashboard`);
  };

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">
          {currentCompany ? currentCompany.name : 'Seleccionar empresa'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Cambiar a:
              </div>
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    company.id === currentTenantId
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {company.name}
                  {company.id === currentTenantId && (
                    <span className="ml-2 text-indigo-600">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/advisor/companies');
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Ver todas las empresas →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
