import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Admin login must always be accessible
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;

  // No login cookie → show global 404 page
  if (!token) {
    return NextResponse.rewrite(
      new URL("/page-does-not-exist", request.url)
    );
  }

  // Verify JWT
  const admin = verifyAdminToken(token);

  // Invalid/expired/tampered token → show global 404 page
  if (!admin || admin.role !== "admin" || !admin.adminId) {
    const response = NextResponse.rewrite(
      new URL("/page-does-not-exist", request.url)
    );

    response.cookies.delete("admin_session");

    return response;
  }

  // Valid admin → allow request
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};