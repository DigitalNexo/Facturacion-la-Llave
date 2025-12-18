'use client';

/**
 * BOTONES DE ACCIONES PARA ADVISORS
 * Eliminar y cambiar contraseña
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/hooks/useConfirm';

export function DeleteAdvisorButton({ advisorId, advisorName }: { advisorId: string; advisorName: string }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '¿Eliminar gestor?',
      message: `¿Estás seguro de eliminar a "${advisorName}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Eliminar',
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      toast.success('Gestor eliminado', `${advisorName} ha sido eliminado correctamente`);
      router.refresh();
    } catch (error: any) {
      toast.error('Error al eliminar', error.message || 'No se pudo eliminar el gestor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? 'Eliminando...' : 'Eliminar'}
      </button>
      <ConfirmModal />
    </>
  );
}

export function ChangePasswordButton({ advisorId }: { advisorId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    const newPassword = prompt('Nueva contraseña (mínimo 8 caracteres):');
    if (!newPassword) return;

    if (newPassword.length < 8) {
      toast.error('Contraseña muy corta', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const mustChange = confirm('¿Forzar cambio de contraseña en el próximo login?');

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, mustChangePassword: mustChange }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      toast.success('Contraseña actualizada', mustChange ? 'El gestor deberá cambiarla en el próximo login' : 'La contraseña ha sido actualizada');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al cambiar contraseña', error.message || 'No se pudo cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleChangePassword}
      disabled={isLoading}
      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
    >
      {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
    </button>
  );
}
