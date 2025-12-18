'use client';

/**
 * BOTÓN PARA VERIFICAR ADVISOR
 * Componente client-side para llamar a la API
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/hooks/useConfirm';

export function VerifyAdvisorButton({ advisorId }: { advisorId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    const confirmed = await confirm({
      title: '¿Verificar gestor?',
      message: 'El gestor podrá solicitar acceso a cuentas de empresas.',
      type: 'info',
      confirmText: 'Verificar',
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}/verify`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al verificar');
      }

      toast.success('Gestor verificado', 'El gestor ha sido verificado exitosamente');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al verificar', error.message || 'No se pudo verificar el gestor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleVerify}
        disabled={isLoading}
        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Verificando...' : 'Verificar'}
      </button>
      <ConfirmModal />
    </>
  );
}

export function RevokeVerificationButton({ advisorId }: { advisorId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  const handleRevoke = async () => {
    const confirmed = await confirm({
      title: '¿Revocar verificación?',
      message: 'El gestor perderá su estado de verificado.',
      type: 'warning',
      confirmText: 'Revocar',
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}/verify`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al revocar');
      }

      toast.warning('Verificación revocada', 'El gestor ya no está verificado');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al revocar', error.message || 'No se pudo revocar la verificación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRevoke}
        disabled={isLoading}
        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
      >
        {isLoading ? 'Revocando...' : 'Revocar'}
      </button>
      <ConfirmModal />
    </>
  );
}
