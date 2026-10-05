import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes use their own cookie-based auth — skip Supabase session handling
  if (pathname.startsWith("/admin")) {
    if (!pathname.startsWith("/admin/login")) {
      const token = req.cookies.get("errandboi_admin")?.value;
      if (!verifyAdminToken(token)) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // For all other routes: run Supabase session refresh so the token is always
  // fresh before the page server component runs. This prevents the "Lock broken
  // by another request with the 'steal' option" race condition that happens when
  // a server component refreshes the token and then redirect() fires immediately.
  // Public auth pages and anonymous visitors have no session to refresh, so
  // don't make a network round-trip to Supabase on their behalf.
  const hasSession = req.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSession || pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/driver/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if expired — must be called before any page logic
  // Bounded so an unreachable Supabase can't stall every request for ~25s.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("supabase getUser timeout")), 4000)
      ),
    ]);
  } catch (err) {
    console.error("[proxy] session refresh skipped:", err);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/driver/:path*",
    "/dashboard/:path*",
    "/orders/:path*",
    "/book/:path*",
    "/auth/:path*",
  ],
};
