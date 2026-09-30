import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const NOT_FOUND = "/page-does-not-exist";

export function proxy(request) {
  const token = request.cookies.get("admin_session")?.value;
  const admin = token && verifyAdminToken(token);

  if (!admin || admin.role !== "admin" || !admin.adminId) {
    const response = NextResponse.rewrite(
      new URL(NOT_FOUND, request.url)
    );

    if (token) response.cookies.delete("admin_session");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};