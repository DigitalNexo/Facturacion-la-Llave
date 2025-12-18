'use client';

/**
 * BOTONES PARA GESTIONAR ACCESS REQUESTS
 * Componentes client-side para aprobar/rechazar solicitudes
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ApproveRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('¿Aprobar esta solicitud de acceso?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aprobar');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al aprobar solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={isLoading}
      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
    >
      {isLoading ? 'Aprobando...' : 'Aprobar'}
    </button>
  );
}

export function RejectRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleReject = async () => {
    const reason = prompt('Motivo de rechazo (opcional):');
    if (reason === null) return; // Usuario canceló

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/access-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al rechazar');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al rechazar solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleReject}
      disabled={isLoading}
      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
    >
      {isLoading ? 'Rechazando...' : 'Rechazar'}
    </button>
  );
}
