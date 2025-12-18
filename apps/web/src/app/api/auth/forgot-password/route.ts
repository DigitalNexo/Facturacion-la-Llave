/**
 * API: SOLICITAR RESET DE CONTRASEÑA
 * POST /api/auth/forgot-password
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@fll/db';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por seguridad, siempre respondemos OK aunque el email no exista
    // Esto previene enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'Si el email existe, recibirás un enlace de recuperación',
      });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en la base de datos
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // TODO: Enviar email con el enlace
    // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    // await sendEmail({
    //   to: email,
    //   subject: 'Recuperar contraseña - Facturación La Llave',
    //   html: `Click aquí para recuperar tu contraseña: ${resetUrl}`
    // });

    console.log('🔐 Token de reset generado:', token);
    console.log('🔗 URL de reset:', `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`);

    return NextResponse.json({
      message: 'Si el email existe, recibirás un enlace de recuperación',
      // SOLO EN DESARROLLO: incluir token para testing
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error: any) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}
