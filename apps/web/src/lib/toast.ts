/**
 * UTILIDAD DE TOASTS/NOTIFICACIONES
 * Sistema simple de notificaciones para el usuario
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  description: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Muestra una notificación toast al usuario
 * Esta es una implementación básica que puede extenderse con una librería
 * como sonner, react-hot-toast, etc.
 */
export function toast(options: ToastOptions): void {
  const { title, description, type = 'info', duration = 5000 } = options;
  
  // Por ahora, usar console para desarrollo
  // En producción, esto se reemplazará por una librería de toasts
  const prefix = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'warning' ? '⚠️' : 
                 'ℹ️';
  
  const message = title ? `${prefix} ${title}: ${description}` : `${prefix} ${description}`;
  
  console.log(message);
  
  // TODO: Implementar toast visual en FASE 10 (UI)
  // Opciones recomendadas:
  // - sonner: https://sonner.emilkowal.ski/
  // - react-hot-toast: https://react-hot-toast.com/
  // - shadcn/ui toast: https://ui.shadcn.com/docs/components/toast
}

/**
 * Atajos para tipos comunes de toast
 */
export const toastHelpers = {
  success: (description: string, title?: string) => 
    toast({ type: 'success', description, title }),
  
  error: (description: string, title?: string) => 
    toast({ type: 'error', description, title }),
  
  warning: (description: string, title?: string) => 
    toast({ type: 'warning', description, title }),
  
  info: (description: string, title?: string) => 
    toast({ type: 'info', description, title }),
};

export default toast;
