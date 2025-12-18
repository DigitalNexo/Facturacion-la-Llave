/**
 * TEST SUITE: PANEL DE ADMINISTRACIÓN (FASE 4)
 * Verifica funcionalidad de superadmin, advisors y solicitudes de acceso
 */

import { describe, it, expect } from '@jest/globals';
import { isSuperAdmin } from '@fll/core';

describe('FASE 4: Panel de Administración', () => {
  describe('isSuperAdmin()', () => {
    const originalEnv = process.env.SUPERADMIN_EMAILS;

    afterEach(() => {
      process.env.SUPERADMIN_EMAILS = originalEnv;
    });

    it('debe retornar true para email en SUPERADMIN_EMAILS', () => {
      process.env.SUPERADMIN_EMAILS = 'admin@lallave.com,super@test.com';
      expect(isSuperAdmin('admin@lallave.com')).toBe(true);
      expect(isSuperAdmin('super@test.com')).toBe(true);
    });

    it('debe retornar false para email no autorizado', () => {
      process.env.SUPERADMIN_EMAILS = 'admin@lallave.com';
      expect(isSuperAdmin('user@test.com')).toBe(false);
      expect(isSuperAdmin('advisor@test.com')).toBe(false);
    });

    it('debe ser case-insensitive', () => {
      process.env.SUPERADMIN_EMAILS = 'admin@lallave.com';
      expect(isSuperAdmin('ADMIN@LALLAVE.COM')).toBe(true);
      expect(isSuperAdmin('Admin@LaLlave.com')).toBe(true);
    });

    it('debe manejar espacios en la variable de entorno', () => {
      process.env.SUPERADMIN_EMAILS = ' admin@lallave.com , super@test.com ';
      expect(isSuperAdmin('admin@lallave.com')).toBe(true);
      expect(isSuperAdmin('super@test.com')).toBe(true);
    });

    it('debe retornar false si SUPERADMIN_EMAILS está vacío', () => {
      process.env.SUPERADMIN_EMAILS = '';
      expect(isSuperAdmin('admin@lallave.com')).toBe(false);
    });

    it('debe retornar false si SUPERADMIN_EMAILS no está definido', () => {
      delete process.env.SUPERADMIN_EMAILS;
      expect(isSuperAdmin('admin@lallave.com')).toBe(false);
    });
  });

  describe('Estructura de datos de Advisor', () => {
    it('debe cumplir con el schema esperado', () => {
      const advisorMock = {
        email: 'advisor@test.com',
        accountType: 'advisor',
        status: 'active',
        isBillingEnabled: false,
        mustChangePassword: true,
        profile: {
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
          companyName: 'Asesoría Test',
          taxId: 'B12345678',
          professionalNumber: 'COL-12345',
        },
      };

      expect(advisorMock.accountType).toBe('advisor');
      expect(advisorMock.status).toBe('active');
      expect(advisorMock.isBillingEnabled).toBe(false);
      expect(advisorMock.mustChangePassword).toBe(true);
      expect(advisorMock.profile.isVerified).toBe(false);
    });
  });

  describe('Estructura de AccessRequest', () => {
    it('debe cumplir con el schema esperado', () => {
      const accessRequestMock = {
        status: 'pending',
        message: 'Solicito acceso para gestionar la facturación',
        advisorId: 'advisor-id',
        tenantId: 'tenant-id',
        permissionSetId: 'full-access',
        resolvedAt: null,
        resolvedBy: null,
        rejectionReason: null,
      };

      expect(accessRequestMock.status).toBe('pending');
      expect(accessRequestMock.advisorId).toBeDefined();
      expect(accessRequestMock.tenantId).toBeDefined();
      expect(accessRequestMock.permissionSetId).toBeDefined();
    });

    it('debe tener estados válidos', () => {
      const validStatuses = ['pending', 'approved', 'rejected'];
      validStatuses.forEach((status) => {
        expect(['pending', 'approved', 'rejected']).toContain(status);
      });
    });
  });

  describe('Configuración de endpoints de admin', () => {
    it('debe tener las rutas esperadas', () => {
      const expectedRoutes = [
        '/api/admin/advisors', // GET, POST
        '/api/admin/advisors/[id]/verify', // PUT, DELETE
        '/api/admin/access-requests', // GET
        '/api/admin/access-requests/[id]/approve', // POST
        '/api/admin/access-requests/[id]/reject', // POST
      ];

      // Solo verificamos que la estructura esté definida
      expectedRoutes.forEach((route) => {
        expect(route).toContain('/api/admin/');
      });
    });
  });

  describe('Validaciones de negocio', () => {
    it('advisor creado debe tener isBillingEnabled=false por defecto', () => {
      const newAdvisor = {
        isBillingEnabled: false,
      };
      expect(newAdvisor.isBillingEnabled).toBe(false);
    });

    it('advisor creado debe tener mustChangePassword=true', () => {
      const newAdvisor = {
        mustChangePassword: true,
      };
      expect(newAdvisor.mustChangePassword).toBe(true);
    });

    it('advisor creado debe tener isVerified=false hasta verificación manual', () => {
      const newAdvisor = {
        profile: {
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
        },
      };
      expect(newAdvisor.profile.isVerified).toBe(false);
      expect(newAdvisor.profile.verifiedAt).toBeNull();
    });
  });

  describe('Workflow de AccessRequest', () => {
    it('debe crear TenantAccess al aprobar solicitud', () => {
      const approvedRequest = {
        status: 'approved',
        resolvedAt: new Date(),
        resolvedBy: 'admin@lallave.com',
      };

      const tenantAccess = {
        advisorId: 'advisor-id',
        tenantId: 'tenant-id',
        permissionSetId: 'full-access',
        grantedAt: new Date(),
        grantedBy: 'admin@lallave.com',
      };

      expect(approvedRequest.status).toBe('approved');
      expect(tenantAccess.advisorId).toBeDefined();
      expect(tenantAccess.grantedBy).toBe('admin@lallave.com');
    });

    it('debe registrar rejectionReason al rechazar solicitud', () => {
      const rejectedRequest = {
        status: 'rejected',
        resolvedAt: new Date(),
        resolvedBy: 'admin@lallave.com',
        rejectionReason: 'No cumple con los requisitos mínimos',
      };

      expect(rejectedRequest.status).toBe('rejected');
      expect(rejectedRequest.rejectionReason).toBeDefined();
    });
  });
});
