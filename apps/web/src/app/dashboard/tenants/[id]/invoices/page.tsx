'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/hooks/useConfirm';

interface Invoice {
  id: string;
  fullNumber: string;
  status: string;
  issueDate: string | null;
  total: number;
  customer?: {
    name: string;
  } | null;
  series: {
    code: string;
  };
}

export default function InvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;
  const { success, error: showError } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, [tenantId, statusFilter]);

  const loadInvoices = async () => {
    try {
      const url = statusFilter === 'all' 
        ? `/api/tenants/${tenantId}/invoices`
        : `/api/tenants/${tenantId}/invoices?status=${statusFilter}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar facturas');
      
      const data = await res.json();
      setInvoices(data.invoices);
    } catch (loadErr) {
      showError('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (invoice: Invoice) => {
    const confirmed = await confirm({
      title: 'Emitir factura',
      message: `¿Emitir factura ${invoice.fullNumber}? Una vez emitida no podrá modificarse.`,
      type: 'warning',
      confirmText: 'Emitir',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/issue`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al emitir');
      }

      success('Factura emitida correctamente');
      loadInvoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al emitir';
      showError(message);
    }
  };

  // ❌ ELIMINADO - Según FACTURACION_LA_LLAVE_OBLIGATORIO.md
  // Punto 9: "❌ Prohibido borrar facturas"
  // Las facturas NO se eliminan, solo se rectifican

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800',
      issued: 'bg-green-100 text-green-800',
      rectified: 'bg-blue-100 text-blue-800',
      voided: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      draft: 'Borrador',
      issued: 'Emitida',
      rectified: 'Rectificada',
      voided: 'Anulada',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Cargando facturas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <ConfirmModal />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Facturas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus facturas y emite nuevas
          </p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/tenants/${tenantId}/invoices/new`)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Nueva Factura
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === 'draft' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Borradores
        </button>
        <button
          onClick={() => setStatusFilter('issued')}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === 'issued' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Emitidas
        </button>
      </div>

      {/* Tabla de facturas */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No hay facturas. Crea una para empezar.
                </td>
              </tr>
            ) : (
              invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {inv.fullNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {inv.customer?.name || 'Sin cliente'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {formatCurrency(Number(inv.total))}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(inv.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {inv.status === 'draft' && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/tenants/${tenantId}/invoices/${inv.id}/edit`)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleIssue(inv)}
                            className="text-green-600 hover:underline text-sm"
                          >
                            Emitir
                          </button>
                        </>
                      )}
                      {inv.status === 'issued' && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Ver
                          </button>
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline text-sm"
                          >
                            PDF
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {invoices.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <p>Total: {invoices.length} factura(s)</p>
        </div>
      )}
    </div>
  );
}
