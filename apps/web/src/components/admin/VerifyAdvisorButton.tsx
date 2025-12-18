'use client';

/**
 * BOTÓN PARA VERIFICAR ADVISOR
 * Componente client-side para llamar a la API
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function VerifyAdvisorButton({ advisorId }: { advisorId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!confirm('¿Verificar este gestor?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}/verify`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al verificar');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al verificar gestor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={isLoading}
      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
    >
      {isLoading ? 'Verificando...' : 'Verificar'}
    </button>
  );
}

export function RevokeVerificationButton({ advisorId }: { advisorId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRevoke = async () => {
    if (!confirm('¿Revocar verificación de este gestor?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}/verify`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al revocar');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al revocar verificación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRevoke}
      disabled={isLoading}
      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
    >
      {isLoading ? 'Revocando...' : 'Revocar'}
    </button>
  );
}
