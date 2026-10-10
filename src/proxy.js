import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

const NOT_FOUND = "/404";

const MODERATOR_RESTRICTED_PATHS = [
  "/admin/facalites",
  "/admin/booking-slots",
];

function isRestrictedForModerator(pathname) {
  return MODERATOR_RESTRICTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function proxy(request) {
  const token = request.cookies.get("admin_session")?.value;
  const admin = token ? verifyAdminToken(token) : null;

  if (!admin?.adminId || admin.role !== "admin") {
    const response = NextResponse.rewrite(
      new URL(NOT_FOUND, request.url)
    );

    if (token) response.cookies.delete("admin_session");

    return response;
  }

  if (admin.adminLevel === "main") {
    return NextResponse.next();
  }

  if (
    admin.adminLevel === "moderator" &&
    !isRestrictedForModerator(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL(NOT_FOUND, request.url));
}

export const config = {
  matcher: "/admin/:path*",
};