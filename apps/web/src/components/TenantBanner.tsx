'use client';

/**
 * BANNER DE EMPRESA ACTIVA
 * Muestra en color llamativo qué empresa está operando el gestor
 */

interface TenantBannerProps {
  tenantName: string;
  tenantTaxId?: string;
}

export default function TenantBanner({ tenantName, tenantTaxId }: TenantBannerProps) {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🏢</span>
          <div>
            <p className="text-sm font-medium opacity-90">Operando en:</p>
            <p className="text-lg font-bold">
              {tenantName}
              {tenantTaxId && (
                <span className="ml-2 text-sm font-normal opacity-90">
                  (CIF/NIF: {tenantTaxId})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
          <span className="text-sm">⚠️</span>
          <span className="text-sm font-medium">Modo Gestor</span>
        </div>
      </div>
    </div>
  );
}
