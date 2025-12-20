/**
 * API ROUTE HANDLER PARA NEXTAUTH.JS
 * Exporta los handlers de NextAuth con tipos compatibles Next.js 15
 */

import { handlers } from '../../../../../../../auth';

export async function GET(request: any) {
  return handlers.GET(request);
}

export async function POST(request: any) {
  return handlers.POST(request);
}

export const runtime = 'nodejs';
