/**
 * TIPOS EXTENDIDOS PARA NEXTAUTH.JS
 * Agrega campos personalizados al User y Session
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    accountId: string;
    accountType: string;
    accountStatus: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      accountId: string;
      accountType: string;
      accountStatus: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    accountId: string;
    accountType: string;
    accountStatus: string;
  }
}
