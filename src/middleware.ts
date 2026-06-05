import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

async function verifyAdminToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET!;
  const password = process.env.ADMIN_PASSWORD!;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(password));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return token === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes use their own cookie-based auth — skip Supabase session handling
  if (pathname.startsWith("/admin")) {
    if (!pathname.startsWith("/admin/login")) {
      const token = req.cookies.get("errandboi_admin")?.value;
      if (!token || !(await verifyAdminToken(token))) {
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
  await supabase.auth.getUser();

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
