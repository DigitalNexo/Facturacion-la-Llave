/**
 * API - VALIDAR TOKEN DE INVITACIÓN
 * GET /api/invitations/validate?token=xxx
 * Público - valida token antes del registro
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    // Buscar invitación
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar estado
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue utilizada' },
        { status: 400 }
      );
    }

    // Verificar expiración
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    // Retornar datos de la invitación
    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        businessName: (invitation.metadata as any)?.businessName,
        message: (invitation.metadata as any)?.message,
        invitedBy: invitation.inviter.name || invitation.inviter.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error al validar invitación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al validar invitación' },
      { status: 500 }
    );
  }
}
