'use client';

/**
 * BOTÓN DE COPIAR AL PORTAPAPELES
 * Para copiar enlaces de invitación
 */

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
    >
      {copied ? '✓ Copiado' : 'Copiar enlace'}
    </button>
  );
}
