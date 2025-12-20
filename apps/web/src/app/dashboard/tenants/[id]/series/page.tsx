'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/hooks/useConfirm';

interface Series {
  id: string;
  code: string;
  name: string | null;
  prefix: string | null;
  currentNumber: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function SeriesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;
  const { success, error: showError } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    prefix: '',
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    loadSeries();
  }, [tenantId]);

  const loadSeries = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/series`);
      if (!res.ok) throw new Error('Error al cargar series');
      
      const data = await res.json();
      setSeries(data.series);
    } catch (err) {
      showError('Error al cargar series');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSeries
        ? `/api/series/${editingSeries.id}`
        : `/api/tenants/${tenantId}/series`;
      
      const method = editingSeries ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar');
      }

      success(
        editingSeries ? 'Serie actualizada' : 'Serie creada'
      );
      
      resetForm();
      loadSeries();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      showError(message);
    }
  };

  const handleEdit = (s: Series) => {
    setEditingSeries(s);
    setFormData({
      code: s.code,
      name: s.name || '',
      prefix: s.prefix || '',
      isDefault: s.isDefault,
      isActive: s.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (s: Series) => {
    const confirmed = await confirm({
      title: 'Eliminar serie',
      message: `¿Estás seguro de eliminar la serie "${s.code}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/series/${s.id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      success('Serie eliminada');
      loadSeries();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      showError(message);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      prefix: '',
      isDefault: false,
      isActive: true,
    });
    setEditingSeries(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Cargando series...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <ConfirmModal />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Series de Facturación</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las series para numeración de facturas
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Nueva Serie
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mb-6 bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSeries ? 'Editar Serie' : 'Nueva Serie'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                  maxLength={20}
                  placeholder="Ej: 2024, 2024-A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Prefijo
                </label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  maxLength={10}
                  placeholder="Ej: FRA, RECT"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Descripción de la serie"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Serie por defecto</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Activa</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingSeries ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de series */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prefijo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Número Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {series.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No hay series creadas. Crea una para empezar a facturar.
                </td>
              </tr>
            ) : (
              series.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium">{s.code}</span>
                    {s.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Por defecto
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.prefix || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.currentNumber}
                  </td>
                  <td className="px-6 py-4">
                    {s.isActive ? (
                      <span className="text-green-600">● Activa</span>
                    ) : (
                      <span className="text-gray-400">● Inactiva</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>💡 <strong>Consejo:</strong> Crea al menos una serie antes de emitir facturas.</p>
        <p className="mt-1">
          La numeración es correlativa y automática. El número actual indica el último número usado.
        </p>
      </div>
    </div>
  );
}
