'use client';

/**
 * BOTÓN REVOCAR ACCESO DE GESTOR
 * Cliente: Empresa revoca acceso de gestor
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RevokeAdvisorButtonProps {
  accessId: string;
  advisorName: string;
}

export default function RevokeAdvisorButton({
  accessId,
  advisorName,
}: RevokeAdvisorButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRevoke = async () => {
    if (!confirm(`¿Seguro que quieres revocar el acceso a ${advisorName}?`)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/company/advisors/${accessId}/revoke`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al revocar acceso');
      }

      router.refresh();
    } catch (error) {
      alert('Error al revocar acceso');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRevoke}
      disabled={isLoading}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {isLoading ? 'Revocando...' : 'Revocar acceso'}
    </button>
  );
}
