import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE = 8 * 60 * 60;

function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;

  if (host && !host.startsWith("0.0.0.0")) {
    return `${protocol}//${host}`;
  }

  return process.env.NEXTAUTH_URL ?? url.origin;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const origin = getRequestOrigin(request);

  const failUrl = new URL("/login", origin);
  failUrl.searchParams.set("error", "CredentialsSignin");

  if (!email || !password) {
    return NextResponse.redirect(failUrl, { status: 303 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.active) {
    return NextResponse.redirect(failUrl, { status: 303 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(failUrl, { status: 303 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET manquant");
  }

  const sessionToken = await encode({
    secret,
    maxAge: SESSION_MAX_AGE,
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isChiefDoctor: user.isChiefDoctor,
      permRdv: user.permRdv,
      permFile: user.permFile,
      permPaie: user.permPaie,
      permPatAdm: user.permPatAdm,
      permPatConst: user.permPatConst,
      permPatMed: user.permPatMed,
      permStats: user.permStats,
    },
  });

  const secureCookie = origin.startsWith("https://");
  const cookieName = secureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  await logAudit(user.id, "LOGIN", "User", { email: user.email });
  return NextResponse.redirect(new URL("/dashboard", origin), { status: 303 });
}
