/**
 * CONFIGURACIÓN DE NEXTAUTH.JS (Auth.js v5)
 * FASE 3 - Autenticación con credenciales (email + password)
 */

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    newUser: '/register',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/login') || 
                       nextUrl.pathname.startsWith('/register');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect a /login
      } else if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accountId = (user as any).accountId;
        token.accountType = (user as any).accountType;
        token.accountStatus = (user as any).accountStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).accountId = token.accountId as string;
        (session.user as any).accountType = token.accountType as string;
        (session.user as any).accountStatus = token.accountStatus as string;
      }
      return session;
    },
  },
  providers: [], // Los providers se agregan en auth.ts
} satisfies NextAuthConfig;
