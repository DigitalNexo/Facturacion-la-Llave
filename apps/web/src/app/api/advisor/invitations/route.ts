/**
 * API ADVISOR - CREAR INVITACIÓN
 * POST /api/advisor/invitations
 * Gestores pueden invitar empresas
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/advisor/invitations
 * Crear invitación para una nueva empresa
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener account del usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { account: true },
    });

    if (!user || user.account?.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Solo gestores pueden crear invitaciones' },
        { status: 403 }
      );
    }

    const { email, businessName, message } = await request.json();

    if (!email || !businessName) {
      return NextResponse.json(
        { error: 'Email y nombre de empresa son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Crear invitación
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        invitedBy: user.id,
        expiresAt,
        metadata: {
          businessName,
          message: message || null,
        },
      },
    });

    // URL de registro con token
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/register?token=${token}`;

    return NextResponse.json({
      message: 'Invitación creada exitosamente',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        invitationUrl,
      },
    });
  } catch (error: any) {
    console.error('Error al crear invitación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear invitación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advisor/invitations
 * Listar invitaciones creadas por el gestor
 */
export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener account del usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { account: true },
    });

    if (!user || user.account?.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Solo gestores pueden ver invitaciones' },
        { status: 403 }
      );
    }

    // Obtener invitaciones
    const invitations = await prisma.invitation.findMany({
      where: { invitedBy: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invitations: invitations.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        businessName: (inv.metadata as any)?.businessName,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
      })),
    });
  } catch (error: any) {
    console.error('Error al listar invitaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar invitaciones' },
      { status: 500 }
    );
  }
}
