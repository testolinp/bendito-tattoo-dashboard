import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login"];
const adminRoutes = ["/dashboard/users", "/dashboard/cuentas", "/dashboard/pagos", "/dashboard"];

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user) {
    const isAdmin = user.email === "admin@benditotattoo.com" || user.user_metadata?.is_admin === true;
    const isAdminRoute = adminRoutes.some((route) => path === route || (route !== "/dashboard" && path.startsWith(route + "/")));

    if (!isAdmin && isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/turnos";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
