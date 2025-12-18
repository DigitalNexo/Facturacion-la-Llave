/**
 * CONFIGURACIÓN PRINCIPAL DE AUTENTICACIÓN
 * NextAuth.js v5 con Credentials Provider
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { PrismaClient } from '@fll/db';
import bcrypt from 'bcryptjs';
import { TRIAL } from '@fll/core';

const prisma = new PrismaClient();

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            account: {
              select: {
                id: true,
                accountType: true,
                status: true,
                trialEndsAt: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error('Credenciales inválidas');
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Credenciales inválidas');
        }

        // REGLA OBLIGATORIA: Verificar estado de la cuenta y trial
        const account = user.account;
        const now = new Date();

        // Si está en trial y expiró → bloquear
        if (account.status === 'trialing' && account.trialEndsAt && now > account.trialEndsAt) {
          // Actualizar status a blocked
          await prisma.account.update({
            where: { id: account.id },
            data: { status: 'blocked' },
          });
          throw new Error('Tu periodo de prueba ha expirado. Por favor, activa una suscripción.');
        }

        // Si la cuenta está bloqueada → denegar
        if (account.status === 'blocked') {
          throw new Error('Tu cuenta está bloqueada. Contacta con soporte.');
        }

        // Si no está activa ni en trial válido → denegar
        if (account.status !== 'active' && account.status !== 'trialing') {
          throw new Error('Tu cuenta no está activa.');
        }

        // Login exitoso
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          accountId: account.id,
          accountType: account.accountType,
          accountStatus: account.status,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  // NextAuth v5 usa AUTH_SECRET
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
