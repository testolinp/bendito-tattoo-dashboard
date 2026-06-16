import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  // Protect dashboard routes — only admin@benditotattoo.com can access
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user || user.email !== "admin@benditotattoo.com") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
