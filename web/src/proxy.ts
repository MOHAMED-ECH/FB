import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const isChiefDoctor = token?.isChiefDoctor === true;
    const path = req.nextUrl.pathname;

    if (
      (path.startsWith("/dashboard/users") || path.startsWith("/dashboard/audit")) &&
      (role !== "DOCTOR" || !isChiefDoctor)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
