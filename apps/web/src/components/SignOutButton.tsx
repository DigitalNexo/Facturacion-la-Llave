'use client';

/**
 * BOTÓN DE CERRAR SESIÓN
 * Usa signOut de next-auth/react para cerrar sesión correctamente
 */

import { signOut } from 'next-auth/react';

interface SignOutButtonProps {
  className?: string;
  showText?: boolean;
}

export function SignOutButton({ className, showText = true }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={className || "text-sm text-red-600 hover:text-red-500"}
      title="Cerrar sesión"
    >
      <span className="text-xl">🚪</span>
      {showText && <span className="ml-3">Cerrar Sesión</span>}
    </button>
  );
}
