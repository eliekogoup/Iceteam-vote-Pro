import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protéger toutes les routes /admin/*
  if (pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Pas connecté : redirige vers /login
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Vérifier le statut admin dans la table members
    const { data: member } = await supabase
      .from("members")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!member?.is_admin) {
      // Si pas admin, redirige vers la page d'accueil (ou autre)
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Sinon, laisse passer
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
