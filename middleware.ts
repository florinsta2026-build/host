import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/edge";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Settings/payments are ADMIN-only; STAFF can be blocked at the page level too,
  // this is a first line of defense for the most sensitive routes.
  const isAdminOnlyRoute = pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/payments");
  if (isAdminOnlyRoute && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl.origin));
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
});

export const config = {
  matcher: ["/admin/:path*"],
};
