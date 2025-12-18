'use client';

/**
 * SOLICITAR ACCESO A EMPRESA
 * Gestor introduce código de invitación de empresa
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function RequestAccessPage() {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState({
    invitationCode: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.invitationCode.length !== 8) {
      setError('El código debe tener 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/advisor/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationCode: formData.invitationCode.toUpperCase(),
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar acceso');
      }

      toast.success(
        'Solicitud enviada',
        `Tu solicitud ha sido enviada a ${data.request.companyName}. Espera su aprobación.`
      );
      setSuccess(
        `Solicitud enviada a ${data.request.companyName}. Espera su aprobación.`
      );
      setFormData({ invitationCode: '', message: '' });

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al solicitar acceso';
      setError(errorMsg);
      toast.error('Error al solicitar acceso', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Solicitar Acceso a Empresa
            </h1>
            <p className="mt-2 text-gray-600">
              Introduce el código de invitación que te proporcionó la empresa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Invitación *
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={formData.invitationCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invitationCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="ABC12XYZ"
                className="w-full px-4 py-3 text-2xl font-mono font-bold text-center border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase"
              />
              <p className="mt-2 text-sm text-gray-500">
                Código de 8 caracteres proporcionado por la empresa
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje (opcional)
              </label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Ej: Hola, soy tu gestor asignado. Me gustaría acceder a vuestra cuenta para ayudaros con la facturación."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Cómo funciona:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>La empresa te proporciona su código de invitación</li>
                <li>Introduces el código aquí y envías la solicitud</li>
                <li>La empresa recibe tu solicitud y puede aprobarla o rechazarla</li>
                <li>Una vez aprobada, tendrás acceso completo a su cuenta</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={isLoading || success !== ''}
              className="w-full px-4 py-3 bg-indigo-600 text-white text-lg font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading
                ? 'Enviando solicitud...'
                : success
                ? 'Solicitud enviada ✓'
                : 'Enviar Solicitud'}
            </button>
          </form>

          <div className="mt-6">
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500"
            >
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
