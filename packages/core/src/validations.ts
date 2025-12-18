/**
 * VALIDACIONES DE LÍMITES DE PLAN
 * Reglas de negocio para controlar límites según tipo de cuenta
 */

import type { AccountType } from './types';

/**
 * Verifica si un email es superadmin
 * Los superadmins están definidos en la variable de entorno SUPERADMIN_EMAILS
 */
export function isSuperAdmin(email: string): boolean {
  const superadminEmails = process.env.SUPERADMIN_EMAILS || '';
  const allowedEmails = superadminEmails.split(',').map(e => e.trim().toLowerCase());
  return allowedEmails.includes(email.toLowerCase());
}

export interface PlanLimits {
  maxTenants: number | null; // null = ilimitado
  maxUsers: number | null;
  maxInvoicesPerMonth: number | null;
  maxStorageMb: number | null;
}

export interface AccountUsage {
  tenantsCount: number;
  usersCount: number;
  invoicesCount: number;
  storageMb: number;
}

/**
 * Límites base por tipo de cuenta (OBLIGATORIO según documento)
 * Estos son los límites mínimos que se aplican SIEMPRE,
 * independientemente del plan contratado.
 */
export const BASE_LIMITS_BY_ACCOUNT_TYPE: Record<AccountType, PlanLimits> = {
  self_employed: {
    maxTenants: 1, // OBLIGATORIO: autónomo solo 1 empresa
    maxUsers: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: null,
  },
  company: {
    maxTenants: null, // Según plan
    maxUsers: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: null,
  },
  advisor: {
    maxTenants: null, // Ilimitado para gestores
    maxUsers: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: null,
  },
};

/**
 * Valida si se puede crear un nuevo tenant para una cuenta
 */
export function canCreateTenant(
  accountType: AccountType,
  currentTenantsCount: number,
  planLimits: PlanLimits | null
): { allowed: boolean; reason?: string } {
  // Obtener límite base del tipo de cuenta
  const baseLimit = BASE_LIMITS_BY_ACCOUNT_TYPE[accountType].maxTenants;

  // Autónomo: SIEMPRE máximo 1 tenant (regla obligatoria)
  if (accountType === 'self_employed') {
    if (currentTenantsCount >= 1) {
      return {
        allowed: false,
        reason: 'Las cuentas de autónomo solo pueden tener 1 empresa',
      };
    }
    return { allowed: true };
  }

  // Gestor: sin límite
  if (accountType === 'advisor') {
    return { allowed: true };
  }

  // Empresa: verificar límite del plan
  if (planLimits?.maxTenants !== null && planLimits?.maxTenants !== undefined) {
    if (currentTenantsCount >= planLimits.maxTenants) {
      return {
        allowed: false,
        reason: `Límite de empresas alcanzado (${planLimits.maxTenants}). Actualiza tu plan.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida si se puede crear un nuevo usuario
 */
export function canCreateUser(
  currentUsersCount: number,
  planLimits: PlanLimits | null
): { allowed: boolean; reason?: string } {
  if (planLimits?.maxUsers !== null && planLimits?.maxUsers !== undefined) {
    if (currentUsersCount >= planLimits.maxUsers) {
      return {
        allowed: false,
        reason: `Límite de usuarios alcanzado (${planLimits.maxUsers}). Actualiza tu plan.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida si se puede crear una nueva factura este mes
 */
export function canCreateInvoice(
  currentMonthInvoicesCount: number,
  planLimits: PlanLimits | null
): { allowed: boolean; reason?: string } {
  if (
    planLimits?.maxInvoicesPerMonth !== null &&
    planLimits?.maxInvoicesPerMonth !== undefined
  ) {
    if (currentMonthInvoicesCount >= planLimits.maxInvoicesPerMonth) {
      return {
        allowed: false,
        reason: `Límite de facturas mensuales alcanzado (${planLimits.maxInvoicesPerMonth}). Actualiza tu plan.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida si hay espacio de almacenamiento disponible
 */
export function hasStorageAvailable(
  currentStorageMb: number,
  planLimits: PlanLimits | null
): { allowed: boolean; reason?: string } {
  if (planLimits?.maxStorageMb !== null && planLimits?.maxStorageMb !== undefined) {
    if (currentStorageMb >= planLimits.maxStorageMb) {
      return {
        allowed: false,
        reason: `Límite de almacenamiento alcanzado (${planLimits.maxStorageMb} MB). Actualiza tu plan.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida todos los límites de una vez
 */
export function validateAllLimits(
  accountType: AccountType,
  usage: AccountUsage,
  planLimits: PlanLimits | null
): {
  canCreateTenant: boolean;
  canCreateUser: boolean;
  canCreateInvoice: boolean;
  hasStorage: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const tenantCheck = canCreateTenant(accountType, usage.tenantsCount, planLimits);
  const userCheck = canCreateUser(usage.usersCount, planLimits);
  const invoiceCheck = canCreateInvoice(usage.invoicesCount, planLimits);
  const storageCheck = hasStorageAvailable(usage.storageMb, planLimits);

  if (!tenantCheck.allowed && tenantCheck.reason) errors.push(tenantCheck.reason);
  if (!userCheck.allowed && userCheck.reason) errors.push(userCheck.reason);
  if (!invoiceCheck.allowed && invoiceCheck.reason) errors.push(invoiceCheck.reason);
  if (!storageCheck.allowed && storageCheck.reason) errors.push(storageCheck.reason);

  return {
    canCreateTenant: tenantCheck.allowed,
    canCreateUser: userCheck.allowed,
    canCreateInvoice: invoiceCheck.allowed,
    hasStorage: storageCheck.allowed,
    errors,
  };
}
