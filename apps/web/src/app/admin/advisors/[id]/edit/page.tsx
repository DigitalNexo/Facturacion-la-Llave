'use client';

/**
 * FORMULARIO PARA EDITAR ADVISOR
 * Solo accesible para superadmins
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdvisorData {
  id: string;
  email: string;
  name: string;
  companyName: string;
  taxId: string;
  professionalNumber: string;
}

export default function EditAdvisorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: advisorId } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<AdvisorData>({
    id: '',
    email: '',
    name: '',
    companyName: '',
    taxId: '',
    professionalNumber: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del advisor
  useEffect(() => {
    const fetchAdvisor = async () => {
      try {
        const response = await fetch('/api/admin/advisors');
        if (!response.ok) throw new Error('Error al cargar advisors');

        const data = await response.json();
        const advisor = data.advisors.find((a: any) => a.id === advisorId);

        if (!advisor) throw new Error('Advisor no encontrado');

        setFormData({
          id: advisor.id,
          email: advisor.email,
          name: advisor.name || '',
          companyName: advisor.profile?.companyName || '',
          taxId: advisor.profile?.taxId || '',
          professionalNumber: advisor.profile?.professionalNumber || '',
        });
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvisor();
  }, [advisorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/advisors/${advisorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          companyName: formData.companyName,
          taxId: formData.taxId,
          professionalNumber: formData.professionalNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar gestor');
      }

      // Éxito - redirigir al panel
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar gestor');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <Link
              href="/admin/dashboard"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Volver al Panel
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Editar Gestor
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Información de usuario */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información de usuario
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Información profesional */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información profesional
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de la empresa/asesoría
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CIF/NIF
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de colegiado/profesional
                  </label>
                  <input
                    type="text"
                    value={formData.professionalNumber}
                    onChange={(e) => setFormData({ ...formData, professionalNumber: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
