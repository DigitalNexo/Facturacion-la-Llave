'use client';

/**
 * BOTÓN DE CERRAR SESIÓN
 * Usa signOut de next-auth/react para cerrar sesión correctamente
 */

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm text-red-600 hover:text-red-500"
    >
      Cerrar sesión
    </button>
  );
}
