/**
 * MIDDLEWARE DE NEXTAUTH.JS
 * Protege rutas y verifica estado de cuenta/trial
 */

import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Rutas públicas
  const publicRoutes = ['/', '/login', '/register', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Si no está logueado y trata de acceder a ruta protegida
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL('/login', req.url));
  }

  // Si está logueado y trata de acceder a login/register
  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return Response.redirect(new URL('/dashboard', req.url));
  }

  return undefined; // Continuar
});

export const config = {
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico|public/).*)'],
};
