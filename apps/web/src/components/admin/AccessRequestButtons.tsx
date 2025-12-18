'use client';

/**
 * BOTONES PARA GESTIONAR ACCESS REQUESTS
 * Componentes client-side para aprobar/rechazar solicitudes
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/hooks/useConfirm';

export function ApproveRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: '¿Aprobar solicitud?',
      message: 'El gestor tendrá acceso completo a la cuenta de la empresa.',
      type: 'info',
      confirmText: 'Aprobar',
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aprobar');
      }

      toast.success('Solicitud aprobada', 'El gestor ya tiene acceso a la empresa');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al aprobar', error.message || 'No se pudo aprobar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleApprove}
        disabled={isLoading}
        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? 'Aprobando...' : 'Aprobar'}
      </button>
      <ConfirmModal />
    </>
  );
}

export function RejectRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  const handleReject = async () => {
    const confirmed = await confirm({
      title: '¿Rechazar solicitud?',
      message: 'El gestor será notificado del rechazo. Esta acción no se puede deshacer.',
      type: 'danger',
      confirmText: 'Rechazar',
    });

    if (!confirmed) return;

    // Pedir motivo opcional
    const reason = prompt('Motivo de rechazo (opcional):');

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

      toast.warning('Solicitud rechazada', reason || 'La solicitud ha sido rechazada');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al rechazar', error.message || 'No se pudo rechazar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleReject}
        disabled={isLoading}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? 'Rechazando...' : 'Rechazar'}
      </button>
      <ConfirmModal />
    </>
  );
}
