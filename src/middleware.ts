import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Pour le moment, on désactive le middleware d'authentification
  // pour permettre le test des autres fonctionnalités
  
  // Pages qui nécessiteraient une authentification (pour plus tard)
  const protectedPaths = ['/vote', '/admin']
  const publicPaths = ['/auth/login', '/auth/register']
  
  const { pathname } = request.nextUrl

  // Laisser passer toutes les requêtes pour le moment
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}