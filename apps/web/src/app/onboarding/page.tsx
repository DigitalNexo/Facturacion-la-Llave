'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * ONBOARDING - REGISTRO CON INVITACIÓN
 * Para empresas invitadas por gestores
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterWithInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Cargando...</div></div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    name: '',
    tenantName: '',
    tenantTaxId: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setError('Token de invitación no encontrado');
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invitations/validate?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Token inválido');
        }

        setInvitation(data.invitation);
        setFormData((prev) => ({
          ...prev,
          tenantName: data.invitation.businessName || '',
        }));
      } catch (err: any) {
        setError(err.message || 'Error al validar invitación');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register-with-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
          name: formData.name,
          tenantName: formData.tenantName,
          tenantTaxId: formData.tenantTaxId,
          phone: formData.phone,
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear cuenta');
      }

      // Redirigir al login
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Error al crear cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Validando invitación...</div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invitación no válida
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/register"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Ir al registro normal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido a La Llave
            </h1>
            <p className="mt-2 text-gray-600">
              Has sido invitado por <strong>{invitation?.invitedBy}</strong> a unirte a nuestra plataforma.
            </p>
            {invitation?.message && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-900">{invitation.message}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información Personal
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={invitation?.email || ''}
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Información de la Empresa */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información de la Empresa
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de la empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CIF/NIF *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tenantTaxId}
                    onChange={(e) => setFormData({ ...formData, tenantTaxId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                ✓ Beneficios de tu invitación:
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Activación inmediata sin período de prueba</li>
                <li>• Facturación habilitada desde el inicio</li>
                <li>• Acceso completo a todas las funcionalidades</li>
                <li>• Soporte prioritario de tu gestor</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-indigo-600 text-white text-lg font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
