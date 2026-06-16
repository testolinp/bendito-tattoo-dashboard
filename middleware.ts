import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const isAdmin = user.email === "admin@benditotattoo.com" || user.user_metadata?.is_admin === true;
    if (!isAdmin && !request.nextUrl.pathname.startsWith("/dashboard/turnos") && !request.nextUrl.pathname.startsWith("/dashboard/citas")) {
      return NextResponse.redirect(new URL("/dashboard/turnos", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
