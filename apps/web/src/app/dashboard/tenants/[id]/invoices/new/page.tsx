'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

interface Series {
  id: string;
  code: string;
  name: string | null;
  isActive: boolean;
}

interface Customer {
  id: string;
  name: string;
  taxId: string;
}

interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function NewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;
  const { success, error: showError, warning } = useToast();

  const [series, setSeries] = useState<Series[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    seriesId: '',
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 21 },
  ]);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      // Cargar series
      const seriesRes = await fetch(`/api/tenants/${tenantId}/series`);
      if (seriesRes.ok) {
        const seriesData = await seriesRes.json();
        const activeSeries = seriesData.series.filter((s: Series) => s.isActive);
        setSeries(activeSeries);
        
        // Seleccionar serie por defecto
        const defaultSeries = activeSeries.find((s: Series) => (s as Series & { isDefault: boolean }).isDefault);
        if (defaultSeries) {
          setFormData(prev => ({ ...prev, seriesId: defaultSeries.id }));
        }
      }

      // Cargar clientes
      const customersRes = await fetch(`/api/tenants/${tenantId}/customers`);
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.customers || []);
      }
    } catch (loadErr) {
      showError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 21 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) {
      warning('Debe haber al menos una línea');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const calculateLineTotal = (line: InvoiceLine) => {
    const subtotal = line.quantity * line.unitPrice;
    const tax = subtotal * (line.taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    lines.forEach(line => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineTax = lineSubtotal * (line.taxRate / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;
    });

    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleSubmit = async (e: React.FormEvent, shouldIssue: boolean = false) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validaciones
      if (!formData.seriesId) {
        throw new Error('Debe seleccionar una serie');
      }

      if (!formData.issueDate) {
        throw new Error('Debe especificar la fecha de emisión');
      }

      const hasEmptyLines = lines.some(l => !l.description.trim());
      if (hasEmptyLines) {
        throw new Error('Todas las líneas deben tener descripción');
      }

      // Crear factura
      const res = await fetch(`/api/tenants/${tenantId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerId: formData.customerId || undefined,
          dueDate: formData.dueDate || undefined,
          lines,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al crear factura');
      }

      const data = await res.json();
      const invoiceId = data.invoice.id;

      // Si debe emitirse, hacerlo ahora
      if (shouldIssue) {
        const issueRes = await fetch(`/api/invoices/${invoiceId}/issue`, {
          method: 'POST',
        });

        if (!issueRes.ok) {
          const errData = await issueRes.json();
          throw new Error(errData.error || 'Error al emitir factura');
        }

        success('Factura creada y emitida');
      } else {
        success('Borrador creado');
      }

      router.push(`/dashboard/tenants/${tenantId}/invoices`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear factura';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Factura</h1>
        <p className="text-gray-600 mt-1">
          Crea un borrador o emite directamente
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Datos generales */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Datos Generales</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Serie *
              </label>
              <select
                value={formData.seriesId}
                onChange={(e) => setFormData({ ...formData, seriesId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Seleccionar serie...</option>
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} {s.name ? `- ${s.name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cliente
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Sin cliente</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.taxId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha Emisión *
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Líneas */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Líneas de Factura</h2>
            <button
              type="button"
              onClick={addLine}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Añadir línea
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder="Cant."
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="Precio"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder="IVA %"
                    value={line.taxRate}
                    onChange={(e) => updateLine(index, 'taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div className="w-32 px-3 py-2 bg-gray-50 rounded text-right">
                  {calculateLineTotal(line).toFixed(2)} €
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  disabled={lines.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA:</span>
                <span className="font-medium">{totals.taxAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{totals.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creando...' : 'Guardar Borrador'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Creando...' : 'Crear y Emitir'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
